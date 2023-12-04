import React from "react";
interface ColorsPropsType {
  color: string;
}


const Colors = (props: ColorsPropsType) => {
  const { color } = props;
  return (
    <div className={'color'}  style={{backgroundColor:color}} >{}</div>
  );
};

export default Colors;
