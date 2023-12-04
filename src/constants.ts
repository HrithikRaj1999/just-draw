import {
  faPencil,
  faEraser,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons/faRotateRight";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons/faFileArrowDown";

export const COLOR_LIST = ["blue", "green", "black", "brown", "yellow", "red"];


export const MENU_ITEMS = [
  { label: "PENCIL", name: "Pencil", icon: faPencil, type: "item" },
  { label: "ERASER", name: "Eraser", icon: faEraser, type: "item" },
  { label: "UNDO", name: "Undo", icon: faRotateLeft, type: "action" },
  { label: "REDU", name: "Redu", icon: faRotateRight, type: "action" },
  {
    label: "DOWNLOAD",
    name: "Download",
    icon: faFileArrowDown,
    type: "action",
  },
];
export const MENU_ITEM_TYPE = {
  PENCIL: "PENCIL",
  ERASER: "ERASER",
  UNDO: "UNDO",
  REDU: "REDU",
  DOWNLOAD:"DOWNLOAD"
};
