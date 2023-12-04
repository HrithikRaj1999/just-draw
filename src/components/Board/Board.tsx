"useClient";
import { useToolKitContext } from "@/Context/ToolKitContext";
import { MENU_ITEM_TYPE } from "@/constants";
import { faSleigh } from "@fortawesome/free-solid-svg-icons";
import React, { useRef, useEffect, useLayoutEffect } from "react";

const Board = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldDrawRef = useRef(false);
  const { menuItemClicked, pencilProperties } = useToolKitContext();
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")!;
    const changeConfig = () => {
      context.strokeStyle = pencilProperties.pencilColor;
      context.lineWidth = pencilProperties.pencilSize;
    };
    changeConfig();
  }, [pencilProperties]);

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerWidth;
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
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!shouldDrawRef.current) return;
      drawLine(e.clientX, e.clientY);
    };
    const handleMouseUp = (e: MouseEvent) => {
      shouldDrawRef.current = false;
    };
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);
  return <canvas ref={canvasRef}></canvas>;
};

export default Board;
