import React from "react";

interface ColorsPropsType {
  color: string;
}
const colorClasses = {
  red: "bg-red-600",
  blue: "bg-blue-600",
  green: "bg-green-600",
  black: "bg-black",
  brown: "bg-orange-600",
  yellow: "bg-yellow-300",
};

const Colors = (props: ColorsPropsType) => {
  const { color } = props;
  const bgColorClass = colorClasses[color] as {string:string}
  return (
    <div className={`flex flow-col w-[30px] h-[20px]  ${bgColorClass}`}>{}</div>
  );
};

export default Colors;
