import { HiOutlinePlus, HiOutlineTrash, HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { useLanguage } from "../../hooks/useLanguage.js";

function ChatSidebar({ chats, activeChatId, onSelect, onNew, onDelete }) {
  const { t } = useLanguage();
  return (
    <div className="flex h-full min-w-0 w-full flex-col">
      <button
        type="button"
        onClick={onNew}
         className="btn-primary flex w-full min-w-0 items-center justify-center gap-2 !px-3 !py-2.5 text-sm"
      >
        <HiOutlinePlus className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">{t("chat.newConversation")}</span>
      </button>

      <div className="mt-4 flex-1 space-y-1.5 overflow-y-auto">
        {chats.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-mist-400">{t("chat.noConversations")}</p>
        )}

        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`group flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2.5 transition-colors ${
              chat._id === activeChatId ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
            }`}
            onClick={() => onSelect(chat._id)}
          >
            <HiOutlineChatBubbleLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-signal-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{chat.title}</p>
              {chat.preview && (
                <p className="truncate text-xs text-mist-400">{chat.preview}</p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chat._id);
              }}
              className="shrink-0 rounded p-1 text-mist-400 opacity-0 hover:text-alert-400 group-hover:opacity-100"
              title={t("chat.deleteConversation")}
            >
              <HiOutlineTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatSidebar;
