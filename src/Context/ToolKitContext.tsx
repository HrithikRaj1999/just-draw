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
interface pencilPropertiesType {
  pencilSize: number;
  pencilColor: string;
}
interface EraserPropertiesType {
  eraserSize: number;
  eraserColor: "#fefdfa";
}
interface ToolKitContextType {
  menuItemClicked: MenuType;
  actionMenuItem: MenuType | null;
  pencilProperties: pencilPropertiesType;
  setPencilProperties: React.Dispatch<
    React.SetStateAction<pencilPropertiesType>
  >;
  eraserPropertise: EraserPropertiesType;
  setEraserPropertise: React.Dispatch<
    React.SetStateAction<EraserPropertiesType>
  >;
  setMenuItemClicked: React.Dispatch<React.SetStateAction<MenuType>>;
  setActionMenuItem: React.Dispatch<React.SetStateAction<MenuType | null>>;
}
const ToolKitContext = createContext({} as ToolKitContextType);
export const ToolKitContextProvider = ({ children }: ToolKitContextProps) => {
  const [menuItemClicked, setMenuItemClicked] = useState(MENU_ITEMS[0]);
  const [actionMenuItem, setActionMenuItem] = useState<MenuType | null>(null);
  const [pencilProperties, setPencilProperties] =
    useState<pencilPropertiesType>({ pencilSize: 3, pencilColor: "black" });
  const [eraserPropertise, setEraserPropertise] =
    useState<EraserPropertiesType>({ eraserSize: 3, eraserColor: "#fefdfa" });
  return (
    <ToolKitContext.Provider
      value={{
        menuItemClicked,
        setMenuItemClicked,
        actionMenuItem,
        setActionMenuItem,
        pencilProperties,
        setPencilProperties,
        eraserPropertise,
        setEraserPropertise,
      }}
    >
      {children}
    </ToolKitContext.Provider>
  );
};
export const useToolKitContext = () => useContext(ToolKitContext);
export default ToolKitContext;
