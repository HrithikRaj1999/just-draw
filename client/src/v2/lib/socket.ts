import { io, type Socket } from "socket.io-client";

let socketSingleton: Socket | null = null;

const resolveSocketUrl = (): string => {
  const fromEnv = process.env.NEXT_PUBLIC_WS_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:5000`;
  }
  return "ws://localhost:5000";
};

export const getSocketClient = (): Socket => {
  if (socketSingleton) {
    return socketSingleton;
  }

  socketSingleton = io(resolveSocketUrl(), {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionDelayMax: 3000,
    timeout: 10000,
  });

  return socketSingleton;
};
