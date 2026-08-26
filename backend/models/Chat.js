import mongoose from "mongoose";

// Embedded rather than a separate collection, same reasoning as
// Reminder's embedded logs — a conversation's messages are always
// queried and rendered together with the conversation itself.
const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Auto-derived from the first user message so the sidebar has
    // something readable without an extra AI call just for a title.
    title: { type: String, default: "New conversation", trim: true },

    messages: { type: [chatMessageSchema], default: [] },

    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

chatSchema.index({ user: 1, lastMessageAt: -1 });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
