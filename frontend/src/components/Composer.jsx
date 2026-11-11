import { useEffect, useRef } from "react";
import { SendIcon, StopIcon } from "./Icons.jsx";

export default function Composer({ value, onChange, onSend, onStop, busy }) {
  const ref = useRef(null);

  // Auto-grow textarea.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  useEffect(() => {
    if (!busy) ref.current?.focus();
  }, [busy]);

  const submit = (e) => {
    e?.preventDefault();
    if (busy) return onStop();
    if (value.trim()) onSend(value);
  };

  return (
    <form className="composer" onSubmit={submit}>
      <div className="composer-box">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder="សរសេរសំណួររបស់អ្នកនៅទីនេះ..."
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="submit"
          className={`send-btn ${busy ? "stop" : ""}`}
          disabled={!busy && !value.trim()}
          title={busy ? "បញ្ឈប់" : "ផ្ញើ"}
        >
          {busy ? <StopIcon width={16} height={16} /> : <SendIcon width={18} height={18} />}
        </button>
      </div>
      <p className="disclaimer">
        AI អាចមានកំហុស។ សូមផ្ទៀងផ្ទាត់ជាមួយសៀវភៅសិក្សា ឬគ្រូរបស់អ្នក។
      </p>
    </form>
  );
}
