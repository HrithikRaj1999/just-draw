import type { DrawingTool } from "../types/whiteboard";
import {
  MousePointer2,
  Pen,
  Eraser,
  Minus,
  MoveUpRight,
  Square,
  Circle,
  Type,
  Menu,
  Download,
  FolderOpen,
  Save,
  Trash2,
  Users,
  Database,
  Server,
  Smartphone,
  Laptop,
  Component,
  Sun,
  Moon,
} from "lucide-react";

interface ToolbarProps {
  tool: DrawingTool;
  strokeColor: string;
  strokeSize: number;
  roomId: string;
  theme: "light" | "dark";
  onToolChange: (tool: DrawingTool) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeSizeChange: (size: number) => void;
  onThemeToggle: () => void;
  onClear: () => void;
  onDownload: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
}

const TOOL_OPTIONS = [
  { tool: "select", label: "Select", icon: MousePointer2 },
  { tool: "pen", label: "Draw", icon: Pen },
  { tool: "eraser", label: "Eraser", icon: Eraser },
  { tool: "line", label: "Line", icon: Minus },
  { tool: "arrow", label: "Arrow", icon: MoveUpRight },
  { tool: "rectangle", label: "Rectangle", icon: Square },
  { tool: "ellipse", label: "Ellipse", icon: Circle },
  { tool: "db", label: "Database", icon: Database },
  { tool: "server", label: "Server", icon: Server },
  { tool: "client", label: "Client", icon: Smartphone },
  { tool: "computer", label: "Computer", icon: Laptop },
  { tool: "balancer", label: "Load Balancer", icon: Component },
  { tool: "text", label: "Text", icon: Type },
] as const;

const COLOR_OPTIONS = [
  "#0f172a", // Slate 900
  "#ef4444", // Red 500
  "#3b82f6", // Blue 500
  "#10b981", // Emerald 500
  "#f59e0b", // Amber 500
  "#8b5cf6", // Violet 500
  "#14b8a6", // Teal 500
  "#ec4899", // Pink 500
];

const Toolbar = ({
  tool,
  strokeColor,
  strokeSize,
  roomId,
  theme,
  onToolChange,
  onStrokeColorChange,
  onStrokeSizeChange,
  onThemeToggle,
  onClear,
  onDownload,
  onExportJson,
  onImportJson,
}: ToolbarProps) => {
  const copyInvite = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    await navigator.clipboard.writeText(url.toString());
  };

  return (
    <>
      <details className="v2-main-menu">
        <summary aria-label="Open menu">
          <Menu size={20} />
        </summary>
        <div className="v2-main-menu-list">
          <button type="button" onClick={onImportJson}>
            <FolderOpen
              size={16}
              style={{
                display: "inline",
                marginRight: 8,
                verticalAlign: "text-bottom",
              }}
            />{" "}
            Open (.json)
          </button>
          <button type="button" onClick={onExportJson}>
            <Save
              size={16}
              style={{
                display: "inline",
                marginRight: 8,
                verticalAlign: "text-bottom",
              }}
            />{" "}
            Save as (.json)
          </button>
          <button type="button" onClick={onDownload}>
            <Download
              size={16}
              style={{
                display: "inline",
                marginRight: 8,
                verticalAlign: "text-bottom",
              }}
            />{" "}
            Export Image
          </button>
          <button type="button" onClick={copyInvite}>
            <Users
              size={16}
              style={{
                display: "inline",
                marginRight: 8,
                verticalAlign: "text-bottom",
              }}
            />{" "}
            Invite Collaborators
          </button>

          <hr
            style={{
              borderColor: "var(--border-color)",
              margin: "4px 0",
              opacity: 0.5,
            }}
          />

          <button
            type="button"
            onClick={onThemeToggle}
            style={{ color: theme === "dark" ? "#fde047" : "#0f172a" }}
          >
            {theme === "dark" ? (
              <Sun
                size={16}
                style={{
                  display: "inline",
                  marginRight: 8,
                  verticalAlign: "text-bottom",
                }}
              />
            ) : (
              <Moon
                size={16}
                style={{
                  display: "inline",
                  marginRight: 8,
                  verticalAlign: "text-bottom",
                }}
              />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </details>

      <section className="v2-top-toolbar glass-panel">
        {TOOL_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.tool}
              type="button"
              className={option.tool === tool ? "is-active" : ""}
              onClick={() => onToolChange(option.tool as DrawingTool)}
              aria-label={option.label}
            >
              <IconComponent />
              <div className="tooltip-label">{option.label}</div>
            </button>
          );
        })}
      </section>

      <section className="v2-side-panel glass-panel">
        <label>
          Stroke Color
          <div className="v2-color-row">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Color ${color}`}
                className={strokeColor === color ? "is-selected" : ""}
                style={{ backgroundColor: color }}
                onClick={() => onStrokeColorChange(color)}
              />
            ))}
          </div>
        </label>

        <label className="v2-size-control">
          Stroke Width
          <input
            type="range"
            min={1}
            max={28}
            step={1}
            value={strokeSize}
            onChange={(event) => onStrokeSizeChange(Number(event.target.value))}
          />
          <span>{strokeSize}px</span>
        </label>

        <div className="v2-toolbar-actions">
          <button type="button" onClick={onClear} style={{ color: "#ef4444" }}>
            <Trash2 size={16} /> Clear Canvas
          </button>
        </div>
      </section>
    </>
  );
};

export default Toolbar;
