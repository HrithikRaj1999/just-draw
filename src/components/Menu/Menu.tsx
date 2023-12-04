import { MenuType, useToolKitContext } from "@/Context/ToolKitContext";
import { MENU_ITEMS } from "@/constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cx from "classnames";
const Menu = () => {
  const { menuItemClicked,setActionMenuItem, setMenuItemClicked } = useToolKitContext();
  const handleMenuItemClicked = (item: MenuType) => {
    if (item.type === "item") setMenuItemClicked(item);
    else setActionMenuItem(item);
  };
  return (
    <div className="menuContainer">
      <div className="iconWrapper">
        {MENU_ITEMS.map((item, index) => (
          <FontAwesomeIcon
            key={index}
            icon={item.icon}
            className={cx("icon",menuItemClicked.label===item.label?'border bg-slate-100':'')}
            onClick={() => handleMenuItemClicked(item)}
          />
        ))}
      </div>
    </div>
  );
};
export default Menu;
