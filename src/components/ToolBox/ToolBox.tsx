import { COLOR_LIST, MENU_ITEMS, MENU_ITEM_TYPE } from "@/constants";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Colors from "./Colors";
import { useToolKitContext } from "@/Context/ToolKitContext";
import cx from "classnames";
const ToolBox = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const onMouseDown = (e: { clientX: number; clientY: number }) => {
    setIsDragging(true);
    ref.current = {
      offsetX: e.clientX - position.x,
      offsetY: e.clientY - position.y,
    };
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
    }
  };
  const {
    menuItemClicked,
    eraserPropertise,
    pencilProperties,
    setPencilProperties,
    setEraserPropertise,
  } = useToolKitContext();

  const handleSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (menuItemClicked.label === MENU_ITEM_TYPE.PENCIL) {
      setPencilProperties((prev) => {
        return {
          ...prev,
          pencilSize: parseInt(e.target.value),
        };
      });
    }
    if (menuItemClicked.label === MENU_ITEM_TYPE.ERASER) {
      setEraserPropertise((prev) => {
        return {
          ...prev,
          eraserSize: parseInt(e.target.value),
        };
      });
    }
  };
  useLayoutEffect(() => {
    setPosition((prev) => {
      return JSON.parse(localStorage.getItem("tool-box-position") ?? "");
    });
  }, []);
  useEffect(() => {
    localStorage.setItem("tool-box-position", JSON.stringify(position));
  }, [position]);
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
            {menuItemClicked.name} Color: {pencilProperties.pencilColor}{" "}
          </h4>
          <div className="color-box">
            {COLOR_LIST.map((color: string, i: number) => (
              <Colors key={i} color={color} />
            ))}
          </div>
        </div>
      ) : null}
      <div className="range-container" onMouseDown={(e) => e.stopPropagation()}>
        <h4>{menuItemClicked.name} size</h4>
        <input
          className="size-range"
          type="range"
          value={
            menuItemClicked?.label === MENU_ITEM_TYPE.PENCIL
              ? pencilProperties.pencilSize
              : eraserPropertise.eraserSize
          }
          min={1}
          max={50}
          step={1}
          onChange={handleSize}
        />
      </div>
    </div>
  );
};

export default ToolBox;
