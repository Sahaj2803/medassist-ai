import { HiOutlineSparkles, HiOutlineUserCircle } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

// Recognized section labels from the symptom-checker response format
// (see backend/ai/prompts/chat.prompt.js). Bolding just these lines
// makes a structured symptom response easy to scan without touching
// the rest of the chat UI or requiring the AI to return markdown/JSON.
// The AI is instructed to use the localized label text for the current
// response language, so these must be kept in sync with chat.prompt.js.
function useSymptomSectionHeaders() {
  const { t } = useLanguage();
  return [
    t("chat.symptomHeader1"),
    t("chat.symptomHeader2"),
    t("chat.symptomHeader3"),
    t("chat.symptomHeader4"),
    t("chat.symptomHeader5"),
  ];
}

function renderContent(content, headers) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    const isHeader = headers.includes(line.trim());
    return (
      <span key={i}>
        {isHeader ? <strong className="text-white">{line}</strong> : line}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  const headers = useSymptomSectionHeaders();

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-white/10" : "bg-brand-gradient"
        }`}
      >
        {isUser ? (
          <HiOutlineUserCircle className="h-5 w-5 text-mist-200" />
        ) : (
          <HiOutlineSparkles className="h-4 w-4 text-white" />
        )}
      </span>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-brand-600/20 text-white"
            : "glass-panel text-mist-100"
        }`}
      >
        <p className="whitespace-pre-wrap">{renderContent(content, headers)}</p>
      </div>
    </div>
  );
}

export default ChatBubble;
