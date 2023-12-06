import { COLOR_LIST, MENU_ITEM_TYPE } from "@/constants";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Colors from "./Colors";
import { useToolKitContext } from "@/Context/ToolKitContext";
import { useSocket } from "@/Context/SocketContext";
const ToolBox = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 10, y: 200 });
  const { socket } = useSocket();
  const ref = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const onMouseDown = (e: { clientX: number; clientY: number }) => {
    setIsDragging(true);
    ref.current = {
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    };
    socket.emit("toolBoxPositionChanged");
  };

  const onMouseUp = () => {
    setIsDragging(false);
    ref.current = null;
  };

  const onMouseMove = (e: { clientX: number; clientY: number }) => {
    if (isDragging && ref.current) {
      setPosition({
        x: e.clientX - ref.current.offsetX,
        y: e.clientY - ref.current.offsetY,
      });
      socket.emit("toolBoxPositionChanged");
    }
  };
  const {
    menuItemClicked,
    eraserPropertise,
    pencilProperties,
    setPencilProperties,
    setEraserPropertise,
  } = useToolKitContext();

  const handlePencilProperties = (type: string, value: string) => {
    if (type === "size") {
      setPencilProperties((prev) => {
        return {
          ...prev,
          pencilSize: parseInt(value) / 10,
        };
      });
    }
    if (type === "color") {
      setPencilProperties((prev) => {
        return { ...prev, pencilColor: value };
      });
    }
  };
  const handleEraserProperties = (value: string) => {
    setEraserPropertise((prev) => {
      return {
        ...prev,
        eraserSize: parseInt(value) / 10,
      };
    });
  };
  const handleSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (menuItemClicked.label === MENU_ITEM_TYPE.PENCIL) {
      handlePencilProperties("size", e.target.value);
      socket.emit("pencilPropertyEdited", "size", e.target.value);
    }
    if (menuItemClicked.label === MENU_ITEM_TYPE.ERASER) {
      handleEraserProperties(e.target.value);
      socket.emit("erarerPropertyEdited", e.target.value);
    }
  };
  const setToolboxPosition = () => {
    const pos = localStorage.getItem("tool-box-position");
    setPosition(() => {
      if (pos) return JSON.parse(pos);
      else return { x: 10, y: 500 };
    });
  };
  useLayoutEffect(() => {
    setPosition((prev) => {
      return JSON.parse(localStorage.getItem("tool-box-position") ?? "");
    });
  }, []);
  useEffect(() => {
    localStorage.setItem("tool-box-position", JSON.stringify(position));
  }, [position]);
  useEffect(() => {
    socket.on("setPencilProperties", handlePencilProperties);
    socket.on("setErasorProperties", handleEraserProperties);
    socket.on("setToolBoxPosition", setToolboxPosition);

    return () => {
      socket.off("setPencilProperties");
      socket.off("setErasorProperties");
      socket.off("setToolBoxPosition");
    };
  }, []);
  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className={"tool-container"}
    >
      {menuItemClicked?.label === MENU_ITEM_TYPE.PENCIL ? (
        <div className="stroke-color-selector">
          <h4 className="stroke-color">
            {menuItemClicked.name} Color: <b>{pencilProperties.pencilColor.split('')[0].toUpperCase()+pencilProperties.pencilColor.slice(1)}</b>{" "}
          </h4>
          <div className="color-box" onMouseDown={(e) => e.stopPropagation()}>
            {COLOR_LIST.map((color: string, i: number) => (
              <Colors
                key={i}
                color={color}
                handlePencilProperties={handlePencilProperties}
              />
            ))}
          </div>
        </div>
      ) : null}
      <div className="range-container" onMouseDown={(e) => e.stopPropagation()}>
        <h4>
          {menuItemClicked.name} size: <b>{pencilProperties.pencilSize}</b>
        </h4>
        <input
          className="size-range"
          type="range"
          value={
            menuItemClicked?.label === MENU_ITEM_TYPE.PENCIL
              ? pencilProperties.pencilSize * 10
              : eraserPropertise.eraserSize * 10
          }
          min={1}
          max={menuItemClicked?.label === MENU_ITEM_TYPE.PENCIL ? 100 : 1000} //for smoothness it has been made larger
          step={1}
          onChange={handleSize}
        />
      </div>
    </div>
  );
};

export default ToolBox;
