import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sources from "./Sources.jsx";
import { CheckIcon, CopyIcon, RefreshIcon } from "./Icons.jsx";
import { STATUS_TEXT } from "../data.js";

export default function Message({ message, phase, isLast, onRegenerate }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isUser) {
    return (
      <div className="msg user">
        <div className="bubble">{message.content}</div>
      </div>
    );
  }

  const thinking = message.pending && !message.content;

  return (
    <div className="msg bot">
      <div className="avatar">🎓</div>
      <div className="msg-body">
        {thinking ? (
          <div className="thinking">
            <span className="dots"><i /><i /><i /></span>
            <span className="muted">{STATUS_TEXT[phase] || STATUS_TEXT.searching}</span>
          </div>
        ) : (
          <div className={`markdown ${message.pending ? "streaming" : ""}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.error && (
          <div className="error-box">⚠️ {message.error}</div>
        )}

        <Sources sources={message.sources} />

        {!message.pending && message.content && (
          <div className="msg-actions">
            <button className="icon-btn" title="ចម្លង" onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
            </button>
            {isLast && (
              <button className="icon-btn" title="ឆ្លើយម្តងទៀត" onClick={onRegenerate}>
                <RefreshIcon />
              </button>
            )}
          </div>
        )}
        {!message.pending && !message.content && message.error && isLast && (
          <div className="msg-actions">
            <button className="retry-btn" onClick={onRegenerate}>
              <RefreshIcon /> ព្យាយាមម្តងទៀត
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
