'use client';

import React, { useRef, useState } from 'react';
import { WorkspaceFile } from '@/types/wireframe';
import { shouldIgnoreFile, detectFileType } from '@/lib/scanner/fileFilter';
import { computeHash } from '@/lib/scanner/hash';
import { redactSecrets } from '@/lib/scanner/redact';
import { TASK_MANAGER_WORKSPACE } from '@/sample/taskManagerWorkspace';
import { ModeSuggestion, DiagramMode } from '@/types/diagrams';
import {
  FolderUp,
  Folder,
  FileCode,
  FileText,
  FileBox,
  CheckSquare,
  Square,
  ShieldAlert,
  Eye,
  Sparkles,
  Search,
  Bot,
  Share2,
  PieChart,
  GitBranch,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Play
} from 'lucide-react';

interface WorkspaceTreeProps {
  files: WorkspaceFile[];
  onFilesChanged: (files: WorkspaceFile[], newProjectName?: string, autoGenerate?: boolean) => void;
  onPreviewFilesSent: () => void;
  briefText?: string;
  onBriefTextChange?: (text: string) => void;
  modeSuggestion?: ModeSuggestion;
  onSelectMode?: (mode: DiagramMode) => void;
  onGenerateDiagram?: () => void;
  currentMode?: DiagramMode;
}

type IngestMode = 'path' | 'git' | 'upload';

