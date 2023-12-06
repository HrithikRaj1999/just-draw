import ClientSocketProvider from "@/Context/SocketContext";
import { ToolKitContextProvider } from "@/Context/ToolKitContext";
import Board from "@/components/Board/Board";
import Menu from "@/components/Menu/Menu";
import ToolBox from "@/components/ToolBox/ToolBox";

export default function Home() {
  return (
    <ClientSocketProvider>
      <ToolKitContextProvider>
        <Board />
        <Menu />
        <ToolBox />
      </ToolKitContextProvider>
    </ClientSocketProvider>
  );
}
