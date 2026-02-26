import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { Server } from "socket.io";
import { config } from "./config";
import { registerSocketHandlers } from "./socket/registerSocketHandlers";
import { FileBoardPersistence } from "./store/fileBoardPersistence";
import { RoomRegistry } from "./store/roomRegistry";

const app = express();
app.disable("x-powered-by");
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "whiteboard-realtime" });
});
app.get("/", (_req, res) => {
  res.status(200).json({ ok: true, message: "WebSocket server is running." });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    credentials: false,
  },
  transports: ["websocket"],
  allowUpgrades: false,
  perMessageDeflate: false,
  pingInterval: 20000,
  pingTimeout: 20000,
});

const setupRedisAdapter = async (): Promise<void> => {
  if (!config.redisUrl) {
    return;
  }

  const pubClient = new Redis(config.redisUrl, { lazyConnect: true });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  console.log("[socket] Redis adapter connected.");
};

const start = async (): Promise<void> => {
  await setupRedisAdapter();

  const persistence = new FileBoardPersistence(config.boardStorageDir);
  const roomRegistry = new RoomRegistry(
    persistence,
    config.autosaveDebounceMs
  );

  registerSocketHandlers(io, roomRegistry);

  httpServer.listen(config.port, () => {
    console.log(`[socket] Whiteboard websocket server running on :${config.port}`);
  });
};

start().catch((error: unknown) => {
  console.error("[socket] Failed to start server", error);
  process.exit(1);
});
