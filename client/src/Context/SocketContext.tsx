import React, { useEffect, useState, createContext, useContext } from "react";
import { Socket } from "socket.io-client";
import { io } from "socket.io-client";

interface SocketContextType {
  socket: Socket;
  setSocket: React.Dispatch<React.SetStateAction<Socket>>;
}

interface propsType {
  children: React.ReactNode;
}
const ClientSocket = createContext({} as SocketContextType);
const ClientSocketProvider = (props: propsType) => {
  const { children } = props;
  const [socket, setSocket] = useState<Socket>(io("https://just-draw-backend-1.onrender.com"));
  useEffect(() => {
    setSocket(socket);
    socket.on("connect", () => {
        console.log("client conected");
    });
    
}, []);
  return (
    <ClientSocket.Provider value={{ socket, setSocket }}>
      {children}
    </ClientSocket.Provider>
  );
};
export const useSocket = () => useContext(ClientSocket);

export default ClientSocketProvider;
