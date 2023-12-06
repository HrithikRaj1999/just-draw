import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { socketController } from "./controller/socketController";

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // The allowed origin
    methods: ["GET", "POST", "PUT"], // Allowed HTTP methods
    credentials: true, // If credentials are needed
  },
});
io.on("connection",socketController);

httpServer.listen(5000);
