import { COLOR_LIST, MENU_ITEM_TYPE } from "@/constants";
import React from "react";
import Colors from "./Colors";
import { useToolKitContext } from "@/Context/ToolKitContext";

const ToolBox = () => {
  const { menuItemClicked, actionMenuItem } = useToolKitContext();
  const handleBrushSize = () => {};

  return (
    <div className="tool-container">
      {menuItemClicked?.label === MENU_ITEM_TYPE.PENCIL ? (
        <div className="stroke-color-selector">
          <h4 className="stroke-color">{menuItemClicked.name} Color</h4>
          <div className="color-box">
            {COLOR_LIST.map((color: string, i: number) => (
              <Colors key={i} color={color} />
            ))}
          </div>
        </div>
      ) : null}
      <div className="range-container">
        <h4>
          {menuItemClicked.name} size
        </h4>
        <input
          className="size-range"
          type="range"
          min={1}
          max={10}
          step={1}
          onChange={handleBrushSize}
        />
      </div>
    </div>
  );
};

export default ToolBox;
