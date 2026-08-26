import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { HiOutlinePaperAirplane, HiOutlineSparkles, HiOutlineBars3, HiOutlineXMark, HiOutlinePlus } from "react-icons/hi2";
import chatService from "../../services/chatService.js";
import ChatSidebar from "../../components/chat/ChatSidebar.jsx";
import ChatBubble from "../../components/chat/ChatBubble.jsx";
import PageLoader from "../../components/common/PageLoader.jsx";
import { useLanguage } from "../../hooks/useLanguage.js";

function ChatPage() {
  const { t } = useLanguage();
  const { id: chatIdParam } = useParams();
  const navigate = useNavigate();

  const SUGGESTED_PROMPTS = [
    t("chat.suggestedPrompt1"),
    t("chat.suggestedPrompt2"),
    t("chat.suggestedPrompt3"),
  ];

  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [activeChat, setActiveChat] = useState(null); // full chat doc, or null for a fresh conversation
  const [loadingActiveChat, setLoadingActiveChat] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  const loadChats = async () => {
    try {
      const { chats: data } = await chatService.list();
      setChats(data);
    } catch (err) {
      toast.error(err.response?.data?.message || t("chat.couldNotLoad"));
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!chatIdParam) {
      setActiveChat(null);
      return;
    }
    setLoadingActiveChat(true);
    chatService
      .getById(chatIdParam)
      .then(({ chat }) => setActiveChat(chat))
      .catch((err) => {
        toast.error(err.response?.data?.message || t("chat.notFoundToast"));
        navigate("/chat", { replace: true });
      })
      .finally(() => setLoadingActiveChat(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatIdParam, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages?.length, sending]);

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);

    // Optimistic: show the user's message immediately.
    const optimisticChat = activeChat
      ? { ...activeChat, messages: [...activeChat.messages, { role: "user", content: text }] }
      : { _id: null, title: t("chat.newConversation"), messages: [{ role: "user", content: text }] };
    setActiveChat(optimisticChat);

    try {
      const { chat } = await chatService.send(text, activeChat?._id);
      setActiveChat(chat);
      if (!activeChat?._id) {
        navigate(`/chat/${chat._id}`, { replace: true });
      }
      loadChats();
    } catch (err) {
      toast.error(err.response?.data?.message || t("chat.couldNotRespond"));
      // Roll back to the last known-good state from the server rather
      // than leaving an unconfirmed optimistic message on screen.
      if (activeChat?._id) {
        chatService.getById(activeChat._id).then(({ chat }) => setActiveChat(chat));
      } else {
        setActiveChat(null);
      }
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = () => {
    navigate("/chat");
    setMobileSidebarOpen(false);
  };

  const handleSelectChat = (id) => {
    navigate(`/chat/${id}`);
    setMobileSidebarOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("chat.deleteConfirm"))) return;
    try {
      await chatService.remove(id);
      setChats((prev) => prev.filter((c) => c._id !== id));
      if (activeChat?._id === id) navigate("/chat");
      toast.success(t("chat.deletedToastSuccess"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("chat.couldNotDelete"));
    }
  };

  if (loadingChats) return <PageLoader />;

  return (
    <div className="container-shell flex h-[calc(100vh-4rem)] max-w-6xl flex-col py-4 md:py-8">
      {/* Mobile-only bar: sidebar is hidden below md:, so this is the only
          way to see past conversations or start a new one on a phone. */}
      <div className="mb-3 flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="btn-secondary !px-3 !py-1.5 text-sm"
        >
          <HiOutlineBars3 className="h-4 w-4" />
          {t("chat.historyLabel")}
        </button>
        <button
          type="button"
          onClick={handleNewChat}
          className="btn-primary !px-3 !py-1.5 text-sm"
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t("chat.newChat")}
        </button>
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="glass-panel-strong absolute inset-y-4 left-4 right-16 flex flex-col p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-white">{t("chat.conversations")}</span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg p-1.5 text-mist-300 hover:bg-white/5"
                aria-label={t("chat.close")}
              >
                <HiOutlineXMark className="h-5 w-5" />
              </button>
            </div>
            <ChatSidebar
              chats={chats}
              activeChatId={activeChat?._id}
              onSelect={handleSelectChat}
              onNew={handleNewChat}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}

      <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-[280px_minmax(0,1fr)] lg:gap-6">
        <aside className="glass-panel hidden min-w-0 overflow-hidden p-3 md:flex">
          <ChatSidebar
            chats={chats}
            activeChatId={activeChat?._id}
            onSelect={handleSelectChat}
            onNew={handleNewChat}
            onDelete={handleDelete}
          />
        </aside>

        <div className="glass-panel flex min-w-0 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {loadingActiveChat ? (
              <PageLoader />
            ) : !activeChat || activeChat.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient">
                  <HiOutlineSparkles className="h-6 w-6 text-white" />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-white">{t("chat.askAnything")}</h2>
                <p className="mt-1 max-w-sm text-sm text-mist-300">{t("chat.introText")}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-mist-200 hover:bg-white/5"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {activeChat.messages.map((m, i) => (
                  <ChatBubble key={i} role={m.role} content={m.content} />
                ))}
                {sending && <ChatBubble role="assistant" content={t("chat.thinking")} />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-end gap-2 border-t border-white/10 p-4"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder={t("chat.inputPlaceholder")}
              className="max-h-32 flex-1 resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-mist-400 focus:border-signal-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="btn-primary !px-3.5 !py-2.5"
              aria-label={t("chat.sendMessage")}
            >
              <HiOutlinePaperAirplane className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
