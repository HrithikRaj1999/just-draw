import { ToolKitContextProvider } from "@/Context/ToolKitContext";
import Board from "@/components/Board/Board";
import Menu from "@/components/Menu/Menu";
import ToolBox from "@/components/ToolBox/ToolBox";
import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { io } from "socket.io-client";

export default function Home() {
  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on("connect", () => {
      console.log("client conected");
    });
  }, []);
  return (
    <ToolKitContextProvider>
      <Board />
      <Menu />
      <ToolBox />
    </ToolKitContextProvider>
  );
}
