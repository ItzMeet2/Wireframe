'use client';

import React, { useState } from 'react';
import { DiagramMode } from '@/types/diagrams';
import {
  Sparkles,
  Play,
  RotateCw,
  GitBranch,
  Undo2,
  Redo2,
  Download,
  Settings,
  Layers,
  CheckCircle2,
  Compass,
  Share2,
  PieChart,
  LayoutGrid
} from 'lucide-react';

interface HeaderProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  currentMode: DiagramMode;
  onSelectMode: (mode: DiagramMode) => void;
  suggestedModes?: DiagramMode[];
  onAnalyze: () => void;
  onGenerateAll: () => void;
  isAnalyzing: boolean;
  isGeneratingAll: boolean;
  showFlows: boolean;
  onToggleFlows: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  pipelineStage: 'idle' | 'scanning' | 'analyzing' | 'generating' | 'ready';
  streamingMessage?: string;
}

export default function Header({
  projectName,
  onUpdateProjectName,
  currentMode,
  onSelectMode,
  suggestedModes = [],
  onAnalyze,
  onGenerateAll,
  isAnalyzing,
  isGeneratingAll,
  showFlows,
  onToggleFlows,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  onOpenSettings,
  pipelineStage,
  streamingMessage
}: HeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(projectName);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameVal.trim()) {
      onUpdateProjectName(nameVal.trim());
    } else {
      setNameVal(projectName);
    }
  };

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between select-none z-30">
      {/* Left: App Logo & Project Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-600/30">
            W
          </div>
          <span className="font-bold text-sm text-zinc-100 tracking-tight">WireGen</span>
        </div>

        <div className="h-4 w-[1px] bg-zinc-700 mx-1" />

        {/* Project Name editable */}
        {isEditingName ? (
          <input
            type="text"
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
            autoFocus
            className="bg-zinc-950 border border-blue-500 rounded px-2 py-0.5 text-xs text-zinc-100 font-medium focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="text-xs font-medium text-zinc-200 hover:text-white px-2 py-1 rounded hover:bg-zinc-800/80 transition-colors"
            title="Click to rename project"
          >
            {projectName}
          </button>
        )}

        {/* Streaming / Pipeline Status */}
        {pipelineStage !== 'idle' && (
          <div className="ml-2 flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-[11px] text-zinc-300">
            {(isAnalyzing || isGeneratingAll) && <RotateCw className="w-3 h-3 text-blue-400 animate-spin" />}
            {pipelineStage === 'ready' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            <span>{streamingMessage || pipelineStage}</span>
          </div>
        )}
      </div>

      {/* Middle: 3 Diagram Modes Switcher */}
      <div className="flex items-center gap-1 bg-zinc-950/90 border border-zinc-800 rounded-xl p-1 shadow-inner">
        <button
          onClick={() => onSelectMode('wireframe')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all ${
            currentMode === 'wireframe'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Wireframe UI</span>
        </button>

        <button
          onClick={() => onSelectMode('workflow')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all ${
            currentMode === 'workflow'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Workflow Graph</span>
          {suggestedModes.includes('workflow') && currentMode !== 'workflow' && (
            <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-800/60 px-1.5 py-0.2 rounded-full animate-pulse">
              Suggested
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectMode('infographic')}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all ${
            currentMode === 'infographic'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Process Infographic</span>
          {suggestedModes.includes('infographic') && currentMode !== 'infographic' && (
            <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-800/60 px-1.5 py-0.2 rounded-full animate-pulse">
              Suggested
            </span>
          )}
        </button>
      </div>

      {/* Wireframe Canvas Tools (Flows, Undo/Redo) */}
      <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 rounded-lg p-1">
        {currentMode === 'wireframe' && (
          <>
            <button
              onClick={onToggleFlows}
              className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors ${
                showFlows ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Click-Through Flow Arrows"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Flow View</span>
            </button>
            <div className="h-3.5 w-[1px] bg-zinc-800 mx-1" />
          </>
        )}

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-800"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 rounded hover:bg-zinc-800"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Actions: Analyze, Generate All, Export, Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || isGeneratingAll}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/60"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Analyze Workspace</span>
        </button>

        <button
          onClick={onGenerateAll}
          disabled={isAnalyzing || isGeneratingAll}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/25"
        >
          {isGeneratingAll ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Generate All</span>
            </>
          )}
        </button>

        <div className="h-4 w-[1px] bg-zinc-800 mx-1" />

        <button
          onClick={onOpenExport}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Export Wireframes (JSON, Markdown, SVG, PDF)"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Settings & Server AI Keys"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
