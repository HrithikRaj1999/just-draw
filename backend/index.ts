import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // The allowed origin
    methods: ["GET", "POST"], // Allowed HTTP methods
    credentials: true, // If credentials are needed
  },
});
io.on("connection", (socket) => {
  console.log("Server Connected Successfully");
});

httpServer.listen(5000);
