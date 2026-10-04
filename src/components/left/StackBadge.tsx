'use client';

import React, { useState } from 'react';
import { StackInfo, PlatformType } from '@/types/wireframe';
import { Layers, Smartphone, Monitor, Tablet, Edit2, Check } from 'lucide-react';

interface StackBadgeProps {
  stackInfo: StackInfo;
  onUpdateStack: (updated: StackInfo) => void;
}

export default function StackBadge({ stackInfo, onUpdateStack }: StackBadgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStack, setEditedStack] = useState(stackInfo.primaryStack);
  const [editedPlatform, setEditedPlatform] = useState<PlatformType>(stackInfo.platform);

  const handleSave = () => {
    onUpdateStack({
      ...stackInfo,
      primaryStack: editedStack,
      platform: editedPlatform,
      isManualOverride: true
    });
    setIsEditing(false);
  };

  const getPlatformIcon = (plat: PlatformType) => {
    switch (plat) {
      case 'mobile':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-cyan-400" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 bg-zinc-900 border border-blue-500/40 rounded-lg space-y-2 text-xs">
        <div className="font-semibold text-zinc-200">Override Stack & Platform</div>
        <div>
          <label className="text-zinc-400">Framework / Stack:</label>
          <input
            type="text"
            value={editedStack}
            onChange={(e) => setEditedStack(e.target.value)}
            className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-100"
          />
        </div>
        <div>
          <label className="text-zinc-400">Target Platform:</label>
          <select
            value={editedPlatform}
            onChange={(e) => setEditedPlatform(e.target.value as PlatformType)}
            className="w-full mt-1 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-zinc-100"
          >
            <option value="web">Web (Desktop / Responsive)</option>
            <option value="mobile">Mobile (iOS / Android)</option>
            <option value="desktop">Desktop (Electron / WPF)</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => setIsEditing(false)}
            className="px-2 py-1 text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded flex items-center gap-1"
          >
            <Check className="w-3 h-3" /> Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-zinc-800 rounded">
          {getPlatformIcon(stackInfo.platform)}
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-semibold text-zinc-200">
            <span>{stackInfo.primaryStack}</span>
            {stackInfo.isManualOverride && (
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/40">
                Override
              </span>
            )}
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span>{stackInfo.platform.toUpperCase()}</span>
            <span>•</span>
            <span className={stackInfo.confidence >= 0.7 ? 'text-emerald-400' : 'text-amber-400'}>
              {Math.round(stackInfo.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded"
        title="Override Stack Settings"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
