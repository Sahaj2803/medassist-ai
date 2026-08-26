import Chat from "../models/Chat.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import aiGateway from "../ai/aiGateway.js";
import { deriveTitle } from "../utils/deriveTitle.js";

/**
 * @route   GET /api/chat
 * @access  Private
 * @desc    All of the user's conversation threads, most recent first,
 *          with a lightweight preview for the sidebar.
 */
export const listChats = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ user: req.user.id })
    .select("title lastMessageAt createdAt messages")
    .sort({ lastMessageAt: -1 });

  const summaries = chats.map((c) => ({
    _id: c._id,
    title: c.title,
    lastMessageAt: c.lastMessageAt,
    createdAt: c.createdAt,
    messageCount: c.messages.length,
    preview: c.messages[c.messages.length - 1]?.content?.slice(0, 80) || "",
  }));

  res.status(200).json({ success: true, chats: summaries });
});

/**
 * @route   GET /api/chat/:id
 * @access  Private
 */
export const getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user.id });
  if (!chat) {
    throw new AppError("Conversation not found", 404);
  }
  res.status(200).json({ success: true, chat });
});

/**
 * @route   POST /api/chat
 * @access  Private
 * @desc    Sends a message. If chatId is provided and belongs to the
 *          user, appends to that thread; otherwise starts a new one.
 *          Returns the full updated chat so the frontend can render
 *          straight from the response without a second fetch.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { message, chatId } = req.body;

  if (!message || !message.trim()) {
    throw new AppError("Message is required", 400);
  }
  if (message.length > 4000) {
    throw new AppError("Message is too long (4000 characters max)", 400);
  }

  let chat;
  if (chatId) {
    chat = await Chat.findOne({ _id: chatId, user: req.user.id });
    if (!chat) {
      throw new AppError("Conversation not found", 404);
    }
  } else {
    chat = new Chat({ user: req.user.id, messages: [] });
  }

  const priorMessages = chat.messages.map((m) => ({ role: m.role, content: m.content }));

  chat.messages.push({ role: "user", content: message.trim() });

  if (chat.messages.length === 1) {
    chat.title = deriveTitle(message);
  }

  try {
    const reply = await aiGateway.chat(priorMessages, message.trim(), req.user.id, req.user.preferredLanguage);
    chat.messages.push({ role: "assistant", content: reply });
  } catch (err) {
    // Persist the user's message even if the AI call fails, so they
    // don't lose what they typed — but surface the error to the client.
    chat.lastMessageAt = new Date();
    await chat.save();
    throw err;
  }

  chat.lastMessageAt = new Date();
  await chat.save();

  res.status(200).json({ success: true, chat });
});

/**
 * @route   DELETE /api/chat/:id
 * @access  Private
 */
export const deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!chat) {
    throw new AppError("Conversation not found", 404);
  }
  res.status(200).json({ success: true, message: "Conversation deleted" });
});
