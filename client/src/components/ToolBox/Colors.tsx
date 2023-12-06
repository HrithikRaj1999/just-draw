import { useToolKitContext } from "@/Context/ToolKitContext";
import React from "react";
import cx from "classnames";
import { useSocket } from "@/Context/SocketContext";
interface ColorsPropsType {
  color: string;
  handlePencilProperties: (type:string,value:string) => void;
}

const Colors = (props: ColorsPropsType) => {
  const { pencilProperties, setPencilProperties } = useToolKitContext();
  const { color,handlePencilProperties } = props;
  const { socket } = useSocket();
  return (
    <div
      className={cx(
        "color",
        pencilProperties.pencilColor === color
          ? "border-4  border-black "
          : 'border'
      )}
      style={{ backgroundColor: color }}
      onClick={() => {
        handlePencilProperties("color", color);
        socket.emit("pencilPropertyEdited", "color", color);
      }}
    >
      {}
    </div>
  );
};

export default Colors;
