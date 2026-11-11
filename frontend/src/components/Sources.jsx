import { useState } from "react";
import { BookIcon, ChevronIcon } from "./Icons.jsx";

export default function Sources({ sources }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  if (!sources?.length) return null;

  return (
    <div className="sources">
      <button className="sources-toggle" onClick={() => setOpen((o) => !o)}>
        <BookIcon />
        ឯកសារយោង ({sources.length})
        <ChevronIcon className={`chev ${open ? "up" : ""}`} />
      </button>
      {open && (
        <ol className="source-list">
          {sources.map((s, i) => (
            <li key={i} className="source-item">
              <button
                className="source-head"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <span className="source-num">{i + 1}</span>
                <span className="source-subject">{s.subject}</span>
                {typeof s.score === "number" && (
                  <span className="source-score">{Math.round(s.score * 100)}%</span>
                )}
              </button>
              <p className={`source-text ${expanded === i ? "full" : ""}`}>{s.text}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
