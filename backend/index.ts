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
    methods: ["GET", "POST", "PUT"], // Allowed HTTP methods
    credentials: true, // If credentials are needed
  },
});
io.on("connection", (socket) => {
  console.log("Server Connected Successfully",);
  socket.on("beginPath", (args) => {
    socket.broadcast.emit("beginPath", args);
  });
  socket.on("drawLine", (args) => {
    socket.broadcast.emit("drawLine", args);
  });
  socket.on("setMenuPosition", () => {
    socket.broadcast.emit("setMenuPosition");
  });
});

httpServer.listen(5000);
