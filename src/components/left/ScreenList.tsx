'use client';

import React from 'react';
import { WireframeScreen } from '@/types/wireframe';
import {
  Smartphone,
  Monitor,
  Tablet,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Bot
} from 'lucide-react';

interface ScreenListProps {
  screens: WireframeScreen[];
  activeScreenId: string | null;
  onSelectScreen: (screenId: string) => void;
  onAddScreen: () => void;
  onDeleteScreen: (screenId: string) => void;
  onRetryScreen: (screen: WireframeScreen) => void;
  onClearAll?: () => void;
}

export default function ScreenList({
  screens,
  activeScreenId,
  onSelectScreen,
  onAddScreen,
  onDeleteScreen,
  onRetryScreen,
  onClearAll
}: ScreenListProps) {
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-zinc-400" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getStatusBadge = (screen: WireframeScreen) => {
    switch (screen.status) {
      case 'generating':
        return (
          <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
            <RotateCw className="w-2.5 h-2.5 animate-spin" />
            Generating
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
            <AlertTriangle className="w-2.5 h-2.5" />
            Failed
          </span>
        );
      case 'queued':
        return (
          <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
            <Clock className="w-2.5 h-2.5" />
            Queued
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Ready
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
          <span>Screens Inventory</span>
          <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded-full text-[10px]">
            {screens.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {screens.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="px-1.5 py-1 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 rounded text-[11px] flex items-center gap-1 transition-colors border border-transparent hover:border-red-800/40"
              title="Clear all generated screens"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={onAddScreen}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded text-xs flex items-center gap-1"
            title="Add New Screen"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Screen List items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {screens.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4 text-center text-xs text-zinc-500">
            No screens generated yet. Click "Analyze" or "Add" to create wireframes.
          </div>
        ) : (
          screens.map((screen) => {
            const isActive = activeScreenId === screen.screenId;
            const isHeuristic = screen.generationSource === 'heuristic';

            return (
              <div
                key={screen.screenId}
                onClick={() => onSelectScreen(screen.screenId)}
                className={`p-2.5 rounded-lg text-xs cursor-pointer border transition-all ${
                  isActive
                    ? 'bg-blue-950/30 border-blue-500/60 text-zinc-100 shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    {getDeviceIcon(screen.device)}
                    <span className="font-medium truncate">{screen.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Heuristic vs AI Badge */}
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        isHeuristic
                          ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                          : 'bg-blue-950 text-blue-300 border border-blue-800/50'
                      }`}
                      title={
                        isHeuristic
                          ? 'Extracted via deterministic code/document heuristics'
                          : 'Generated with AI Large Language Model'
                      }
                    >
                      {isHeuristic ? 'Heuristic' : 'AI'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
                  <div className="flex items-center gap-2">
                    <span>{screen.elements.length} elements</span>
                    {getStatusBadge(screen)}
                  </div>

                  <div className="flex items-center gap-1">
                    {screen.status === 'failed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRetryScreen(screen);
                        }}
                        className="p-1 hover:bg-zinc-700 text-amber-400 rounded"
                        title="Retry screen generation"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScreen(screen.screenId);
                      }}
                      className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                      title="Delete screen"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
