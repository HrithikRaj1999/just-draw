import { useToolKitContext } from "@/Context/ToolKitContext";
import { MENU_ITEM_TYPE } from "@/constants";
import { faSleigh } from "@fortawesome/free-solid-svg-icons";
import React, { useRef, useEffect } from "react";

const Board = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldDrawRef = useRef(false);
  const { menuItemClicked, pencilProperties } = useToolKitContext();
  const handleMouseDown = (
    e: MouseEvent,
    context: CanvasRenderingContext2D | null
  ) => {
    shouldDrawRef.current = true;
    context?.moveTo(e.clientX, e.clientY);
  };
  const handleMouseMove = (
    e: MouseEvent,
    context: CanvasRenderingContext2D | null
  ) => {
    if (!shouldDrawRef.current) return;
    context?.lineTo(e.clientX, e.clientY);
    context?.stroke();
  };
  const handleMouseUp = (
    e: MouseEvent,
    context: CanvasRenderingContext2D | null
  ) => {
    shouldDrawRef.current = false;
  };
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d")!;
    context.strokeStyle = pencilProperties.pencilColor;
    context.lineWidth = pencilProperties.pencilSize;
    console.log(pencilProperties.pencilColor, pencilProperties.pencilSize,context.strokeStyle,context.lineWidth)
    canvas.width = window.innerWidth;
    canvas.height = window.innerWidth;

    canvas.addEventListener("mousedown", (e) => handleMouseDown(e, context));
    canvas.addEventListener("mousemove", (e) => handleMouseMove(e, context));
    canvas.addEventListener("mouseup", (e) => handleMouseUp(e, context));
    return () => {
      canvas.removeEventListener("mousedown", (e) =>
        handleMouseDown(e, context)
      );
      canvas.removeEventListener("mousemove", (e) =>
        handleMouseMove(e, context)
      );
      canvas.removeEventListener("mouseup", (e) => handleMouseUp(e, context));
    };
  }, [canvasRef, pencilProperties.pencilColor, pencilProperties.pencilSize]);
  return <canvas ref={canvasRef}></canvas>;
};

export default Board;
