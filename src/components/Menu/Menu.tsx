import { MenuType, useToolKitContext } from "@/Context/ToolKitContext";
import { MENU_ITEMS } from "@/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cx from "classnames";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
const Menu = () => {
  const { menuItemClicked, setActionMenuItem, setMenuItemClicked } =
    useToolKitContext();
  const handleMenuItemClicked = (item: MenuType) => {
    if (item.type === "item") setMenuItemClicked(item);
    else setActionMenuItem(item);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({x:0,y:0});
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
  useLayoutEffect(() => {
    setPosition((prev) => {
      return JSON.parse(localStorage.getItem("position") ?? "");
    });
  }, []);
  useEffect(() => {
    localStorage.setItem("position", JSON.stringify(position));
  }, [position]);
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className="menuContainer"
    >
      <div className="iconWrapper">
        {MENU_ITEMS.map((item, index) => (
          <FontAwesomeIcon
            key={index}
            icon={item.icon}
            className={cx(
              "icon",
              menuItemClicked.label === item.label ? "border bg-slate-100" : ""
            )}
            onClick={() => handleMenuItemClicked(item)}
          />
        ))}
      </div>
    </div>
  );
};
export default Menu;
