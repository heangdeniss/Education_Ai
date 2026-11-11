import { Client } from "@gradio/client";

const SPACE = import.meta.env.VITE_HF_SPACE;
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || undefined;

let clientPromise = null;

export const isConfigured = Boolean(SPACE && !SPACE.startsWith("your-username"));
export const spaceName = SPACE;

/** Lazily connect (and reuse) a Gradio client for the Space. */
function getClient(onSpaceStatus) {
  if (!clientPromise) {
    clientPromise = Client.connect(SPACE, {
      ...(HF_TOKEN ? { token: HF_TOKEN } : {}),
      events: ["data", "status"],
      status_callback: (s) => onSpaceStatus?.(s),
    }).catch((err) => {
      clientPromise = null; // allow retry on next message
      throw err;
    });
  }
  return clientPromise;
}

function parsePayload(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { answer: raw };
    }
  }
  return raw;
}

/**
 * Stream an answer from the Space's `/chat` endpoint.
 * @param {object} opts
 * @param {string} opts.message
 * @param {{role: string, content: string}[]} opts.history
 * @param {(phase: string, info?: object) => void} opts.onPhase
 * @param {(payload: {answer: string, sources: object[], done: boolean}) => void} opts.onData
 * @param {AbortSignal} opts.signal
 */
export async function streamChat({ message, history, onPhase, onData, signal }) {
  if (!isConfigured) {
    throw new Error(
      "មិនទាន់កំណត់ Space ទេ។ សូមកំណត់ VITE_HF_SPACE នៅក្នុងឯកសារ frontend/.env"
    );
  }

  onPhase?.("connecting");
  const client = await getClient((s) => {
    if (s?.status === "sleeping" || s?.status === "building" || s?.status === "starting") {
      onPhase?.("waking");
    }
  });
  if (signal?.aborted) return;

  const job = client.submit("/chat", [message, JSON.stringify(history)]);
  const cancel = () => job.cancel();
  signal?.addEventListener("abort", cancel);

  try {
    for await (const ev of job) {
      if (signal?.aborted) break;
      if (ev.type === "status") {
        if (ev.stage === "pending") {
          onPhase?.(ev.position > 0 ? "queued" : "searching", { position: ev.position });
        } else if (ev.stage === "error") {
          throw new Error(ev.message || "Space returned an error.");
        } else if (ev.stage === "complete") {
          break;
        }
      } else if (ev.type === "data") {
        const payload = parsePayload(ev.data?.[0]);
        if (payload) {
          onPhase?.(payload.answer ? "writing" : "searching");
          onData(payload);
          if (payload.done) break;
        }
      }
    }
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}
