// Subjects in the RAG knowledge base (RAG/Text_Document) and starter questions.
export const SUBJECTS = [
  {
    id: "history",
    icon: "🏛️",
    name: "ប្រវត្តិវិទ្យា",
    en: "History",
    color: "#c2410c",
    questions: [
      "តើអាណាចក្រអង្គរ ត្រូវបានកសាងឡើងនៅពេលណា?",
      "តើកម្ពុជាទទួលបានឯករាជ្យពីបារាំងនៅឆ្នាំណា?",
    ],
  },
  {
    id: "civics",
    icon: "⚖️",
    name: "សីលធម៌-ពលរដ្ឋវិជ្ជា",
    en: "Morality & Civics",
    color: "#0f766e",
    questions: [
      "តើសិទ្ធិ និងករណីយកិច្ចរបស់ពលរដ្ឋខ្មែរមានអ្វីខ្លះ?",
      "តើលទ្ធិប្រជាធិបតេយ្យ មានន័យដូចម្តេច?",
    ],
  },
  {
    id: "literature",
    icon: "📖",
    name: "អក្សរសាស្ត្រខ្មែរ",
    en: "Khmer Literature · Tum Teav",
    color: "#7c3aed",
    questions: [
      "តើរឿងទុំទាវ ផ្តល់មេរៀនអ្វីខ្លះដល់យុវជន?",
      "តើតួអង្គទុំ មានលក្ខណៈយ៉ាងដូចម្តេច?",
    ],
  },
];

export const STATUS_TEXT = {
  connecting: "កំពុងភ្ជាប់ទៅម៉ាស៊ីន...",
  waking: "ម៉ាស៊ីនកំពុងចាប់ផ្តើម (អាចចំណាយពេល ១-២ នាទី)...",
  queued: "កំពុងរង់ចាំក្នុងជួរ...",
  searching: "កំពុងស្វែងរកក្នុងសៀវភៅ...",
  writing: "កំពុងសរសេរចម្លើយ...",
};
