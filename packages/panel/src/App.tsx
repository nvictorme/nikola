import { useAuthStore } from "@/store/auth.store";
import { AppStack } from "./navigation/AppStack";
import "./App.css";
import { PublicStack } from "./navigation/PublicStack";
import { SocketProvider } from "./providers/socket.provider";
import ChatBox from "@/components/ChatBox";

const App: React.FC = () => {
  const { user } = useAuthStore();
  return user ? (
    <SocketProvider>
      <AppStack />
      <ChatBox />
    </SocketProvider>
  ) : (
    <PublicStack />
  );
};

export default App;
