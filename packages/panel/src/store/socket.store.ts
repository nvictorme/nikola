import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { IChatMessage } from "shared/interfaces";

interface UnreadCount {
  [userId: string]: number;
}

interface SocketStore {
  messages: IChatMessage[];
  unreadCounts: UnreadCount;
  onlineUsers: string[];
  addMessage: (message: IChatMessage) => void;
  updateMessageStatus: (
    messageId: string,
    status: IChatMessage["status"]
  ) => void;
  incrementUnreadCount: (userId: string) => void;
  clearUnreadCount: (userId: string) => void;
  getMessagesForUser: (userId: string, currentUserId: string) => IChatMessage[];
  setOnlineUsers: (users: string[]) => void;
}

export const useSocketStore = create<SocketStore>()(
  persist(
    (set, get) => ({
      messages: [],
      unreadCounts: {},
      onlineUsers: [],
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      updateMessageStatus: (messageId, status) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, status } : msg
          ),
        })),
      incrementUnreadCount: (userId) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [userId]: (state.unreadCounts[userId] || 0) + 1,
          },
        })),
      clearUnreadCount: (userId) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [userId]: 0,
          },
        })),
      getMessagesForUser: (userId, currentUserId) => {
        return get().messages.filter(
          (msg) =>
            (msg.sender.id === userId && msg.recipient.id === currentUserId) ||
            (msg.sender.id === currentUserId && msg.recipient.id === userId)
        );
      },
      setOnlineUsers: (users) => set({ onlineUsers: users }),
    }),
    {
      name: "socket-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
