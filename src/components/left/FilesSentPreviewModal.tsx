'use client';

import React, { useState } from 'react';
import { WorkspaceFile } from '@/types/wireframe';
import { ShieldCheck, ShieldAlert, FileText, X, Eye } from 'lucide-react';
import { redactSecrets } from '@/lib/scanner/redact';

interface FilesSentPreviewModalProps {
  files: WorkspaceFile[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function FilesSentPreviewModal({
  files,
  onClose,
  onConfirm
}: FilesSentPreviewModalProps) {
  const selectedFiles = files.filter((f) => f.selected);
  const [activeFile, setActiveFile] = useState<WorkspaceFile | null>(selectedFiles[0] || null);

  const totalChars = selectedFiles.reduce((acc, f) => acc + (f.content?.length || 0), 0);
  const estimatedTokens = Math.round(totalChars / 4);

  const totalRedactions = selectedFiles.reduce((acc, f) => {
    const res = redactSecrets(f.content || '');
    return acc + res.redactedCount;
  }, 0);

  const activeRedacted = activeFile ? redactSecrets(activeFile.content || '') : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-950/60 border border-blue-800/40 rounded-lg text-blue-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Files Sent to AI & Secret Redaction</h2>
              <p className="text-xs text-zinc-400">
                Review the exact workspace content transmitted to the AI. All detected secrets are redacted server-side.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Banner */}
        <div className="px-4 py-2.5 bg-zinc-950/70 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-zinc-300">
            <span>Files Included: <strong className="text-zinc-100">{selectedFiles.length}</strong></span>
            <span>Estimated Tokens: <strong className="text-zinc-100">~{estimatedTokens.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            {totalRedactions > 0 ? (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                <ShieldAlert className="w-3.5 h-3.5" />
                {totalRedactions} Secrets Redacted
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero Secrets Detected
              </span>
            )}
          </div>
        </div>

        {/* Body Split */}
        <div className="flex-1 grid grid-cols-12 min-h-0 divide-x divide-zinc-800 overflow-hidden">
          {/* File List */}
          <div className="col-span-4 p-3 overflow-y-auto space-y-1">
            {selectedFiles.map((file) => {
              const fileRedact = redactSecrets(file.content || '');
              const isSelected = activeFile?.path === file.path;

              return (
                <button
                  key={file.path}
                  onClick={() => setActiveFile(file)}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200'
                      : 'hover:bg-zinc-800/70 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                    <span className="truncate">{file.path}</span>
                  </div>
                  {fileRedact.hasRedactions && (
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-1 py-0.5 rounded ml-1">
                      {fileRedact.redactedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Redacted Preview */}
          <div className="col-span-8 p-3 flex flex-col bg-zinc-950/40 overflow-hidden">
            {activeFile ? (
              <>
                <div className="text-xs font-mono text-zinc-400 mb-2 truncate">
                  Preview: {activeFile.path}
                </div>
                <div className="flex-1 overflow-auto bg-zinc-950 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {activeRedacted?.redactedText}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
                Select a file to inspect redacted content
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Proceed With Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
