"use client";
import { useSocket } from "@/Context/SocketContext";
import { useToolKitContext } from "@/Context/ToolKitContext";
import { MENU_ITEM_TYPE } from "@/constants";
import React, { useRef, useEffect, useLayoutEffect } from "react";

const Board = () => {
  const { socket } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const history = useRef<ImageData[]>([]);
  const pointor = useRef(0);
  const shouldDrawRef = useRef(false);
  const {
    actionMenuItem,
    setActionMenuItem,
    menuItemClicked,
    eraserPropertise,
    pencilProperties,
  } = useToolKitContext();
  const handleAction = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d")!;
      if (actionMenuItem?.label === MENU_ITEM_TYPE.DOWNLOAD) {
        const URL = canvas.toDataURL();
        const anchor = document.createElement("a");
        anchor.href = URL;
        anchor.download = "Sketch.jpg";
        anchor.click();
        setActionMenuItem(null);
      }
      if (actionMenuItem?.label === MENU_ITEM_TYPE.UNDO) {
        if (pointor.current - 1 >= 0) {
          const imageData = history.current[pointor.current - 1];
          imageData && context.putImageData(imageData, 0, 0);
          pointor.current = pointor.current - 1;
        } else {
          context.fillStyle = "#fefdfa";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
      if (actionMenuItem?.label === MENU_ITEM_TYPE.REDU) {
        if (pointor.current < history.current.length - 1) {
          const imageData = history.current[pointor.current + 1];
          imageData && context.putImageData(imageData, 0, 0);
          pointor.current = pointor.current + 1;
        }
      }
    }
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canvasRef.current) return;
    handleAction();
    socket.emit("handleAction");
    setActionMenuItem(null);
  }, [actionMenuItem, setActionMenuItem]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")!;
    const changeConfig = () => {
      context.strokeStyle =
        menuItemClicked.label === MENU_ITEM_TYPE.PENCIL
          ? pencilProperties.pencilColor
          : eraserPropertise.eraserColor;
      context.lineWidth =
        menuItemClicked.label === MENU_ITEM_TYPE.PENCIL
          ? pencilProperties.pencilSize
          : eraserPropertise.eraserSize;
    };
    changeConfig();
  }, [menuItemClicked, pencilProperties, eraserPropertise]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!canvasRef.current) return;

    socket.emit("client-ready");
    const canvas = canvasRef.current;
    const getPixelRatio = () => window.devicePixelRatio || 1;
    const pixelRatio = getPixelRatio();
    canvas.width = window.innerWidth * pixelRatio;
    canvas.height = window.innerHeight * pixelRatio;
    const context = canvas.getContext("2d")!;
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = "#fefdfa";
    context.fillRect(0, 0, canvas.width, canvas.height);

    let lastX:number, lastY:number;
    const drawBezierCurve = (prevX:number, prevY:number, currX:number, currY:number) => {
      context.beginPath();
      context.moveTo(prevX, prevY);
      context.quadraticCurveTo(prevX, prevY, currX, currY);
      context.stroke();
      context.closePath();
    };

    const beginPath = (x: number, y: number) => {
      context?.beginPath();
      context?.moveTo(x, y);
    };
    const drawLine = (x: number, y: number) => {
      context.lineTo(x, y);
      context.stroke();
      context.beginPath();
      context.moveTo(x, y);
    };
    const handleMouseDown = (e: MouseEvent) => {
      shouldDrawRef.current = true;
      beginPath(e.clientX, e.clientY);
      lastX = e.clientX;
      lastY = e.clientY;
      socket.emit("beginPath", { x: e.clientX, y: e.clientY });
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!shouldDrawRef.current) return;
      drawBezierCurve(lastX, lastY, e.clientX, e.clientY);
      socket.emit("drawLine", { x: e.clientX, y: e.clientY });

      lastX = e.clientX;
      lastY = e.clientY;
    };
    const setMouseUp = () => {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      history.current.push(imageData);
      pointor.current = history.current.length - 1;
      shouldDrawRef.current = false;
    };
    const handleMouseUp = (e: MouseEvent) => {
      setMouseUp();
      socket.emit("setMouseUp");
    };
    const handleBeginPath = (path: { x: number; y: number }) => {
      beginPath(path.x, path.y);
    };
    const handleDrawPath = (path: { x: number; y: number }) => {
      drawLine(path.x, path.y);
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    socket.on("beginPath", handleBeginPath);
    socket.on("drawLine", handleDrawPath);
    socket.on("handleAction", handleAction);
    socket.on("setMouseUp", setMouseUp);

    socket.on("get-canvas-state", () => {
      if (!canvasRef.current?.toDataURL()) return null;
      socket.emit("canvas-state", canvasRef.current.toDataURL());
    });
    socket.on("canvas-state-from-server", (state: string) => {
      if (state) {
        const img = new Image();
        img.src = state;
        img.onload = () => {
          context?.drawImage(img, 0, 0);
        };
      }
    });
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      socket.off("beginPath");
      socket.off("drawLine");
      socket.off("get-canvas-state");
      socket.off("canvas-state-from-server");
      socket.off("handleAction");
      socket.off("setMouseUp");
    };
  }, []);
  return <canvas className="block" ref={canvasRef}></canvas>;
};

export default Board;
