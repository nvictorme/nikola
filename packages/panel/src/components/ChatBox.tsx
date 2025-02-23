import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Maximize2,
  Minimize2,
  X,
  Check,
  CheckCheck,
  File,
  X as XIcon,
  MessageCircle,
  VolumeX,
  Volume2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useSocket } from "@/providers/socket.provider";
import { SocketEventos, SocketTipoMensaje } from "shared/enums";
import { useSocketStore } from "@/store/socket.store";
import { useAuthStore } from "@/store/auth.store";
import { IChatMessage, IUsuario } from "shared/interfaces";
import { ApiClient } from "@/api/api.client";
import { Badge } from "@/components/ui/badge";
import { nanoid } from "nanoid";

// Option 1: Short "pop" sound
const NOTIFICATION_SOUND_URL =
  "https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3";

// Option 2: Message notification
// const NOTIFICATION_SOUND_URL = "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=notification-sound-7062.mp3";

// Option 3: Simple "ding"
// const NOTIFICATION_SOUND_URL = "https://www.soundjay.com/button/sounds/button-1.mp3";

export default function ChatBox() {
  const socket = useSocket();
  const { user } = useAuthStore();
  const {
    messages,
    unreadCounts,
    onlineUsers,
    addMessage,
    updateMessageStatus,
    incrementUnreadCount,
    clearUnreadCount,
    getMessagesForUser,
    setOnlineUsers,
  } = useSocketStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [usuarios, setUsuarios] = useState<IUsuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const selectedUser = usuarios.find((u) => u.id === selectedUserId);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const { data } = await new ApiClient().get("/usuarios/chat", {});
        setUsuarios(data.usuarios);
      } catch (error) {
        console.error("Error fetching usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.on(SocketEventos.mensaje, (data: IChatMessage) => {
      if (data.sender.id !== user?.id) {
        const newMessage: IChatMessage = {
          id: nanoid(),
          sender: data.sender,
          contenido: data.contenido,
          timestamp: new Date(data.timestamp).toISOString(),
          status: "sent",
          tipo: data.tipo,
          recipient: {
            id: user?.id || "",
            type: "user",
          },
          attachment: data.attachment,
        };
        addMessage(newMessage);
        setIsTyping(false);

        if (!isOpen || data.sender.id !== selectedUserId) {
          incrementUnreadCount(data.sender.id);
        }

        if (!isOpen && audioRef.current && !isMuted) {
          audioRef.current.play().catch((error) => {
            console.log("Audio playback failed:", error);
          });
        }
      }
    });

    socket.on(
      SocketEventos.messageStatus,
      (data: { messageId: string; status: "sent" | "delivered" | "read" }) => {
        updateMessageStatus(data.messageId, data.status);
      }
    );

    socket.on("typingUsers", (users: string[]) => {
      setIsTyping(users.length > 0);
    });

    socket.on("chatHistory", (messages: IChatMessage[]) => {
      messages.forEach((msg) => {
        const convertedMessage: IChatMessage = {
          id: msg.id,
          sender: {
            id: msg.sender.id,
            type: msg.sender.type,
          },
          contenido: msg.contenido,
          timestamp: new Date(msg.timestamp).toISOString(),
          status: "sent",
          tipo: msg.tipo,
          recipient: {
            id: msg.recipient.id,
            type: "user",
          },
          attachment: msg.attachment,
        };
        addMessage(convertedMessage);
      });
    });

    socket.on("presenceUpdate", (users: string[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off(SocketEventos.mensaje);
      socket.off(SocketEventos.messageStatus);
      socket.off("typingUsers");
      socket.off("chatHistory");
      socket.off("presenceUpdate");
    };
  }, [socket, user, isOpen, selectedUserId, addMessage, setOnlineUsers]);

  const handleChatOpen = () => {
    setIsOpen(true);
    if (!audioInitialized) {
      audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
      audioRef.current.volume = 0.5;
      setAudioInitialized(true);
    }
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     setAttachment(e.target.files[0]);
  //   }
  // };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const simulateFileUpload = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prevProgress + 10;
      });
    }, 200);
  };

  const handleTyping = () => {
    if (!socket || !selectedUserId) return;

    socket.emit(SocketEventos.typing, selectedUserId);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      socket.emit(SocketEventos.stopTyping, selectedUserId);
    }, 1000);

    setTypingTimeout(timeout);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !socket ||
      !user ||
      !selectedUserId ||
      (!newMessage.trim() && !attachment)
    )
      return;

    const messageId = nanoid();
    const userMessage: IChatMessage = {
      id: messageId,
      sender: {
        id: user.id,
        type: "user",
      },
      contenido: newMessage,
      timestamp: new Date().toISOString(),
      status: "sent",
      tipo: SocketTipoMensaje.texto,
      attachment: attachment
        ? {
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
          }
        : undefined,
      recipient: {
        id: selectedUserId,
        type: "user",
      },
    };

    // Add message to local state immediately
    addMessage(userMessage);

    // Emit to server
    socket.emit(SocketEventos.mensaje, {
      id: messageId.toString(),
      tipo: attachment ? SocketTipoMensaje.archivo : SocketTipoMensaje.texto,
      contenido: attachment ? attachment.name : newMessage,
      url: attachment ? "placeholder-url" : undefined,
      timestamp: new Date().toISOString(),
      sender: {
        id: user.id,
        type: "user",
      },
      recipient: {
        id: selectedUserId,
        type: "user",
      },
      status: "sent",
      attachment: attachment
        ? {
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
          }
        : undefined,
    });

    setNewMessage("");

    if (attachment) {
      simulateFileUpload();
    }

    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      socket.emit(SocketEventos.stopTyping, selectedUserId);
    }
  };

  const MessageStatus = ({ status }: { status: IChatMessage["status"] }) => {
    switch (status) {
      case "sent":
        return <Check className="h-4 w-4 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-4 w-4 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Filter messages for the selected conversation
  const conversationMessages =
    selectedUserId && user ? getMessagesForUser(selectedUserId, user.id) : [];

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowConversation(true);
    clearUnreadCount(userId);

    // Fetch chat history when selecting a user
    if (socket && user) {
      socket.emit("fetchChatHistory", { otherUserId: userId });
    }
  };

  const handleBackToList = () => {
    setShowConversation(false);
    setSelectedUserId(null);
  };

  return (
    <>
      {!isOpen && (
        <Button
          className="fixed bottom-4 right-4 z-50 gap-2"
          onClick={handleChatOpen}
        >
          <MessageCircle className="h-6 w-6" /> Chat
          {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </Button>
      )}
      {isOpen && (
        <div
          className={`fixed ${
            isFullScreen ? "inset-0" : "bottom-4 right-4 w-96 h-[32rem]"
          } z-50 flex flex-col rounded-lg bg-white shadow-xl transition-all duration-200 ease-in-out dark:bg-gray-800`}
        >
          <div className="flex flex-col border-b p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              {showConversation ? (
                <>
                  <Button variant="ghost" onClick={handleBackToList}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={selectedUser?.avatar || undefined} />
                        <AvatarFallback>
                          {selectedUser?.nombre[0]}
                          {selectedUser?.apellido[0]}
                        </AvatarFallback>
                      </Avatar>
                      {selectedUser &&
                        onlineUsers.includes(selectedUser.id) && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
                        )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {selectedUser?.nombre} {selectedUser?.apellido}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedUser && onlineUsers.includes(selectedUser.id)
                          ? "Online"
                          : "Offline"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <h2 className="text-lg font-semibold">Chats</h2>
              )}
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  title={
                    isMuted ? "Unmute notifications" : "Mute notifications"
                  }
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {!showConversation ? (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {usuarios
                  .sort((a, b) => {
                    // Sort by online status first
                    const aOnline = onlineUsers.includes(a.id);
                    const bOnline = onlineUsers.includes(b.id);
                    if (aOnline !== bOnline) {
                      return bOnline ? 1 : -1;
                    }
                    // Then sort by name if online status is the same
                    return `${a.nombre} ${a.apellido}`.localeCompare(
                      `${b.nombre} ${b.apellido}`
                    );
                  })
                  .map((usuario) => (
                    <button
                      key={usuario.id}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleUserSelect(usuario.id)}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={usuario.avatar || undefined} />
                          <AvatarFallback>
                            {usuario.nombre[0]}
                            {usuario.apellido[0]}
                          </AvatarFallback>
                        </Avatar>
                        {onlineUsers.includes(usuario.id) && (
                          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {usuario.nombre} {usuario.apellido}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {onlineUsers.includes(usuario.id)
                                ? "Online"
                                : "Offline"}
                            </span>
                          </div>
                          {unreadCounts[usuario.id] > 0 && (
                            <Badge variant="destructive" className="ml-2">
                              {unreadCounts[usuario.id]}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {usuario.email}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </ScrollArea>
          ) : (
            <>
              <ScrollArea className="flex-1 p-4">
                {!selectedUser ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Select a user to start chatting
                  </div>
                ) : (
                  <>
                    {conversationMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`mb-4 flex ${
                          message.sender.id === user?.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.sender.id === user?.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          <p className="text-left">{message.contenido}</p>
                          {message.attachment && (
                            <div className="mt-2 flex items-center space-x-2 rounded-md bg-white bg-opacity-20 p-2 text-sm">
                              <File className="h-4 w-4" />
                              <span>{message.attachment.name}</span>
                            </div>
                          )}
                          <div className="mt-1 flex items-center justify-end space-x-1">
                            <span className="text-xs opacity-50">
                              {format(message.timestamp, "HH:mm")}
                            </span>
                            {message.sender.id === user?.id && (
                              <MessageStatus status={message.status} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%] rounded-lg bg-gray-200 p-3 dark:bg-gray-700">
                          <div className="flex space-x-2">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-gray-500"></div>
                            <div
                              className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </ScrollArea>
              {selectedUser && (
                <div className="border-t p-4 dark:border-gray-700">
                  {attachment && (
                    <div className="mb-2 flex items-center justify-between rounded-md bg-gray-100 p-2 dark:bg-gray-700">
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4" />
                        <span className="text-sm">{attachment.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachment}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <Progress value={uploadProgress} className="mb-2" />
                  )}
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      placeholder="Escribe un mensaje..."
                      className="flex-1"
                    />
                    {/* <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-attachment"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                      <span className="sr-only">Attach file</span>
                    </Button> */}
                    <Button type="submit">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
