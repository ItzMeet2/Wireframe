'use client';

import React from 'react';
import { WireGenProject, WireframeScreen } from '@/types/wireframe';
import { defaultExportService } from '@/lib/export/exportService';
import { X, FileJson, FileText, Download, Code, Image as ImageIcon, Printer } from 'lucide-react';

interface ExportModalProps {
  project: WireGenProject;
  activeScreen: WireframeScreen | null;
  onClose: () => void;
}

export default function ExportModal({ project, activeScreen, onClose }: ExportModalProps) {
  const handleExportJson = () => {
    const jsonStr = defaultExportService.exportJsonSpec(project);
    defaultExportService.downloadFile(
      jsonStr,
      `${project.name.toLowerCase().replace(/\s+/g, '-')}-wireframe-spec.json`,
      'application/json'
    );
  };

  const handleExportMarkdown = () => {
    const mdStr = defaultExportService.exportMarkdownInventory(project);
    defaultExportService.downloadFile(
      mdStr,
      `${project.name.toLowerCase().replace(/\s+/g, '-')}-screen-inventory.md`,
      'text/markdown'
    );
  };

  const handleExportSvg = () => {
    const targetScreen = activeScreen || project.screens[0];
    if (!targetScreen) return;
    const svgStr = defaultExportService.exportScreenSvg(targetScreen);
    defaultExportService.downloadFile(
      svgStr,
      `${targetScreen.name.toLowerCase().replace(/\s+/g, '-')}.svg`,
      'image/svg+xml'
    );
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg flex flex-col shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Export Wireframes & Specs</h2>
              <span className="text-[11px] text-zinc-400">Export project specs in multiple standard formats</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {/* JSON Spec */}
          <button
            onClick={handleExportJson}
            className="w-full p-3 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-lg flex items-center justify-between text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-950/40 text-blue-400 rounded-lg group-hover:scale-105 transition-transform">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Wireframe JSON Specification</div>
                <div className="text-[11px] text-zinc-400">Complete JSON schema export for all {project.screens.length} screens</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          </button>

          {/* Markdown Screen Inventory */}
          <button
            onClick={handleExportMarkdown}
            className="w-full p-3 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-lg flex items-center justify-between text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-950/40 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Markdown Screen Inventory</div>
                <div className="text-[11px] text-zinc-400">Formatted documentation tables, roles, and user flows</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          </button>

          {/* Standalone Vector SVG */}
          <button
            onClick={handleExportSvg}
            className="w-full p-3 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-lg flex items-center justify-between text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950/40 text-cyan-400 rounded-lg group-hover:scale-105 transition-transform">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Standalone Vector SVG</div>
                <div className="text-[11px] text-zinc-400">
                  Export {activeScreen ? `"${activeScreen.name}"` : 'current screen'} as editable vector SVG
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          </button>

          {/* PDF / Print */}
          <button
            onClick={handlePrintPdf}
            className="w-full p-3 bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 rounded-lg flex items-center justify-between text-left transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-950/40 text-purple-400 rounded-lg group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200">Print / Save as PDF</div>
                <div className="text-[11px] text-zinc-400">Browser print layout for presentations and PDF export</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          </button>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
