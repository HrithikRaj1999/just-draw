import { useToolKitContext } from "@/Context/ToolKitContext";
import React from "react";
import cx from "classnames";
interface ColorsPropsType {
  color: string;
}

const Colors = (props: ColorsPropsType) => {
  const { pencilProperties, setPencilProperties } = useToolKitContext();
  const { color } = props;
  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className={cx(
        "color",
        pencilProperties.pencilColor === color
          ? "border-2 border-b-zinc-200 shadow-2xl"
          : null
      )}
      style={{ backgroundColor: color }}
      onClick={() =>
        setPencilProperties((prev) => {
          return { ...prev, pencilColor: color };
        })
      }
    >
      {}
    </div>
  );
};

export default Colors;
