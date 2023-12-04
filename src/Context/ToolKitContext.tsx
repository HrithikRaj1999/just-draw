"use client";
import { MENU_ITEMS } from "@/constants";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "next/dist/lib/metadata/types/metadata-types";
import React, { createContext, useContext, useState } from "react";

interface ToolKitContextProps {
  children: React.ReactNode;
}
export type MenuType = {
  label: string;
  name: string;
  icon: IconDefinition;
  type: string;
};

interface ToolKitContextType {
  menuItemClicked: MenuType;
  setMenuItemClicked: React.Dispatch<React.SetStateAction<MenuType>>;
  actionMenuItem: MenuType | null;
  setActionMenuItem: React.Dispatch<React.SetStateAction<MenuType | null>>;
}
const ToolKitContext = createContext({} as ToolKitContextType);
export const ToolKitContextProvider = ({ children }: ToolKitContextProps) => {
  const [menuItemClicked, setMenuItemClicked] = useState(MENU_ITEMS[0]);
  const [actionMenuItem, setActionMenuItem] = useState<MenuType | null>(null);
  return (
    <ToolKitContext.Provider
      value={{
        menuItemClicked,
        setMenuItemClicked,
        actionMenuItem,
        setActionMenuItem,
      }}
    >
      {children}
    </ToolKitContext.Provider>
  );
};
export const useToolKitContext = () => useContext(ToolKitContext);
export default ToolKitContext;
