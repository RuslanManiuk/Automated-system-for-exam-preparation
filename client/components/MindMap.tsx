import React, { useState } from "react";
import { MindMapNode } from "../types";
import {
  ChevronRight,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

interface NodeProps {
  node: MindMapNode;
  isRoot?: boolean;
}

const TreeNode: React.FC<NodeProps> = ({ node, isRoot = false }) => {
  const [isExpanded, setIsExpanded] = useState(isRoot);

  // Defensive: gracefully handle if node is undefined/null
  if (!node) return null;

  const children = Array.isArray(node.children)
    ? node.children.filter(Boolean)
    : [];
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-start relative">
      <div className="flex items-center relative z-10">
        {/* Connector for non-roots */}
        {!isRoot && (
          <div className="w-8 h-px bg-gradient-to-r from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700 mr-2"></div>
        )}

        <div
          className={`
            flex items-center gap-2 px-5 py-3 rounded-full border-2 cursor-pointer transition-all select-none hover:shadow-lg
            ${
              isRoot
                ? "bg-gradient-to-br from-slate-900 to-slate-800 dark:from-primary dark:to-accent text-white border-slate-800 dark:border-primary shadow-xl"
                : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-accent hover:text-primary dark:hover:text-accent"
            }
          `}
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {hasChildren ? (
            <div
              className={`p-1 rounded-full transition-transform ${
                isRoot ? "bg-white/20" : "bg-slate-100 dark:bg-slate-600"
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-accent/70 animate-pulse"></div>
          )}
          <span
            className={`font-heading font-bold ${
              isRoot ? "text-lg" : "text-sm"
            }`}
          >
            {node.label || "(без назви)"}
          </span>
          {hasChildren && (
            <span
              className={`text-xs font-bold rounded-full px-2 py-1 ${
                isRoot ? "bg-white/20" : "bg-slate-200 dark:bg-slate-600"
              }`}
            >
              {children.length}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col ml-[calc(1rem+24px)] border-l-2 border-gradient-to-b from-slate-300 to-slate-100 dark:from-slate-600 dark:to-slate-700 pl-0 my-3 space-y-4 animate-in slide-in-from-left-2 duration-300 origin-top-left">
          {children.map((child, idx) =>
            child ? (
              <TreeNode key={child.id || `c-${idx}`} node={child} />
            ) : null,
          )}
        </div>
      )}
    </div>
  );
};

interface MindMapProps {
  data?: MindMapNode | null;
}

// Helper to sanitize mind map nodes (similar to MessageContent's sanitizer)
const sanitizeMindMapNode = (node?: MindMapNode | null): MindMapNode | null => {
  if (!node || typeof node !== "object") return null;
  const sanitized: MindMapNode = {
    id: node.id || `n-${Math.random().toString(36).slice(2, 9)}`,
    label: node.label || "(без назви)",
    children: undefined,
  };
  if (Array.isArray(node.children) && node.children.length > 0) {
    sanitized.children = node.children
      .filter(Boolean)
      .map((c) => sanitizeMindMapNode(c))
      .filter(Boolean) as MindMapNode[];
  }
  return sanitized;
};

export const MindMap: React.FC<MindMapProps> = ({ data }) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const sanitizedRoot = sanitizeMindMapNode(data);

  const handleZoom = (direction: "in" | "out") => {
    setZoom((prev) => {
      const newZoom = direction === "in" ? prev + 20 : prev - 20;
      return Math.max(50, Math.min(200, newZoom));
    });
  };

  if (!sanitizedRoot) {
    return (
      <div className="rounded-2xl p-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ментальна карта відсутня або пошкоджена.
        </p>
      </div>
    );
  }

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-white dark:bg-slate-900"
    : "h-[600px] w-full rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner";

  return (
    <div className={containerClass}>
      {/* Controls */}
      <div
        className={`${
          isFullscreen
            ? "p-4 border-b border-slate-200 dark:border-slate-700"
            : "p-4 flex items-center justify-between rounded-t-3xl bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
            Масштаб: {zoom}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom("out")}
            disabled={zoom <= 50}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Зменшити"
          >
            <ZoomOut className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={() => handleZoom("in")}
            disabled={zoom >= 200}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Збільшити"
          >
            <ZoomIn className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="На весь екран"
          >
            <Maximize2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-bold"
            >
              Закрити
            </button>
          )}
        </div>
      </div>

      {/* Map container */}
      <div
        className={`flex-1 p-6 bg-slate-50 dark:bg-slate-900 overflow-auto relative ${
          !isFullscreen && "rounded-b-3xl"
        }`}
      >
        {/* Dot grid background */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

        <div
          className="min-w-fit relative z-10"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top left",
            transition: "transform 0.2s ease",
          }}
        >
          <TreeNode node={sanitizedRoot} isRoot={true} />
        </div>
      </div>
    </div>
  );
};
