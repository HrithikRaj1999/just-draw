import express from "express";
import http from "http"; // Change this line
import { Server } from "socket.io";
import cors from "cors";
import { socketController } from "./controller/socketController";

const app = express();
app.use(cors({ origin: "*" }));
const httpServer = http.createServer(app); // Change this line
const io = new Server(httpServer, {
  cors: {
    origin: "*", // The allowed origin
    methods: ["GET", "POST", "PUT"], // Allowed HTTP methods
    credentials: true, // If credentials are needed
  },
});
io.on("connection", socketController);

httpServer.listen("5000");