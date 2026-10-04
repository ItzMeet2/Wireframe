'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { WireframeScreen } from '@/types/wireframe';

// Dynamically import KonvaCanvasStage with ssr: false
const DynamicKonvaStage = dynamic(() => import('./KonvaCanvasStage'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-3">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium">Initializing WireGen Interactive Canvas...</span>
    </div>
  )
});

interface WireframeCanvasProps {
  screens: WireframeScreen[];
  activeScreenId: string | null;
  selectedElementId: string | null;
  showFlows: boolean;
  onSelectScreen: (screenId: string) => void;
  onSelectElement: (elementId: string | null, screenId: string | null) => void;
  onUpdateElementPosition: (screenId: string, elementId: string, x: number, y: number) => void;
  onRegenerateScreen?: (screen: WireframeScreen) => void;
}

export default function WireframeCanvas(props: WireframeCanvasProps) {
  if (!props.screens || props.screens.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8 text-center">
        <div className="max-w-md space-y-4">
          <div className="w-16 h-16 mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 text-2xl font-bold">
            📐
          </div>
          <h2 className="text-xl font-semibold text-zinc-200">No Wireframe Screens Yet</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Upload a workspace folder or drag-and-drop PRDs and code files on the left, then click{' '}
            <span className="text-blue-400 font-medium">Analyze</span> to generate your screens automatically.
          </p>
        </div>
      </div>
    );
  }

  return <DynamicKonvaStage {...props} />;
}
