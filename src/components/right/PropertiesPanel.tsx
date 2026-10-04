'use client';

import React, { useState } from 'react';
import {
  WireframeScreen,
  WireframeElement,
  DeviceType,
  LayoutType,
  ElementType
} from '@/types/wireframe';
import { snapToGrid } from '@/lib/layout/postProcessor';
import ComponentPalette from './ComponentPalette';
import {
  Trash2,
  Copy,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  RotateCw,
  Navigation,
  FileText
} from 'lucide-react';

interface PropertiesPanelProps {
  activeScreen: WireframeScreen | null;
  selectedElement: WireframeElement | null;
  allScreens: WireframeScreen[];
  onUpdateElement: (updated: WireframeElement) => void;
  onDeleteElement: (elementId: string) => void;
  onDuplicateElement: (element: WireframeElement) => void;
  onAddElement: (type: ElementType, label: string) => void;
  onUpdateScreen: (updated: WireframeScreen) => void;
  onRegenerateScreen: (screenId: string, customInstruction: string) => void;
  isRegenerating: boolean;
}

export default function PropertiesPanel({
  activeScreen,
  selectedElement,
  allScreens,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onAddElement,
  onUpdateScreen,
  onRegenerateScreen,
  isRegenerating
}: PropertiesPanelProps) {
  const [instruction, setInstruction] = useState('');

  if (!activeScreen) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-xs text-zinc-500">
        Select a screen or element to inspect properties
      </div>
    );
  }

  const handleDeviceChange = (device: DeviceType) => {
    onUpdateScreen({
      ...activeScreen,
      device
    });
  };

  const handleLayoutChange = (layout: LayoutType) => {
    onUpdateScreen({
      ...activeScreen,
      layout
    });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Component Palette at top of Right Pane */}
      <ComponentPalette onAddElement={onAddElement} />

      {/* Conditional Inspector: Element vs Screen */}
      {selectedElement ? (
        <div className="p-4 space-y-4 flex-1">
          {/* Element Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Element Inspector
              </span>
              <div className="text-xs font-mono text-zinc-200 mt-0.5">
                {selectedElement.type} ({selectedElement.id})
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onDuplicateElement(selectedElement)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeleteElement(selectedElement.id)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded"
                title="Delete element"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Label Input */}
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Label / Content</label>
            <input
              type="text"
              value={selectedElement.label || ''}
              onChange={(e) => onUpdateElement({ ...selectedElement, label: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-750 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Geometry Coordinates (8px Grid Snapped) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-zinc-400">Position & Size</label>
              <span className="text-[10px] text-zinc-500 font-mono">8px grid snapped</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500">X:</span>
                <input
                  type="number"
                  step="8"
                  value={selectedElement.x}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, x: snapToGrid(Number(e.target.value)) })
                  }
                  className="w-full bg-zinc-900 border border-zinc-750 rounded px-2 py-1 text-zinc-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500">Y:</span>
                <input
                  type="number"
                  step="8"
                  value={selectedElement.y}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, y: snapToGrid(Number(e.target.value)) })
                  }
                  className="w-full bg-zinc-900 border border-zinc-750 rounded px-2 py-1 text-zinc-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500">W:</span>
                <input
                  type="number"
                  step="8"
                  value={selectedElement.width}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, width: snapToGrid(Number(e.target.value)) })
                  }
                  className="w-full bg-zinc-900 border border-zinc-750 rounded px-2 py-1 text-zinc-100"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500">H:</span>
                <input
                  type="number"
                  step="8"
                  value={selectedElement.height}
                  onChange={(e) =>
                    onUpdateElement({ ...selectedElement, height: snapToGrid(Number(e.target.value)) })
                  }
                  className="w-full bg-zinc-900 border border-zinc-750 rounded px-2 py-1 text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Navigates To (Click-Through Flow Link) */}
          <div className="space-y-1 pt-2">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-blue-400" />
              Navigates To Screen (Flow Arrow)
            </label>
            <select
              value={selectedElement.navigatesTo || ''}
              onChange={(e) =>
                onUpdateElement({
                  ...selectedElement,
                  navigatesTo: e.target.value || null
                })
              }
              className="w-full bg-zinc-900 border border-zinc-750 rounded px-2 py-1.5 text-xs text-zinc-100"
            >
              <option value="">None (Static Element)</option>
              {allScreens
                .filter((s) => s.screenId !== activeScreen.screenId)
                .map((s) => (
                  <option key={s.screenId} value={s.screenId}>
                    ➔ {s.name} ({s.screenId})
                  </option>
                ))}
            </select>
          </div>

          {/* Annotations / Notes */}
          <div className="space-y-1 pt-2">
            <label className="text-xs text-zinc-400 flex items-center gap-1">
              <FileText className="w-3 h-3 text-zinc-500" />
              Element Notes & UX Spec
            </label>
            <textarea
              rows={3}
              value={selectedElement.notes || ''}
              onChange={(e) => onUpdateElement({ ...selectedElement, notes: e.target.value })}
              placeholder="Add behavioral requirements or accessibility notes..."
              className="w-full bg-zinc-900 border border-zinc-750 rounded p-2 text-xs text-zinc-100 placeholder-zinc-500"
            />
          </div>
        </div>
      ) : (
        /* Screen Properties Panel */
        <div className="p-4 space-y-5 flex-1">
          <div className="pb-3 border-b border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Screen Properties
            </span>
            <div className="text-sm font-semibold text-zinc-100 mt-1">{activeScreen.name}</div>
          </div>

          {/* Device Switcher */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Device Frame</label>
            <div className="grid grid-cols-3 gap-2">
              {(['mobile', 'tablet', 'desktop'] as DeviceType[]).map((dev) => (
                <button
                  key={dev}
                  onClick={() => handleDeviceChange(dev)}
                  className={`p-2 rounded text-xs flex flex-col items-center gap-1 border transition-all ${
                    activeScreen.device === dev
                      ? 'bg-blue-950/40 border-blue-500/70 text-blue-300 font-medium'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {dev === 'mobile' && <Smartphone className="w-4 h-4" />}
                  {dev === 'tablet' && <Tablet className="w-4 h-4" />}
                  {dev === 'desktop' && <Monitor className="w-4 h-4" />}
                  <span className="capitalize text-[11px]">{dev}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Pattern */}
          <div className="space-y-1">
            <label className="text-xs text-zinc-400">Layout Pattern</label>
            <select
              value={activeScreen.layout}
              onChange={(e) => handleLayoutChange(e.target.value as LayoutType)}
              className="w-full bg-zinc-900 border border-zinc-750 rounded px-2.5 py-1.5 text-xs text-zinc-100"
            >
              <option value="stack">Stack (Single Column)</option>
              <option value="grid">Grid (Dashboard / Tiles)</option>
              <option value="sidebar">Sidebar Navigation</option>
              <option value="tabs">Tabs Layout</option>
            </select>
          </div>

          {/* Purpose & Role */}
          <div className="space-y-2">
            <div>
              <label className="text-xs text-zinc-400">Primary Role</label>
              <input
                type="text"
                value={activeScreen.primaryRole || 'User'}
                onChange={(e) => onUpdateScreen({ ...activeScreen, primaryRole: e.target.value })}
                className="w-full mt-1 bg-zinc-900 border border-zinc-750 rounded px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Purpose</label>
              <textarea
                rows={2}
                value={activeScreen.purpose || ''}
                onChange={(e) => onUpdateScreen({ ...activeScreen, purpose: e.target.value })}
                className="w-full mt-1 bg-zinc-900 border border-zinc-750 rounded p-2 text-xs text-zinc-100"
              />
            </div>
          </div>

          {/* Regenerate Screen with extra instruction */}
          <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Regenerate Screen with Instruction</span>
            </div>
            <textarea
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g. Add a filter bar and make the table denser..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => onRegenerateScreen(activeScreen.screenId, instruction)}
              disabled={isRegenerating}
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {isRegenerating ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCw className="w-3.5 h-3.5" />
                  Regenerate Wireframe
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
