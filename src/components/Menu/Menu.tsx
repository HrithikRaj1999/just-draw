import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencil,
  faEraser,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons/faRotateRight";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons/faFileArrowDown";

const Menu = () => {
  return (
    <div className="menuContainer">
      <div className="iconWrapper">
        <FontAwesomeIcon icon={faPencil} className="icon" />
        <FontAwesomeIcon icon={faEraser} className="icon" />
        <FontAwesomeIcon icon={faRotateLeft} className="icon" />
        <FontAwesomeIcon icon={faRotateRight} className="icon" />
        <FontAwesomeIcon icon={faFileArrowDown} className="icon" />
      </div>
    </div>
  );
};
export default Menu;
