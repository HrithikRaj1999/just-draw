import { Socket } from "socket.io";

export type MenuType = {
  label: string;
  name: string;
  icon: any;
  type: string;
};
export const socketController = (socket: Socket) => {
  console.log("Server Connected Successfully");
  socket.on("client-ready", () => socket.broadcast.emit("get-canvas-state"));
  socket.on("canvas-state", (state) =>
    socket.broadcast.emit("canvas-state-from-server", state)
  );
  socket.on("setMenuItemIsclicked", (state: MenuType) =>
    socket.broadcast.emit("setMenuItem", state)
  );
  socket.on("menuComponentLoaded", () =>
    socket.broadcast.emit("setInitPropertise")
  );
  socket.on("beginPath", (args) => socket.broadcast.emit("beginPath", args));
  socket.on("drawLine", (args) => {
    socket.broadcast.emit("drawLine", args);
  });
  socket.on("setMenuPosition", () => socket.broadcast.emit("setMenuPosition"));

  socket.on("pencilPropertyEdited", (type: string, value: string) =>
    socket.broadcast.emit("setPencilProperties", type, value)
  );
  socket.on("erarerPropertyEdited", (value: string) =>
    socket.broadcast.emit("setErasorProperties", value)
  );
  socket.on("toolBoxPositionChanged", () =>
    socket.broadcast.emit("setToolBoxPosition")
  );
  socket.on("handleAction", () =>
  socket.broadcast.emit("handleAction")
);
socket.on("setMouseUp", () =>
  socket.broadcast.emit("setMouseUp")
);
};
