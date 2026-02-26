import type { DrawingTool } from "../types/whiteboard";

interface ToolbarProps {
  tool: DrawingTool;
  strokeColor: string;
  strokeSize: number;
  onToolChange: (tool: DrawingTool) => void;
  onStrokeColorChange: (color: string) => void;
  onStrokeSizeChange: (size: number) => void;
  onClear: () => void;
  onDownload: () => void;
  onExportJson: () => void;
}

const TOOL_OPTIONS: Array<{ tool: DrawingTool; label: string }> = [
  { tool: "select", label: "Select" },
  { tool: "pen", label: "Pen" },
  { tool: "eraser", label: "Eraser" },
  { tool: "line", label: "Line" },
  { tool: "arrow", label: "Arrow" },
  { tool: "rectangle", label: "Rect" },
  { tool: "ellipse", label: "Ellipse" },
  { tool: "text", label: "Text" },
];

const COLOR_OPTIONS = [
  "#111827",
  "#DC2626",
  "#2563EB",
  "#059669",
  "#D97706",
  "#7C3AED",
  "#0F766E",
];

const Toolbar = ({
  tool,
  strokeColor,
  strokeSize,
  onToolChange,
  onStrokeColorChange,
  onStrokeSizeChange,
  onClear,
  onDownload,
  onExportJson,
}: ToolbarProps) => {
  return (
    <section className="v2-toolbar">
      <div className="v2-toolbar-tools">
        {TOOL_OPTIONS.map((option) => (
          <button
            key={option.tool}
            type="button"
            className={option.tool === tool ? "is-active" : ""}
            onClick={() => onToolChange(option.tool)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="v2-toolbar-controls">
        <label>
          Color
          <div className="v2-color-row">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Use ${color}`}
                className={strokeColor === color ? "is-selected" : ""}
                style={{ backgroundColor: color }}
                onClick={() => onStrokeColorChange(color)}
              />
            ))}
          </div>
        </label>

        <label className="v2-size-control">
          Size
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
          <button type="button" onClick={onClear}>
            Clear
          </button>
          <button type="button" onClick={onDownload}>
            PNG
          </button>
          <button type="button" onClick={onExportJson}>
            JSON
          </button>
        </div>
      </div>
    </section>
  );
};

export default Toolbar;
