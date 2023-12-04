import { COLOR_LIST } from "@/constants";
import React from "react";
import Colors from "./Colors";

const ToolBox = () => {
  const handleBrushSize = () => {};
  return (
    <div className="tool-container">
      <div className="stroke-color-selector">
        <h4 className="stroke-color">Stroke Colors</h4>
        <div className="color-box">
          {COLOR_LIST.map((color, i) => (
            <Colors key={i} color={color} />
          ))}
        </div>
      </div>
      <div className="range-container">

        <h4>Stroke size</h4>
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
