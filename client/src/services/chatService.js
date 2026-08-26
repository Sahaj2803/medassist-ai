import api from "./api.js";

export const chatService = {
  list: () => api.get("/chat").then((r) => r.data),
  getById: (id) => api.get(`/chat/${id}`).then((r) => r.data),
  send: (message, chatId) =>
    api.post("/chat", { message, chatId }).then((r) => r.data),
  remove: (id) => api.delete(`/chat/${id}`).then((r) => r.data),
};

export default chatService;
