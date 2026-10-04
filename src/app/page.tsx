'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import WorkspaceTree from '@/components/left/WorkspaceTree';
import ScreenList from '@/components/left/ScreenList';
import StackBadge from '@/components/left/StackBadge';
import WireframeCanvas from '@/components/canvas/WireframeCanvas';
import PropertiesPanel from '@/components/right/PropertiesPanel';
import FilesSentPreviewModal from '@/components/left/FilesSentPreviewModal';
import AnalysisSummaryModal from '@/components/left/AnalysisSummaryModal';
import SettingsModal from '@/components/modals/SettingsModal';
import ExportModal from '@/components/modals/ExportModal';

import {
  WireGenProject,
  WireframeScreen,
  WireframeElement,
  WorkspaceFile,
  StackInfo,
  AnalysisSummary,
  ElementType
} from '@/types/wireframe';
import { StackDetector } from '@/lib/stack/detector';
import { defaultExtractorRegistry } from '@/lib/stack/extractorRegistry';
import { saveProject, loadProject } from '@/lib/persistence/projectStore';
import { TASK_MANAGER_WORKSPACE } from '@/sample/taskManagerWorkspace';
import { snapToGrid } from '@/lib/layout/postProcessor';
import { Files, Layers, Share2, PieChart, Sparkles, RefreshCw } from 'lucide-react';
import WorkflowRenderer from '@/components/diagrams/WorkflowRenderer';
import InfographicRenderer from '@/components/diagrams/InfographicRenderer';
import { detectDiagramMode } from '@/lib/diagrams/modeDetector';
import { defaultHeuristicDiagramGenerator } from '@/lib/diagrams/heuristicGenerator';
import { DiagramMode, ModeSuggestion } from '@/types/diagrams';

const INITIAL_PROJECT_ID = 'wiregen-default-project';

