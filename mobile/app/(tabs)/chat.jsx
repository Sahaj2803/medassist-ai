import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import TextField from "../../components/ui/themed/TextField";
import IconButton from "../../components/ui/themed/IconButton";
import BottomSheet from "../../components/ui/themed/BottomSheet";
import { Loading, EmptyState } from "../../components/ui/themed/States";
import chatApi from "../../services/chatApi";
import { getErrorMessage } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

// Simple, calm questions to help a non-technical user get started. Purely
// a UI convenience — tapping one still goes through the same real
// send flow / API call as typing it in, nothing is faked here.
const SUGGESTIONS = [
  "What is this medicine for?",
  "Any side effects to watch for?",
  "Can I take these together?",
];

function TypingDots() {
  const { theme } = useTheme();
  const dots = useRef([new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)]).current;

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 320, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.typingBubbleRow}>
      <View style={[styles.avatarCircle, { backgroundColor: `${theme.colors.teal}1F` }]}>
        <Ionicons name="medkit" size={14} color={theme.colors.teal} />
      </View>
      <View
        style={[
          styles.bubble,
          styles.bubbleAssistant,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.typingDotsRow}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[styles.typingDot, { backgroundColor: theme.colors.textSecondary, opacity: dot }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function ChatBubble({ message }) {
  const { theme } = useTheme();
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowUser]}>
        <View style={[styles.bubble, styles.bubbleUser, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.bubbleTextUser}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.avatarCircle, { backgroundColor: `${theme.colors.teal}1F` }]}>
        <Ionicons name="medkit" size={14} color={theme.colors.teal} />
      </View>
      <View
        style={[
          styles.bubble,
          styles.bubbleAssistant,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.bubbleTextAssistant, { color: theme.colors.textPrimary }]}>{message.content}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [listVisible, setListVisible] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const listRef = useRef(null);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const { chats } = await chatApi.list();
      setConversations(chats || []);
    } catch {
      // Non-fatal — the history sheet is a convenience, not critical path.
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
    setError("");
  };

  const confirmDeleteConversation = (conversation) => {
    if (deletingId) return; // Prevent duplicate delete actions while one is in flight.
    Alert.alert(
      "Delete conversation",
      `Delete "${conversation.title || "this conversation"}"? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteConversation(conversation._id),
        },
      ]
    );
  };

  const handleDeleteConversation = async (id) => {
    setError("");
    setDeletingId(id);
    try {
      await chatApi.remove(id);
      // Persisted server-side — reflect it in the list immediately.
      setConversations((prev) => prev.filter((c) => c._id !== id));
      // If the conversation being deleted is the one currently open,
      // navigate safely back to a clean state rather than leaving the
      // screen pointed at a chat that no longer exists.
      if (chatId === id) {
        setChatId(null);
        setMessages([]);
      }
    } catch (e) {
      // Covers "already deleted" (404) and any other API error the same
      // way — surface it, leave the list as-is, let the user retry.
      setError(getErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  const sendText = async (text) => {
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

  const handleSend = () => sendText(input.trim());
  const handleSuggestion = (text) => sendText(text);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={["top", "left", "right"]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerBrand}>
          <View style={[styles.brandIcon, { backgroundColor: `${theme.colors.teal}1F` }]}>
            <Ionicons name="medkit" size={18} color={theme.colors.teal} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>MedAssist AI</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>Your health assistant</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton accessibilityLabel="Start a new chat" onPress={startNewChat}>
            <Ionicons name="add" size={20} color={theme.colors.textPrimary} />
          </IconButton>
          <IconButton
            accessibilityLabel="View conversation history"
            onPress={() => {
              setError("");
              setListVisible(true);
            }}
          >
            <Ionicons name="time-outline" size={19} color={theme.colors.textPrimary} />
          </IconButton>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        {messages.length === 0 ? (
          <View style={styles.flex}>
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="How can I help with your health today?"
              message="Ask about your medicines, symptoms, or general health questions. This is informational only, not a diagnosis."
            />
            <View style={styles.suggestionsWrap}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => handleSuggestion(s)}
                  style={({ pressed }) => [
                    styles.suggestionChip,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.suggestionText, { color: theme.colors.primary }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, idx) => String(idx)}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => <ChatBubble message={item} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={sending ? <TypingDots /> : null}
          />
        )}

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: `${theme.colors.error}12`, borderColor: `${theme.colors.error}40` }]}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextField
              value={input}
              onChangeText={setInput}
              placeholder="Ask a health question..."
              autoCapitalize="sentences"
              onSubmitEditing={handleSend}
              style={styles.inputField}
            />
          </View>
          <IconButton
            variant="primary"
            size={50}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </IconButton>
        </View>
      </KeyboardAvoidingView>

      <BottomSheet visible={listVisible} onClose={() => setListVisible(false)} title="Conversations" maxHeight="70%">
        {error ? (
          <View style={[styles.errorBanner, styles.modalErrorBanner, { backgroundColor: `${theme.colors.error}12`, borderColor: `${theme.colors.error}40` }]}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : null}
        {loadingList ? (
          <Loading />
        ) : conversations.length === 0 ? (
          <Text style={[styles.emptyListText, { color: theme.colors.textSecondary }]}>No past conversations yet.</Text>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item._id}
            style={styles.spacedTop}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.convoRow,
                  { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.border },
                  chatId === item._id && { borderColor: theme.colors.primary },
                ]}
              >
                <Pressable onPress={() => openConversation(item._id)} style={styles.convoPress} disabled={deletingId === item._id}>
                  <View style={[styles.avatarCircle, { backgroundColor: `${theme.colors.primary}17` }]}>
                    <Ionicons name="chatbubble-outline" size={15} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.convoTitle, styles.flex1, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDeleteConversation(item)}
                  style={styles.deleteButton}
                  disabled={deletingId === item._id}
                  hitSlop={8}
                >
                  {deletingId === item._id ? (
                    <ActivityIndicator size="small" color={theme.colors.error} />
                  ) : (
                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                  )}
                </Pressable>
              </View>
            )}
          />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSubtitle: { fontSize: 12.5, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8 },
  suggestionsWrap: { paddingHorizontal: 20, paddingBottom: 16, gap: 8 },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  suggestionText: { fontSize: 14, fontWeight: "600" },
  messagesList: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 2 },
  bubbleRowUser: { justifyContent: "flex-end" },
  avatarCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingVertical: 11, paddingHorizontal: 14 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAssistant: { borderBottomLeftRadius: 4, borderWidth: 1 },
  bubbleTextUser: { color: "#FFFFFF", fontSize: 14.5, lineHeight: 21 },
  bubbleTextAssistant: { fontSize: 14.5, lineHeight: 21 },
  typingBubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 20, marginTop: 4 },
  typingDotsRow: { flexDirection: "row", gap: 4, paddingVertical: 2 },
  typingDot: { width: 6, height: 6, borderRadius: 3 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalErrorBanner: { marginHorizontal: 0, marginTop: 10, marginBottom: 0 },
  errorText: { flex: 1, fontSize: 13, fontWeight: "500" },
  inputRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 14, alignItems: "flex-end" },
  inputWrap: { flex: 1 },
  inputField: { marginBottom: 0 },
  spacedTop: { marginTop: 8 },
  emptyListText: { fontSize: 14, marginTop: 16, textAlign: "center" },
  convoRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  convoPress: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  convoTitle: { fontSize: 14.5, fontWeight: "600" },
  deleteButton: { padding: 8, marginLeft: 4 },
  flex1: { flex: 1 },
});
