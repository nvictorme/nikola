import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket, SocketOptions } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

// Define the type for the Socket Context
type SocketContextType = Socket | null;

// Create a new context for the socket
const SocketContext = createContext<SocketContextType>(null);

// Default URL for the socket connection
const url = import.meta.env.VITE_API_URL;

// Custom Socket.IO provider component
export const SocketProvider: React.FC<{
  children: React.ReactNode;
  options?: SocketOptions;
}> = ({ options, children }) => {
  const [socket, setSocket] = useState<SocketContextType>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    // Initialize Socket.IO client with auth
    const newSocket = io(url, {
      ...options,
      auth: {
        userId: user.id,
      },
    });
    setSocket(newSocket);

    // Clean up the socket connection when component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, [options, user?.id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

// Custom hook to access the socket instance
// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = (): SocketContextType => useContext(SocketContext);
