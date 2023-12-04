import { COLOR_LIST, MENU_ITEMS, MENU_ITEM_TYPE } from "@/constants";
import React from "react";
import Colors from "./Colors";
import { useToolKitContext } from "@/Context/ToolKitContext";

const ToolBox = () => {
  const {
    menuItemClicked,
    actionMenuItem,
    eraserPropertise,
    pencilProperties,
    setPencilProperties,
    setEraserPropertise,
  } = useToolKitContext();
  const handleSize = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="tool-container">
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
      <div className="range-container">
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
          max={10}
          step={1}
          onChange={handleSize}
        />
      </div>
    </div>
  );
};

export default ToolBox;
