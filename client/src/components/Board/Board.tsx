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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")!;
    if (actionMenuItem?.label === MENU_ITEM_TYPE.DOWNLOAD) {
      const URL = canvas.toDataURL();
      const anchor = document.createElement("a");
      anchor.href = URL;
      anchor.download = "Sketch.jpg";
      anchor.click();
      console.log(URL);
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

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.fillStyle = "#fefdfa";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const beginPath = (x: number, y: number) => {
      context?.beginPath();
      context?.moveTo(x, y);
    };
    const drawLine = (x: number, y: number) => {
      context?.lineTo(x, y);
      context?.stroke();
    };
    const handleMouseDown = (e: MouseEvent) => {
      shouldDrawRef.current = true;
      beginPath(e.clientX, e.clientY);
      socket.emit("beginPath", { x: e.clientX, y: e.clientY });
      
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!shouldDrawRef.current) return;
      drawLine(e.clientX, e.clientY);
      socket.emit("drawLine", { x: e.clientX, y: e.clientY });
    
    };
    const handleMouseUp = (e: MouseEvent) => {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      history.current.push(imageData);
      pointor.current = history.current.length - 1;
      shouldDrawRef.current = false;
    
    };
    const handleBeginPath = (path: { x: number; y: number }) => {
      beginPath(path.x, path.y);
    };
    const handleDrawPath = (path: { x: number; y: number }) => {
      drawLine(path.x, path.y);
    };
    const handleRefresh = () => {
      console.log("Refresjed");
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    socket.on("beginPath", handleBeginPath);
    socket.on("drawLine", handleDrawPath);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      socket.off("beginPath", handleBeginPath);
      socket.off("drawLine", handleDrawPath);
    
    };
  }, []);
  return <canvas className="block" ref={canvasRef}></canvas>;
};

export default Board;
