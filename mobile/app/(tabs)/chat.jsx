import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import TextField from "../../components/ui/TextField";
import { Loading, EmptyState } from "../../components/ui/States";
import chatApi from "../../services/chatApi";
import { getErrorMessage } from "../../services/api";
import { colors, typography, spacing, radii } from "../../constants/theme";

function ChatBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}>{message.content}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [listVisible, setListVisible] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const { chats } = await chatApi.list();
      setConversations(chats || []);
    } catch {
      // Non-fatal — the sidebar list is a convenience, not critical path.
    } finally {
      setLoadingList(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const openConversation = async (id) => {
    setListVisible(false);
    try {
      const { chat } = await chatApi.getById(id);
      setChatId(chat._id);
      setMessages(chat.messages || []);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const startNewChat = () => {
    setListVisible(false);
    setChatId(null);
    setMessages([]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError("");
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      const { chat } = await chatApi.send(text, chatId);
      setChatId(chat._id);
      setMessages(chat.messages || []);
      loadConversations();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={typography.h1}>AI Chat</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={startNewChat} style={styles.headerButton}>
            <Ionicons name="add" size={20} color={colors.white} />
          </Pressable>
          <Pressable onPress={() => setListVisible(true)} style={styles.headerButton}>
            <Ionicons name="time-outline" size={20} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        {messages.length === 0 ? (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="Ask MedAssist AI"
            message="Ask about your medicines, symptoms, or general health questions. This is informational only, not a diagnosis."
          />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, idx) => String(idx)}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => <ChatBubble message={item} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {sending ? (
          <View style={styles.typingRow}>
            <Text style={typography.caption}>MedAssist AI is typing...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextField
              value={input}
              onChangeText={setInput}
              placeholder="Ask a health question..."
              autoCapitalize="sentences"
              onSubmitEditing={handleSend}
            />
          </View>
          <Pressable onPress={handleSend} disabled={!input.trim() || sending} style={styles.sendButton}>
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={listVisible} animationType="slide" transparent onRequestClose={() => setListVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setListVisible(false)} />
        <View style={styles.modalSheet}>
          <Text style={typography.h3}>Conversations</Text>
          {loadingList ? (
            <Loading />
          ) : conversations.length === 0 ? (
            <Text style={[typography.bodyMuted, styles.spacedTop]}>No past conversations yet.</Text>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item._id}
              style={styles.spacedTop}
              renderItem={({ item }) => (
                <Pressable onPress={() => openConversation(item._id)} style={styles.convoRow}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.mist[400]} />
                  <Text style={[typography.body, styles.flex1]} numberOfLines={1}>{item.title}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink[950] },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.ink[800],
    alignItems: "center",
    justifyContent: "center",
  },
  messagesList: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  bubbleRow: { flexDirection: "row", marginBottom: spacing.sm },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubble: { maxWidth: "82%", borderRadius: radii.lg, paddingVertical: 10, paddingHorizontal: spacing.md },
  bubbleUser: { backgroundColor: colors.brand[600], borderBottomRightRadius: 4 },
  bubbleAssistant: { backgroundColor: colors.ink[800], borderBottomLeftRadius: 4 },
  bubbleTextUser: { color: colors.white, fontSize: 14, lineHeight: 20 },
  bubbleTextAssistant: { color: colors.mist[100], fontSize: 14, lineHeight: 20 },
  typingRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xs },
  error: { color: colors.alert[400], paddingHorizontal: spacing.lg, fontSize: 13, marginBottom: spacing.xs },
  inputRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, alignItems: "flex-end" },
  inputWrap: { flex: 1 },
  sendButton: {
    width: 46,
    height: 50,
    borderRadius: radii.md,
    backgroundColor: colors.signal[500],
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: {
    backgroundColor: colors.ink[900],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "70%",
  },
  spacedTop: { marginTop: spacing.md },
  convoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  flex1: { flex: 1 },
});