export default function WireGenApp() {
  const [project, setProject] = useState<WireGenProject>({
    id: INITIAL_PROJECT_ID,
    name: 'Task Manager Agile Suite',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    files: TASK_MANAGER_WORKSPACE,
    stackInfo: {
      primaryStack: 'Next.js',
      secondaryStacks: ['React'],
      platform: 'web',
      confidence: 0.92,
      evidence: ['package.json']
    },
    analysisSummary: null,
    screens: [],
    activeScreenId: null,
    history: { past: [], future: [] }
  });

  const [currentMode, setCurrentMode] = useState<DiagramMode>('wireframe');
  const [briefText, setBriefText] = useState<string>('');
  const [modeSuggestion, setModeSuggestion] = useState<ModeSuggestion>({
    suggestedModes: ['wireframe'],
    confidence: 0.85,
    reason: '',
    keywordsFound: []
  });

  const [activeTab, setActiveTab] = useState<'files' | 'screens'>('screens');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showFlows, setShowFlows] = useState<boolean>(true);

  // Modals
  const [showFilesPreview, setShowFilesPreview] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Pipeline & Streaming State
  const [pipelineStage, setPipelineStage] = useState<'idle' | 'scanning' | 'analyzing' | 'generating' | 'ready'>('idle');
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const [isRegeneratingSingle, setIsRegeneratingSingle] = useState(false);

  // Re-detect diagram mode when files or brief changes
  useEffect(() => {
    const suggestion = detectDiagramMode(project.files, briefText);
    setModeSuggestion(suggestion);
  }, [project.files, briefText]);

  // Initialize and load saved state from IndexedDB
  useEffect(() => {
    loadProject(INITIAL_PROJECT_ID).then((saved) => {
      if (saved && saved.screens && saved.screens.length > 0) {
        setProject(saved);
        if (saved.diagramMode) setCurrentMode(saved.diagramMode);
        if (!saved.activeScreenId && saved.screens.length > 0) {
          setProject((prev) => ({ ...prev, activeScreenId: saved.screens[0].screenId }));
        }
      } else {
        // Initial auto-detection for default workspace
        const detector = new StackDetector();
        const stack = detector.detect(TASK_MANAGER_WORKSPACE);
        setProject((prev) => ({
          ...prev,
          stackInfo: stack,
          workflowSpec: defaultHeuristicDiagramGenerator.generateWorkflow(briefText, 'Lead-Gen Outreach Pipeline'),
          infographicSpec: defaultHeuristicDiagramGenerator.generateInfographic(briefText, 'Autonomous AI Outreach Pipeline')
        }));
      }
    });
  }, []);

  // Save to IndexedDB whenever project screens or files change
  useEffect(() => {
    if (project.screens.length > 0 || project.files.length > 0) {
      saveProject(project).catch((err) => console.warn('Persistence error:', err));
    }
  }, [project]);

  // Push history snapshot for Undo
  const pushHistory = useCallback(
    (newScreens: WireframeScreen[]) => {
      setProject((prev) => {
        const past = [...(prev.history?.past || []), prev.screens].slice(-20);
        return {
          ...prev,
          screens: newScreens,
          updatedAt: Date.now(),
          history: { past, future: [] }
        };
      });
    },
    []
  );

  const handleUndo = () => {
    if (!project.history || project.history.past.length === 0) return;
    const previous = project.history.past[project.history.past.length - 1];
    const newPast = project.history.past.slice(0, -1);
    const newFuture = [project.screens, ...(project.history.future || [])];

    setProject((prev) => ({
      ...prev,
      screens: previous,
      history: { past: newPast, future: newFuture }
    }));
  };

  const handleRedo = () => {
    if (!project.history || project.history.future.length === 0) return;
    const next = project.history.future[0];
    const newFuture = project.history.future.slice(1);
    const newPast = [...(project.history.past || []), project.screens];

    setProject((prev) => ({
      ...prev,
      screens: next,
      history: { past: newPast, future: newFuture }
    }));
  };

  // Keyboard Shortcuts (Delete, Ctrl+Z, Ctrl+Y, Ctrl+D, Arrow keys nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      // Undo / Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
          return;
        }
        if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.key === 'd' && selectedElementId && project.activeScreenId) {
          e.preventDefault();
          const scr = project.screens.find((s) => s.screenId === project.activeScreenId);
          const el = scr?.elements.find((item) => item.id === selectedElementId);
          if (el) handleDuplicateElement(el);
          return;
        }
      }

      // Delete element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && project.activeScreenId) {
          e.preventDefault();
          handleDeleteElement(selectedElementId);
        }
      }

      // Arrow keys nudge selected element by 8px grid
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElementId && project.activeScreenId) {
        e.preventDefault();
        const activeScr = project.screens.find((s) => s.screenId === project.activeScreenId);
        const el = activeScr?.elements.find((i) => i.id === selectedElementId);
        if (el) {
          let deltaX = 0;
          let deltaY = 0;
          if (e.key === 'ArrowUp') deltaY = -8;
          if (e.key === 'ArrowDown') deltaY = 8;
          if (e.key === 'ArrowLeft') deltaX = -8;
          if (e.key === 'ArrowRight') deltaX = 8;
          handleUpdateElementPosition(project.activeScreenId, selectedElementId, el.x + deltaX, el.y + deltaY);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, project.activeScreenId, project.screens]);

  // Generate workflow architecture diagram specifically for a set of files
  const handleGenerateWorkflowForFiles = async (
    targetFiles: WorkspaceFile[],
    projName: string
  ) => {
    setCurrentMode('workflow');
    setProject((p) => ({ ...p, diagramMode: 'workflow' }));
    setPipelineStage('generating');
    setStreamingMessage(`Synthesizing architecture diagram for ${projName}...`);
    const active = targetFiles.filter((f) => f.selected);

    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'workflow',
          brief: briefText || `Repository Architecture for ${projName}`,
          title: projName,
          files: active
        })
      });

      const data = await res.json();
      if (data.success && data.workflow) {
        setProject((prev) => ({
          ...prev,
          diagramMode: 'workflow',
          workflowSpec: data.workflow
        }));
        setPipelineStage('ready');
        setStreamingMessage(`Architecture diagram generated successfully`);
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch {
      const fallback = defaultHeuristicDiagramGenerator.generateWorkflow(
        briefText,
        projName,
        active
      );
      setProject((prev) => ({
        ...prev,
        diagramMode: 'workflow',
        workflowSpec: fallback
      }));
      setPipelineStage('ready');
      setStreamingMessage(`Architecture diagram generated via heuristic fallback`);
    }
  };

  // Handle workspace files change and rerun stack detection with optional auto-generate
  const handleFilesChanged = (
    newFiles: WorkspaceFile[],
    newProjectName?: string,
    autoGenerate: boolean = false
  ) => {
    const detector = new StackDetector();
    const detected = detector.detect(newFiles);
    const updatedName = newProjectName || project.name;

    setProject((prev) => ({
      ...prev,
      name: updatedName,
      files: newFiles,
      stackInfo: prev.stackInfo.isManualOverride ? prev.stackInfo : detected
    }));

    if (autoGenerate) {
      handleGenerateWorkflowForFiles(newFiles, updatedName);
    }
  };

  // 1. Analyze Pipeline: Ingest -> Stack Detect -> Pluggable Screen Hints -> AI Analysis Call
  const handleStartAnalysis = async () => {
    setPipelineStage('analyzing');
    setStreamingMessage('Analyzing files & extracting screen hints...');

    const activeFiles = project.files.filter((f) => f.selected);
    const screenHints = defaultExtractorRegistry.extractAll(project.stackInfo, activeFiles);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: activeFiles.map((f) => ({ path: f.path, content: f.content })),
          screenHints,
          stackInfo: project.stackInfo,
          cacheKey: activeFiles.map((f) => f.hash).join('_')
        })
      });

      if (!res.ok) {
        throw new Error(`Analysis failed (${res.status})`);
      }

      const data = await res.json();
      setProject((prev) => ({
        ...prev,
        analysisSummary: data.summary
      }));

      setPipelineStage('ready');
      setStreamingMessage(data.fromCache ? 'Loaded from cache' : 'Analysis complete');
      setShowAnalysisModal(true);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setPipelineStage('idle');
      setStreamingMessage(`Analysis error: ${err.message}`);
    }
  };

  // 2. Batch Generation Pipeline: Server-Sent Events (SSE) streaming
  const handleGenerateFromSummary = async (confirmedSummary: AnalysisSummary) => {
    setShowAnalysisModal(false);
    setActiveTab('screens');
    setPipelineStage('generating');
    setStreamingMessage('Generating wireframe specs via SSE...');

    // Initialize screens in queued state
    const initialScreens: WireframeScreen[] = confirmedSummary.screens.map((s) => ({
      screenId: s.id,
      name: s.name,
      device: project.stackInfo.platform === 'mobile' ? 'mobile' : 'desktop',
      layout: 'sidebar',
      elements: [],
      purpose: s.purpose,
      primaryRole: s.role,
      generationSource: s.source || 'ai',
      status: 'queued'
    }));

    setProject((prev) => ({
      ...prev,
      analysisSummary: confirmedSummary,
      screens: initialScreens,
      activeScreenId: initialScreens[0]?.screenId || null
    }));

    try {
      const response = await fetch('/api/generate-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screensToGenerate: confirmedSummary.screens,
          inventory: confirmedSummary.screens.map((s) => ({ id: s.id, name: s.name })),
          device: project.stackInfo.platform === 'mobile' ? 'mobile' : 'desktop',
          layout: 'sidebar'
        })
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const event = JSON.parse(dataStr);

              if (event.type === 'status') {
                setStreamingMessage(`Generating "${event.screenId}"...`);
                setProject((prev) => ({
                  ...prev,
                  screens: prev.screens.map((s) =>
                    s.screenId === event.screenId ? { ...s, status: event.status } : s
                  )
                }));
              } else if (event.type === 'screen_ready') {
                setProject((prev) => {
                  const updated = prev.screens.map((s) =>
                    s.screenId === event.screenId
                      ? {
                          ...event.screen,
                          status: 'ready' as const,
                          generationSource: event.source || 'ai'
                        }
                      : s
                  );
                  return {
                    ...prev,
                    screens: updated
                  };
                });
              } else if (event.type === 'error') {
                setProject((prev) => ({
                  ...prev,
                  screens: prev.screens.map((s) =>
                    s.screenId === event.screenId
                      ? { ...s, status: 'failed' as const, errorMessage: event.error }
                      : s
                  )
                }));
              } else if (event.type === 'complete') {
                setPipelineStage('ready');
                setStreamingMessage('All wireframes generated successfully');
              }
            } catch (err) {
              console.error('SSE JSON parse error:', err);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Generation stream error:', err);
      setPipelineStage('idle');
      setStreamingMessage(`Generation error: ${err.message}`);
    }
  };

  // 3. Single Screen Regeneration with custom extra instruction
  const handleRegenerateSingleScreen = async (screenId: string, customInstruction: string) => {
    const target = project.screens.find((s) => s.screenId === screenId);
    if (!target) return;

    setIsRegeneratingSingle(true);
    setStreamingMessage(`Regenerating screen "${target.name}"...`);

    try {
      const res = await fetch('/api/generate-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          singleScreen: target,
          inventory: project.screens.map((s) => ({ id: s.screenId, name: s.name })),
          instruction: customInstruction
        })
      });

      const data = await res.json();
      if (data.success && data.screen) {
        const updatedScreens = project.screens.map((s) =>
          s.screenId === screenId
            ? { ...data.screen, status: 'ready' as const, generationSource: data.source }
            : s
        );
        pushHistory(updatedScreens);
        setStreamingMessage(`Screen "${target.name}" updated`);
      }
    } catch (err: any) {
      console.error('Regenerate single screen error:', err);
    } finally {
      setIsRegeneratingSingle(false);
    }
  };

  // Screen selection & element position updates
  const handleSelectScreen = (screenId: string) => {
    setProject((prev) => ({ ...prev, activeScreenId: screenId }));
    setSelectedElementId(null);
  };

  const handleSelectElement = (elementId: string | null, screenId: string | null) => {
    setSelectedElementId(elementId);
    if (screenId) {
      setProject((prev) => ({ ...prev, activeScreenId: screenId }));
    }
  };

  const handleUpdateElementPosition = (
    screenId: string,
    elementId: string,
    x: number,
    y: number
  ) => {
    const updatedScreens = project.screens.map((s) => {
      if (s.screenId !== screenId) return s;
      return {
        ...s,
        elements: s.elements.map((el) => (el.id === elementId ? { ...el, x, y } : el))
      };
    });
    pushHistory(updatedScreens);
  };

  const handleUpdateElement = (updated: WireframeElement) => {
    if (!project.activeScreenId) return;
    const updatedScreens = project.screens.map((s) => {
      if (s.screenId !== project.activeScreenId) return s;
      return {
        ...s,
        elements: s.elements.map((el) => (el.id === updated.id ? updated : el))
      };
    });
    pushHistory(updatedScreens);
  };

  const handleDeleteElement = (elementId: string) => {
    if (!project.activeScreenId) return;
    const updatedScreens = project.screens.map((s) => {
      if (s.screenId !== project.activeScreenId) return s;
      return {
        ...s,
        elements: s.elements.filter((el) => el.id !== elementId)
      };
    });
    setSelectedElementId(null);
    pushHistory(updatedScreens);
  };

  const handleDuplicateElement = (element: WireframeElement) => {
    if (!project.activeScreenId) return;
    const duplicated: WireframeElement = {
      ...element,
      id: `elem_${Date.now()}`,
      x: snapToGrid(element.x + 16),
      y: snapToGrid(element.y + 16)
    };

    const updatedScreens = project.screens.map((s) => {
      if (s.screenId !== project.activeScreenId) return s;
      return {
        ...s,
        elements: [...s.elements, duplicated]
      };
    });
    setSelectedElementId(duplicated.id);
    pushHistory(updatedScreens);
  };

  const handleAddElement = (type: ElementType, label: string) => {
    if (!project.activeScreenId) return;
    const newElement: WireframeElement = {
      id: `elem_${Date.now()}`,
      type,
      label,
      x: snapToGrid(64),
      y: snapToGrid(96),
      width: snapToGrid(160),
      height: snapToGrid(type === 'button' ? 36 : type === 'table' ? 200 : 80),
      children: []
    };

    const updatedScreens = project.screens.map((s) => {
      if (s.screenId !== project.activeScreenId) return s;
      return {
        ...s,
        elements: [...s.elements, newElement]
      };
    });
    setSelectedElementId(newElement.id);
    pushHistory(updatedScreens);
  };

  const handleUpdateScreen = (updated: WireframeScreen) => {
    const updatedScreens = project.screens.map((s) =>
      s.screenId === updated.screenId ? updated : s
    );
    pushHistory(updatedScreens);
  };

  const handleAddScreen = () => {
    const newId = `screen_${Date.now()}`;
    const newScreen: WireframeScreen = {
      screenId: newId,
      name: `Screen ${project.screens.length + 1}`,
      device: project.stackInfo.platform === 'mobile' ? 'mobile' : 'desktop',
      layout: 'sidebar',
      elements: [
        {
          id: 'hdr_1',
          type: 'navbar',
          label: 'Application Header',
          x: 0,
          y: 0,
          width: 800,
          height: 56
        }
      ],
      generationSource: 'manual',
      status: 'ready'
    };

    const updated = [...project.screens, newScreen];
    setProject((prev) => ({ ...prev, activeScreenId: newId }));
    pushHistory(updated);
  };

  const handleDeleteScreen = (screenId: string) => {
    const updated = project.screens.filter((s) => s.screenId !== screenId);
    setProject((prev) => ({
      ...prev,
      activeScreenId: updated[0]?.screenId || null
    }));
    pushHistory(updated);
  };

  const activeScreen = project.screens.find((s) => s.screenId === project.activeScreenId) || null;
  const selectedElement =
    activeScreen?.elements.find((el) => el.id === selectedElementId) || null;

  // Generate handler depending on active diagram mode
  const handleGenerateCurrentMode = async () => {
    if (currentMode === 'wireframe') {
      if (project.analysisSummary) {
        handleGenerateFromSummary(project.analysisSummary);
      } else {
        handleStartAnalysis();
      }
      return;
    }

    setPipelineStage('generating');
    setStreamingMessage(`Synthesizing ${currentMode} specification...`);

    try {
      const activeFiles = project.files.filter((f) => f.selected);
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: currentMode,
          brief: briefText || project.name,
          title: project.name,
          files: activeFiles
        })
      });

      const data = await res.json();
      if (data.success) {
        if (currentMode === 'workflow' && data.workflow) {
          setProject((prev) => ({ ...prev, workflowSpec: data.workflow }));
        } else if (currentMode === 'infographic' && data.infographic) {
          setProject((prev) => ({ ...prev, infographicSpec: data.infographic }));
        }
        setPipelineStage('ready');
        setStreamingMessage(`${currentMode} generated successfully`);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      console.error('Diagram generation error:', err);
      // Fallback
      if (currentMode === 'workflow') {
        setProject((p) => ({
          ...p,
          workflowSpec: defaultHeuristicDiagramGenerator.generateWorkflow(
            briefText,
            project.name,
            project.files.filter((f) => f.selected)
          )
        }));
      } else if (currentMode === 'infographic') {
        setProject((p) => ({
          ...p,
          infographicSpec: defaultHeuristicDiagramGenerator.generateInfographic(briefText, project.name)
        }));
      }
      setPipelineStage('ready');
      setStreamingMessage(`Generated via heuristic fallback`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Top Bar with 3 Diagram Modes */}
      <Header
        projectName={project.name}
        onUpdateProjectName={(name) => setProject((prev) => ({ ...prev, name }))}
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          setProject((prev) => ({ ...prev, diagramMode: mode }));
        }}
        suggestedModes={modeSuggestion.suggestedModes}
        onAnalyze={handleStartAnalysis}
        onGenerateAll={handleGenerateCurrentMode}
        isAnalyzing={pipelineStage === 'analyzing'}
        isGeneratingAll={pipelineStage === 'generating'}
        showFlows={showFlows}
        onToggleFlows={() => setShowFlows(!showFlows)}
        canUndo={(project.history?.past?.length || 0) > 0}
        canRedo={(project.history?.future?.length || 0) > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setShowExportModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        pipelineStage={pipelineStage}
        streamingMessage={streamingMessage}
      />

      {/* Main Three-Pane Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Pane (Workspace & Screens) */}
        <div className="w-80 border-r border-zinc-800 bg-zinc-900/60 flex flex-col min-w-[280px] max-w-[340px]">
          {/* Stack Detector Status & Override */}
          <div className="p-3 border-b border-zinc-800">
            <StackBadge
              stackInfo={project.stackInfo}
              onUpdateStack={(updated) => setProject((prev) => ({ ...prev, stackInfo: updated }))}
            />
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-zinc-800 bg-zinc-950/40 text-xs">
            <button
              onClick={() => setActiveTab('screens')}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                activeTab === 'screens'
                  ? 'border-blue-500 text-blue-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Screens ({project.screens.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 font-medium transition-colors border-b-2 ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-400 bg-zinc-900/50'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Files className="w-3.5 h-3.5" />
              <span>Workspace ({project.files.length})</span>
            </button>
          </div>

          {/* Active Tab Body */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'screens' ? (
              <ScreenList
                screens={project.screens}
                activeScreenId={project.activeScreenId}
                onSelectScreen={handleSelectScreen}
                onAddScreen={handleAddScreen}
                onDeleteScreen={handleDeleteScreen}
                onRetryScreen={(scr) => handleRegenerateSingleScreen(scr.screenId, '')}
              />
            ) : (
              <WorkspaceTree
                files={project.files}
                onFilesChanged={handleFilesChanged}
                onPreviewFilesSent={() => setShowFilesPreview(true)}
                briefText={briefText}
                onBriefTextChange={setBriefText}
                modeSuggestion={modeSuggestion}
                onSelectMode={(m) => {
                  setCurrentMode(m);
                  setProject((p) => ({ ...p, diagramMode: m }));
                }}
                onGenerateDiagram={handleGenerateCurrentMode}
                currentMode={currentMode}
              />
            )}
          </div>
        </div>

        {/* Center Pane: Switches between Wireframe Canvas, React Flow Workflow, and Process Infographic */}
        <div className="flex-1 relative overflow-hidden bg-zinc-950 flex flex-col">
          {currentMode === 'wireframe' && (
            <WireframeCanvas
              screens={project.screens}
              activeScreenId={project.activeScreenId}
              selectedElementId={selectedElementId}
              showFlows={showFlows}
              onSelectScreen={handleSelectScreen}
              onSelectElement={handleSelectElement}
              onUpdateElementPosition={handleUpdateElementPosition}
              onRegenerateScreen={(scr) => handleRegenerateSingleScreen(scr.screenId, '')}
            />
          )}

          {currentMode === 'workflow' && (
            <WorkflowRenderer
              workflow={
                project.workflowSpec ||
                defaultHeuristicDiagramGenerator.generateWorkflow(briefText, project.name)
              }
              onChangeWorkflow={(wf) => setProject((prev) => ({ ...prev, workflowSpec: wf }))}
            />
          )}

          {currentMode === 'infographic' && (
            <InfographicRenderer
              infographic={
                project.infographicSpec ||
                defaultHeuristicDiagramGenerator.generateInfographic(briefText, project.name)
              }
              onChangeInfographic={(info) =>
                setProject((prev) => ({ ...prev, infographicSpec: info }))
              }
            />
          )}
        </div>

        {/* Right Pane: Properties Panel or Mode-Specific Controls */}
        <div className="w-80 border-l border-zinc-800 bg-zinc-900/60 flex flex-col min-w-[280px] max-w-[340px]">
          {currentMode === 'wireframe' ? (
            <PropertiesPanel
              activeScreen={activeScreen}
              selectedElement={selectedElement}
              allScreens={project.screens}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onDuplicateElement={handleDuplicateElement}
              onAddElement={handleAddElement}
              onUpdateScreen={handleUpdateScreen}
              onRegenerateScreen={handleRegenerateSingleScreen}
              isRegenerating={isRegeneratingSingle}
            />
          ) : currentMode === 'workflow' ? (
            <div className="p-4 space-y-4 text-xs">
              <div className="pb-3 border-b border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Workflow Architecture
                </span>
                <div className="text-sm font-semibold text-zinc-100 mt-1">
                  {project.workflowSpec?.name || 'Automation Pipeline'}
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
                <div className="text-[11px] text-zinc-400">Total Nodes:</div>
                <div className="text-lg font-bold text-blue-400">
                  {project.workflowSpec?.nodes?.length || 8} Nodes
                </div>
                <div className="text-[11px] text-zinc-400">Total Connections:</div>
                <div className="text-sm font-semibold text-zinc-300">
                  {project.workflowSpec?.edges?.length || 8} Active Edges
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleGenerateCurrentMode}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 font-semibold text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Regenerate Workflow</span>
                </button>
              </div>

              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg text-zinc-400 leading-relaxed text-[11px]">
                <strong className="text-zinc-200 block mb-1">Canvas Instructions:</strong>
                • Drag any node to reposition.<br />
                • Drag from node handles to reconnect edges.<br />
                • Condition nodes branch out to TRUE / FALSE handles.<br />
                • Click "Export n8n JSON" in top bar to import into your n8n workspace.
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4 text-xs">
              <div className="pb-3 border-b border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Infographic Process
                </span>
                <div className="text-sm font-semibold text-zinc-100 mt-1">
                  {project.infographicSpec?.title || 'Process Flow'}
                </div>
              </div>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-2">
                <div className="text-[11px] text-zinc-400">Total Process Stages:</div>
                <div className="text-lg font-bold text-purple-400">
                  {project.infographicSpec?.stages?.length || 4} Sequential Stages
                </div>
                <div className="text-[11px] text-zinc-400">Accent Word:</div>
                <div className="text-sm font-semibold text-indigo-400">
                  "{project.infographicSpec?.accentWord || 'Autonomous'}"
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleGenerateCurrentMode}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 font-semibold text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Regenerate Infographic</span>
                </button>
              </div>

              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg text-zinc-400 leading-relaxed text-[11px]">
                <strong className="text-zinc-200 block mb-1">Theme & Export:</strong>
                • Toggle Dark / Light / Pastel gradient themes in the top bar.<br />
                • Download high-resolution vector SVG or browser-print to PDF.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showFilesPreview && (
        <FilesSentPreviewModal
          files={project.files}
          onClose={() => setShowFilesPreview(false)}
          onConfirm={handleStartAnalysis}
        />
      )}

      {showAnalysisModal && project.analysisSummary && (
        <AnalysisSummaryModal
          summary={project.analysisSummary}
          onClose={() => setShowAnalysisModal(false)}
          onGenerate={handleGenerateFromSummary}
        />
      )}

      {showSettingsModal && <SettingsModal onClose={() => setShowSettingsModal(false)} />}

      {showExportModal && (
        <ExportModal
          project={project}
          activeScreen={activeScreen}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
