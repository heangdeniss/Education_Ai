import { ChatIcon, PlusIcon, TrashIcon } from "./Icons.jsx";
import { SUBJECTS } from "../data.js";

export default function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onClose }) {
  const items = conversations.filter((c) => c.messages.length > 0);

  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-logo">🎓</span>
          <div>
            <div className="brand-title">ជំនួយការសិក្សា</div>
            <div className="brand-sub">ថ្នាក់ទី១២ · Grade 12 Tutor</div>
          </div>
        </div>

        <button className="new-chat" onClick={onNew}>
          <PlusIcon width={18} height={18} /> ការសន្ទនាថ្មី
        </button>

        <div className="side-section-label">ប្រវត្តិសន្ទនា</div>
        <nav className="conv-list">
          {items.length === 0 && <p className="muted small pad">មិនទាន់មានការសន្ទនានៅឡើយ</p>}
          {items.map((c) => (
            <div
              key={c.id}
              className={`conv-item ${c.id === activeId ? "active" : ""}`}
              onClick={() => onSelect(c.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(c.id)}
            >
              <ChatIcon />
              <span className="conv-title">{c.title || "ការសន្ទនាថ្មី"}</span>
              <button
                className="icon-btn conv-del"
                title="លុប"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </nav>

        <div className="side-footer">
          <div className="side-section-label">មុខវិជ្ជា</div>
          {SUBJECTS.map((s) => (
            <div key={s.id} className="subject-row">
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
