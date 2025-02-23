import { Server } from "http";
import { SocketEventos, SocketEstatusMensaje } from "shared/enums";
import { Socket } from "socket.io";
import { ChatStorage } from "./chat.storage";
import { IChatMessage } from "shared/interfaces";

// Add at the top level with ioInstance
let ioInstance: any;
const userSockets = new Map<string, string>();

// Store active typing users
const typingUsers = new Set<string>();
const onlineUsers = new Set<string>();

export const socketsSetup = (server: Server): void => {
  const io = require("socket.io")(server, {
    cors: {
      origin: [
        "http://localhost:8080",
        "http://10.0.0.25:8080",
        "http://localhost:8000",
        "https://inflaweb.nvictor.me",
        "https://inflapanel.nvictor.me",
        process.env.SITE_URL as string,
      ],
      methods: ["GET", "POST"],
    },
  });

  // Store the io instance for external use
  ioInstance = io;

  io.on(SocketEventos.connect, (socket: Socket) => {
    const userId = socket.handshake.auth?.userId;

    if (!userId) {
      console.log("Socket connection rejected - no user ID");
      socket.disconnect();
      return;
    }

    // Add user to online users and notify all clients
    userSockets.set(userId, socket.id);
    onlineUsers.add(userId);
    io.emit("presenceUpdate", Array.from(onlineUsers));

    console.log("usuario conectado", { socketId: socket.id, userId });

    socket.on(SocketEventos.disconnect, () => {
      console.log("usuario desconectado", { socketId: socket.id, userId });
      typingUsers.delete(userId);
      userSockets.delete(userId);
      onlineUsers.delete(userId);
      io.emit("presenceUpdate", Array.from(onlineUsers));
      io.emit("typingUsers", Array.from(typingUsers));
    });

    socket.on(SocketEventos.mensaje, async (msg: IChatMessage) => {
      console.log("mensaje recibido: ", JSON.stringify(msg));

      const messageWithSender: IChatMessage = {
        ...msg,
        sender: {
          id: userId,
          type: "user",
        },
        timestamp: new Date(msg.timestamp).toISOString(),
      };

      await ChatStorage.saveMessage(messageWithSender);

      socket.emit(SocketEventos.messageStatus, {
        messageId: msg.id,
        status: SocketEstatusMensaje.recibido,
      });

      const recipientSocketId = userSockets.get(msg.recipient.id);

      if (recipientSocketId) {
        io.to(recipientSocketId).emit(SocketEventos.mensaje, messageWithSender);
      } else {
        console.log(`Recipient ${msg.recipient.id} not connected`);
      }
    });

    // Add endpoint to fetch chat history
    socket.on(
      "fetchChatHistory",
      async ({ otherUserId }: { otherUserId: string }) => {
        try {
          const messages = await ChatStorage.getMessages(userId, otherUserId);
          socket.emit("chatHistory", messages);
        } catch (error) {
          console.error("Error fetching chat history:", error);
        }
      }
    );

    socket.on(SocketEventos.typing, (recipientId: string) => {
      const recipientSocketId = userSockets.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typingUsers", [userId]);
      }
    });

    socket.on(SocketEventos.stopTyping, (recipientId: string) => {
      const recipientSocketId = userSockets.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typingUsers", []);
      }
    });
  });
};

// Add this new function to emit events from anywhere in the application
export const emitSocketEvent = (
  userId: string,
  event: string,
  data: any
): void => {
  if (!ioInstance) {
    console.warn("Socket.IO instance not initialized");
    return;
  }

  const socketId = userSockets.get(userId);
  if (socketId) {
    ioInstance.to(socketId).emit(event, data);
  } else {
    console.log(`User ${userId} not connected to socket`);
  }
};
