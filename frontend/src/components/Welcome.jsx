import { SUBJECTS } from "../data.js";

export default function Welcome({ onAsk }) {
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <div className="welcome-logo">🎓</div>
        <h1>សួស្តី! តើអ្នកចង់រៀនអ្វីថ្ងៃនេះ?</h1>
        <p className="muted">
          សួរសំណួរអំពីមេរៀនថ្នាក់ទី១២ ហើយខ្ញុំនឹងឆ្លើយដោយផ្អែកលើសៀវភៅសិក្សា
        </p>
      </div>

      <div className="subject-grid">
        {SUBJECTS.map((s) => (
          <section key={s.id} className="subject-card" style={{ "--accent": s.color }}>
            <header>
              <span className="subject-icon">{s.icon}</span>
              <div>
                <h3>{s.name}</h3>
                <span className="muted small">{s.en}</span>
              </div>
            </header>
            {s.questions.map((q) => (
              <button key={q} className="suggestion" onClick={() => onAsk(q)}>
                {q}
              </button>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
