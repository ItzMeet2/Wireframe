'use client';

import React, { useState } from 'react';
import { AnalysisSummary } from '@/types/wireframe';
import { X, Sparkles, Check, Plus, Trash2, ArrowRight } from 'lucide-react';

interface AnalysisSummaryModalProps {
  summary: AnalysisSummary;
  onClose: () => void;
  onGenerate: (updatedSummary: AnalysisSummary) => void;
}

export default function AnalysisSummaryModal({
  summary,
  onClose,
  onGenerate
}: AnalysisSummaryModalProps) {
  const [edited, setEdited] = useState<AnalysisSummary>(JSON.parse(JSON.stringify(summary)));
  const [newScreenName, setNewScreenName] = useState('');

  const handleAddScreen = () => {
    if (!newScreenName.trim()) return;
    const newId = `screen_${Date.now()}`;
    setEdited({
      ...edited,
      screens: [
        ...edited.screens,
        {
          id: newId,
          name: newScreenName.trim(),
          purpose: 'User defined screen',
          role: edited.roles[0] || 'User',
          components: ['navbar', 'card', 'button'],
          navigatesTo: []
        }
      ]
    });
    setNewScreenName('');
  };

  const handleRemoveScreen = (id: string) => {
    setEdited({
      ...edited,
      screens: edited.screens.filter((s) => s.id !== id)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-950/60 border border-blue-800/40 rounded-lg text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Review & Correct AI Product Analysis</h2>
              <p className="text-xs text-zinc-400">
                Review the synthesized application architecture, user roles, flows, and screen inventory before generating wireframes.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Overview Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">App Type</span>
              <input
                type="text"
                value={edited.appType}
                onChange={(e) => setEdited({ ...edited, appType: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-750 rounded px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">User Roles / Personas</span>
              <input
                type="text"
                value={edited.roles.join(', ')}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    roles: e.target.value.split(',').map((r) => r.trim()).filter(Boolean)
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-750 rounded px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
          </div>

          {/* User Flows */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Detected User Flows</h3>
            <div className="space-y-2">
              {edited.flows.map((flow, idx) => (
                <div key={idx} className="p-2.5 bg-zinc-950 border border-zinc-800/80 rounded-lg text-xs flex items-center gap-3">
                  <span className="font-semibold text-zinc-200 min-w-[140px]">{flow.name}:</span>
                  <div className="flex items-center gap-1.5 text-zinc-400 overflow-x-auto">
                    {flow.steps.map((step, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <span className="bg-zinc-900 px-2 py-0.5 rounded text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                          {step}
                        </span>
                        {sIdx < flow.steps.length - 1 && <ArrowRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proposed Screen Inventory */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Screen Inventory ({edited.screens.length})
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New screen name..."
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 w-48"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddScreen()}
                />
                <button
                  onClick={handleAddScreen}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Screen
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {edited.screens.map((screen) => (
                <div
                  key={screen.id}
                  className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={screen.name}
                      onChange={(e) => {
                        const updated = edited.screens.map((s) =>
                          s.id === screen.id ? { ...s, name: e.target.value } : s
                        );
                        setEdited({ ...edited, screens: updated });
                      }}
                      className="font-semibold text-zinc-200 bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-4/5"
                    />
                    <button
                      onClick={() => handleRemoveScreen(screen.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={screen.purpose}
                    onChange={(e) => {
                      const updated = edited.screens.map((s) =>
                        s.id === screen.id ? { ...s, purpose: e.target.value } : s
                      );
                      setEdited({ ...edited, screens: updated });
                    }}
                    placeholder="Screen purpose..."
                    className="w-full text-zinc-400 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px]"
                  />

                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Role: {screen.role}</span>
                    <span>Components: {screen.components.slice(0, 3).join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200">
            Cancel
          </button>
          <button
            onClick={() => onGenerate(edited)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm & Generate Wireframes ({edited.screens.length})
          </button>
        </div>
      </div>
    </div>
  );
}