export default function WorkspaceTree({
  files,
  onFilesChanged,
  onPreviewFilesSent,
  briefText = '',
  onBriefTextChange,
  modeSuggestion,
  onSelectMode,
  onGenerateDiagram,
  currentMode
}: WorkspaceTreeProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ingestMode, setIngestMode] = useState<IngestMode>('path');
  const [localPathInput, setLocalPathInput] = useState('');
  const [gitUrlInput, setGitUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // 1. Local Path Scanner
  const handleScanLocalPath = async (autoGenerate = false) => {
    const targetPath = localPathInput.trim();
    if (!targetPath) {
      setStatusMessage({ text: 'Please enter a valid folder path (e.g. E:\\my-project)', type: 'error' });
      return;
    }

    setIsScanning(true);
    setStatusMessage({ text: 'Scanning local directory & filtering build artifacts...', type: 'info' });

    try {
      const res = await fetch('/api/scan-local-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: targetPath })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan directory');
      }

      setStatusMessage({
        text: `Loaded ${data.scannedCount} files from "${data.projectName}"`,
        type: 'success'
      });

      onFilesChanged(data.files, data.projectName, autoGenerate);
    } catch (err: any) {
      console.error('Local path scan error:', err);
      setStatusMessage({ text: err.message || 'Error scanning path', type: 'error' });
    } finally {
      setIsScanning(false);
    }
  };

  // 2. Git Repository / GitDiagram Scanner
  const handleScanGitUrl = async (autoGenerate = false) => {
    const targetUrl = gitUrlInput.trim();
    if (!targetUrl) {
      setStatusMessage({ text: 'Please enter a GitHub repo link (e.g. facebook/react)', type: 'error' });
      return;
    }

    setIsScanning(true);
    setStatusMessage({ text: 'Fetching repository tree & code from GitHub...', type: 'info' });

    try {
      const res = await fetch('/api/git/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gitUrl: targetUrl })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch repository from GitHub');
      }

      setStatusMessage({
        text: `Imported ${data.scannedCount} files from ${data.projectName} (${data.defaultBranch})`,
        type: 'success'
      });

      onFilesChanged(data.files, data.projectName, autoGenerate);
    } catch (err: any) {
      console.error('Git scan error:', err);
      setStatusMessage({ text: err.message || 'Error fetching Git repo', type: 'error' });
    } finally {
      setIsScanning(false);
    }
  };

  // 3. File / Directory Upload Fallback (Safe, non-blocking)
  const handleDirectoryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = Array.from(e.target.files);
    await processFileList(fileList);
    e.target.value = '';
  };

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    await processFileList(Array.from(e.dataTransfer.files));
  };

  const processFileList = async (rawFiles: File[]) => {
    setIsScanning(true);
    setStatusMessage({ text: `Processing ${rawFiles.length} uploaded files...`, type: 'info' });

    try {
      // Filter out ignored paths immediately before reading file contents
      const filteredRaw = rawFiles
        .filter((f) => {
          const relPath = (f as any).webkitRelativePath || f.name;
          return !shouldIgnoreFile(relPath) && f.size < 500 * 1024;
        })
        .slice(0, 200);

      const newWorkspaceFiles: WorkspaceFile[] = [];

      for (const f of filteredRaw) {
        const relPath = (f as any).webkitRelativePath || f.name;
        try {
          const text = await f.text();
          const hash = await computeHash(text);
          const redactCheck = redactSecrets(text);

          newWorkspaceFiles.push({
            path: relPath,
            name: f.name,
            size: f.size,
            content: redactCheck.redactedText,
            selected: true,
            isRedacted: redactCheck.hasRedactions,
            hash,
            fileType: detectFileType(relPath)
          });
        } catch {
          // Skip unreadable binary
        }
      }

      if (newWorkspaceFiles.length > 0) {
        onFilesChanged(newWorkspaceFiles);
        setStatusMessage({ text: `Added ${newWorkspaceFiles.length} files to workspace`, type: 'success' });
      } else {
        setStatusMessage({ text: 'No supported code or doc files found in upload', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Failed to process files', type: 'error' });
    } finally {
      setIsScanning(false);
    }
  };

  const loadSampleTaskManager = () => {
    onFilesChanged(TASK_MANAGER_WORKSPACE, 'Task Manager Agile Suite');
    setStatusMessage({ text: 'Loaded sample TaskFlow workspace', type: 'success' });
  };

  const toggleSelectAll = (select: boolean) => {
    onFilesChanged(files.map((f) => ({ ...f, selected: select })));
  };

  const toggleFile = (path: string) => {
    onFilesChanged(
      files.map((f) => (f.path === path ? { ...f, selected: !f.selected } : f))
    );
  };

  const filteredFiles = files.filter(
    (f) =>
      f.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = files.filter((f) => f.selected).length;

  return (
    <div
      className={`h-full flex flex-col ${
        isDragging ? 'border-2 border-dashed border-blue-500 bg-blue-950/20' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Free-Text Brief Input */}
      <div className="p-3 border-b border-zinc-800 space-y-1.5 bg-zinc-950/40">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            Product / Architecture Brief
          </span>
          {briefText && (
            <button
              onClick={() => onBriefTextChange?.('')}
              className="text-[10px] text-zinc-400 hover:text-zinc-200"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          rows={2}
          value={briefText}
          onChange={(e) => onBriefTextChange?.(e.target.value)}
          placeholder="e.g. Next.js app architecture, API routes, or system description..."
          className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />

        {/* Mode Suggestion Badge */}
        {modeSuggestion && modeSuggestion.suggestedModes.length > 1 && (
          <div className="p-2 rounded bg-blue-950/40 border border-blue-800/40 text-[11px] space-y-1">
            <div className="text-blue-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Suggested Modes:</span>
            </div>
            <div className="flex gap-1.5 pt-0.5">
              {modeSuggestion.suggestedModes
                .filter((m) => m !== 'wireframe')
                .map((m) => (
                  <button
                    key={m}
                    onClick={() => onSelectMode?.(m)}
                    className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[10px] flex items-center gap-1"
                  >
                    {m === 'workflow' ? <Share2 className="w-2.5 h-2.5" /> : <PieChart className="w-2.5 h-2.5" />}
                    <span>Switch to {m}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Codebase Ingest Mode Tabs (Local Path / Git URL / Upload) */}
      <div className="p-3 border-b border-zinc-800 space-y-2.5 bg-zinc-900/30">
        <div className="flex rounded-lg bg-zinc-950 p-1 border border-zinc-800 text-[11px] font-medium">
          <button
            onClick={() => setIngestMode('path')}
            className={`flex-1 py-1 px-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
              ingestMode === 'path'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Folder className="w-3 h-3" />
            <span>Local Path</span>
          </button>
          <button
            onClick={() => setIngestMode('git')}
            className={`flex-1 py-1 px-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
              ingestMode === 'git'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <GitBranch className="w-3 h-3 text-amber-400" />
            <span>Git URL</span>
          </button>
          <button
            onClick={() => setIngestMode('upload')}
            className={`flex-1 py-1 px-1.5 rounded-md flex items-center justify-center gap-1 transition-all ${
              ingestMode === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <FolderUp className="w-3 h-3" />
            <span>Upload</span>
          </button>
        </div>

        {/* Tab 1: Local Path Ingestion */}
        {ingestMode === 'path' && (
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span>Direct Local Directory Path:</span>
                <button
                  type="button"
                  onClick={() => setLocalPathInput('e:\\RootCrypt_Projects\\Tools\\wireframes')}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-mono"
                  title="Use current wireframes workspace"
                >
                  Current Workspace
                </button>
              </div>
              <input
                type="text"
                value={localPathInput}
                onChange={(e) => setLocalPathInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanLocalPath(false)}
                placeholder="e.g. E:\projects\my-app or ./src"
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScanLocalPath(false)}
                disabled={isScanning || !localPathInput.trim()}
                className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-zinc-700/60"
              >
                {isScanning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>Scan Path</span>
              </button>

              <button
                type="button"
                onClick={() => handleScanLocalPath(true)}
                disabled={isScanning || !localPathInput.trim()}
                className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
                title="Scan files and instantly generate architecture diagram"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load & Generate</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: GitHub / GitDiagram Ingestion */}
        {ingestMode === 'git' && (
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span className="flex items-center gap-1">
                  <span>GitHub Repository / Subfolder URL:</span>
                </span>
                <span className="text-[10px] text-amber-400 font-medium bg-amber-950/60 border border-amber-800/40 px-1 rounded">
                  GitDiagram
                </span>
              </div>
              <input
                type="text"
                value={gitUrlInput}
                onChange={(e) => setGitUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanGitUrl(false)}
                placeholder="https://github.com/owner/repo or owner/repo"
                className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick sample repository chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-zinc-500">Quick:</span>
              {['facebook/react', 'vercel/next.js', 'shadcn-ui/ui'].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setGitUrlInput(`https://github.com/${sample}`)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 font-mono transition-colors"
                >
                  {sample.split('/')[1]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => handleScanGitUrl(false)}
                disabled={isScanning || !gitUrlInput.trim()}
                className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-zinc-700/60"
              >
                {isScanning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Fetch Repo</span>
              </button>

              <button
                type="button"
                onClick={() => handleScanGitUrl(true)}
                disabled={isScanning || !gitUrlInput.trim()}
                className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/30"
                title="Fetch Git repository and generate architecture diagram (GitDiagram style)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Git & Generate</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Upload / Sample */}
        {ingestMode === 'upload' && (
          <div className="space-y-2">
            <input
              ref={folderInputRef}
              type="file"
              /* @ts-ignore */
              webkitdirectory="true"
              directory=""
              multiple
              className="hidden"
              onChange={handleDirectoryUpload}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleDirectoryUpload}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isScanning}
                className="flex-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-zinc-700/60"
                title="Pick folder from disk"
              >
                <FolderUp className="w-3.5 h-3.5 text-blue-400" />
                <span>Upload Folder</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onFilesChanged([], 'New Project');
                  setStatusMessage({ text: 'Workspace cleared', type: 'info' });
                }}
                disabled={isScanning || files.length === 0}
                className="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-300 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors border border-zinc-700/50"
                title="Clear all workspace files"
              >
                <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Clear Files</span>
              </button>
            </div>
          </div>
        )}

        {/* Status / Alert Banner */}
        {statusMessage && (
          <div
            className={`p-2 rounded-lg text-[11px] flex items-start gap-1.5 ${
              statusMessage.type === 'error'
                ? 'bg-red-950/50 border border-red-800/60 text-red-300'
                : statusMessage.type === 'success'
                ? 'bg-emerald-950/50 border border-emerald-800/60 text-emerald-300'
                : 'bg-blue-950/50 border border-blue-800/60 text-blue-300'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-snug">{statusMessage.text}</span>
          </div>
        )}

        {/* Search & Bulk Select */}
        {files.length > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
            <div className="relative flex-1">
              <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
              />
            </div>
            <button
              onClick={() => toggleSelectAll(selectedCount !== files.length)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 whitespace-nowrap"
            >
              {selectedCount === files.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        )}
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-500">
            <FileBox className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs font-medium text-zinc-400">Workspace is empty</span>
            <p className="text-[11px] mt-1 text-zinc-500">
              Provide a local folder path, paste a GitHub repo link, or load a sample PRD to start.
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            const isDoc = file.fileType === 'document';
            return (
              <div
                key={file.path}
                onClick={() => toggleFile(file.path)}
                className={`group flex items-center justify-between p-1.5 rounded text-xs cursor-pointer select-none transition-colors ${
                  file.selected ? 'hover:bg-zinc-800/80 text-zinc-200' : 'opacity-50 hover:opacity-80 text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {file.selected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                  )}

                  {isDoc ? (
                    <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  )}

                  <span className="truncate font-mono text-[11px]">{file.path}</span>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  {file.isRedacted && (
                    <span title="Secrets detected and redacted">
                      <ShieldAlert className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500">
                    {Math.round(file.size / 1024) || 1}k
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info & Files sent to AI review button */}
      {files.length > 0 && (
        <div className="p-2.5 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>
            {selectedCount} of {files.length} included
          </span>
          <button
            onClick={onPreviewFilesSent}
            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium"
          >
            <Eye className="w-3 h-3" />
            Inspect Sent Files
          </button>
        </div>
      )}
    </div>
  );
}
