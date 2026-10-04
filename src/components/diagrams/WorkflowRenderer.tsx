'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  WorkflowSpec,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeType,
  ServiceType,
  PortType
} from '@/types/diagrams';
import ServiceIcon from './ServiceIcon';
import { applyDagreLayout } from '@/lib/diagrams/layoutEngine';
import { defaultDiagramExporter } from '@/lib/diagrams/diagramExporter';
import {
  Sparkles,
  Plus,
  Trash2,
  Download,
  Share2,
  Cpu,
  Layers,
  CheckCircle2,
  FileJson,
  Code
} from 'lucide-react';

interface WorkflowRendererProps {
  workflow: WorkflowSpec;
  onChangeWorkflow: (updated: WorkflowSpec) => void;
}

// Custom Node Component for React Flow
function WorkflowCustomNode({ data, selected, id }: any) {
  const isCondition = data.type === 'condition';
  const isAi = data.type === 'ai';
  const isTrigger = data.type === 'trigger';

  return (
    <div
      className={`w-64 rounded-xl border bg-zinc-900/95 text-zinc-100 p-3 shadow-xl backdrop-blur-md transition-all ${
        selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Input Handle */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-zinc-900"
        />
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 truncate">
          <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700/60 flex-shrink-0">
            <ServiceIcon service={data.service} size={15} />
          </div>
          <div className="truncate font-semibold text-xs text-zinc-100">{data.label}</div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
            {data.type}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-2">
        {data.description || 'Configured automation node'}
      </p>

      {/* AI Sub-Nodes slots */}
      {isAi && data.subNodes && data.subNodes.length > 0 && (
        <div className="pt-2 border-t border-zinc-800 space-y-1">
          <div className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5 text-amber-400" />
            <span>Agent Architecture:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {data.subNodes.map((sub: any, idx: number) => (
              <span
                key={idx}
                className="text-[9px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-300 font-mono"
              >
                {sub.kind}: {sub.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Output Handles */}
      {isCondition ? (
        <>
          <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 pt-1 mt-1 border-t border-zinc-800">
            <span className="text-emerald-400">TRUE (Pass)</span>
            <span className="text-red-400">FALSE (Fail)</span>
          </div>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            style={{ top: '40%' }}
            className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-zinc-900"
          />
          <Handle
            id="false"
            type="source"
            position={Position.Right}
            style={{ top: '75%' }}
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-zinc-900"
          />
        </>
      ) : (
        <Handle
          id="default"
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-blue-500 !border-2 !border-zinc-900"
        />
      )}
    </div>
  );
}

const nodeTypes = {
  custom: WorkflowCustomNode as any
};

export default function WorkflowRenderer({ workflow, onChangeWorkflow }: WorkflowRendererProps) {
  // Convert workflow spec nodes to React Flow format
  const flowNodes: Node[] = useMemo(() => {
    return workflow.nodes.map((n) => ({
      id: n.id,
      type: 'custom',
      position: n.position,
      data: {
        ...n,
        subNodes: workflow.subNodes?.filter((s) => s.parentId === n.id) || []
      }
    }));
  }, [workflow.nodes, workflow.subNodes]);

  // Convert workflow edges to React Flow format
  const flowEdges: Edge[] = useMemo(() => {
    return workflow.edges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      sourceHandle: e.fromPort === 'false' ? 'false' : e.fromPort === 'true' ? 'true' : 'default',
      label: e.label,
      animated: true,
      style: {
        stroke: e.fromPort === 'true' ? '#10B981' : e.fromPort === 'false' ? '#EF4444' : '#3B82F6',
        strokeWidth: 2
      },
      labelStyle: { fill: '#93C5FD', fontWeight: 600, fontSize: 11 },
      labelBgStyle: { fill: '#18181B', fillOpacity: 0.85 },
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4
    }));
  }, [workflow.edges]);

  const onNodesChange = useCallback(
    (changes: any) => {
      const updatedFlowNodes = applyNodeChanges(changes, flowNodes);
      const updatedNodes = workflow.nodes.map((node) => {
        const found = updatedFlowNodes.find((fn) => fn.id === node.id);
        return found ? { ...node, position: found.position } : node;
      });
      onChangeWorkflow({ ...workflow, nodes: updatedNodes });
    },
    [flowNodes, workflow, onChangeWorkflow]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      const updatedEdges = applyEdgeChanges(changes, flowEdges);
      const convertedEdges: WorkflowEdge[] = updatedEdges.map((e) => ({
        id: e.id,
        from: e.source,
        to: e.target,
        fromPort: (e.sourceHandle as PortType) || 'default',
        label: typeof e.label === 'string' ? e.label : undefined
      }));
      onChangeWorkflow({ ...workflow, edges: convertedEdges });
    },
    [flowEdges, workflow, onChangeWorkflow]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const newEdge: WorkflowEdge = {
        id: `e_${params.source}_${params.target}_${Date.now()}`,
        from: params.source,
        to: params.target,
        fromPort: (params.sourceHandle as PortType) || 'default'
      };
      onChangeWorkflow({
        ...workflow,
        edges: [...workflow.edges, newEdge]
      });
    },
    [workflow, onChangeWorkflow]
  );

  // Auto-Layout trigger
  const handleAutoLayout = () => {
    const positioned = applyDagreLayout(workflow.nodes, workflow.edges, workflow.subNodes);
    onChangeWorkflow({
      ...workflow,
      nodes: positioned
    });
  };

  // Add Node from quick palette
  const handleAddNode = (type: WorkflowNodeType, service: ServiceType, label: string) => {
    const newId = `node_${Date.now()}`;
    const newNode: WorkflowNode = {
      id: newId,
      type,
      service,
      label,
      description: `User-added ${type} step`,
      config: {},
      position: { x: 200, y: 200 }
    };

    const updatedNodes = [...workflow.nodes, newNode];
    onChangeWorkflow({
      ...workflow,
      nodes: updatedNodes
    });
  };

  // Export handlers
  const handleExportN8n = () => {
    const n8nStr = defaultDiagramExporter.exportN8nWorkflow(workflow);
    defaultDiagramExporter.downloadFile(
      n8nStr,
      `${workflow.name.toLowerCase().replace(/\s+/g, '-')}-n8n.json`,
      'application/json'
    );
  };

  const handleExportSvg = () => {
    const svgStr = defaultDiagramExporter.exportWorkflowSvg(workflow);
    defaultDiagramExporter.downloadFile(
      svgStr,
      `${workflow.name.toLowerCase().replace(/\s+/g, '-')}-workflow.svg`,
      'image/svg+xml'
    );
  };

  const handleExportJson = () => {
    defaultDiagramExporter.downloadFile(
      JSON.stringify(workflow, null, 2),
      `${workflow.name.toLowerCase().replace(/\s+/g, '-')}-spec.json`,
      'application/json'
    );
  };

  return (
    <div className="w-full h-full relative bg-zinc-950 flex flex-col">
      {/* Top Workflow Control Bar */}
      <div className="h-11 px-4 border-b border-zinc-800 bg-zinc-900/70 flex items-center justify-between text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-950/60 border border-blue-800/40 text-blue-400">
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-zinc-200">{workflow.name}</span>
          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
            {workflow.nodes.length} nodes • {workflow.edges.length} edges
          </span>
          {workflow.generationSource === 'heuristic' && (
            <span className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded font-mono">
              Heuristic Workflow
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoLayout}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded flex items-center gap-1.5 border border-zinc-700/60"
            title="Auto-organize graph left-to-right with Dagre"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Auto Layout</span>
          </button>

          <button
            onClick={handleExportN8n}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded flex items-center gap-1.5 shadow-sm"
            title="Export workflow ready to import directly into n8n"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Export n8n JSON</span>
          </button>

          <button
            onClick={handleExportSvg}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700/60"
            title="Download Vector SVG"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportJson}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700/60"
            title="Download Workflow JSON Spec"
          >
            <FileJson className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main React Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-zinc-950"
        >
          <Background color="#27272A" gap={20} size={1.5} />
          <Controls className="!bg-zinc-900 !border-zinc-800 !fill-zinc-200" />
          <MiniMap
            className="!bg-zinc-900/90 !border-zinc-800 !rounded-lg"
            nodeColor="#3B82F6"
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>

        {/* Quick Node Add Palette floating at bottom left */}
        <div className="absolute bottom-5 left-5 z-20 bg-zinc-900/90 border border-zinc-800/90 p-2 rounded-xl backdrop-blur-md shadow-2xl flex items-center gap-1.5 text-xs">
          <span className="text-[10px] text-zinc-400 font-semibold px-1 uppercase tracking-wider">Add:</span>
          <button
            onClick={() => handleAddNode('action', 'gmail', 'Send Email')}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex items-center gap-1"
          >
            <ServiceIcon service="gmail" size={13} />
            <span>Email</span>
          </button>
          <button
            onClick={() => handleAddNode('ai', 'anthropic', 'AI Agent')}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex items-center gap-1"
          >
            <ServiceIcon service="anthropic" size={13} />
            <span>AI Agent</span>
          </button>
          <button
            onClick={() => handleAddNode('condition', 'custom', 'Filter / Condition')}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Condition</span>
          </button>
          <button
            onClick={() => handleAddNode('action', 'slack', 'Slack Notification')}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex items-center gap-1"
          >
            <ServiceIcon service="slack" size={13} />
            <span>Slack</span>
          </button>
          <button
            onClick={() => handleAddNode('action', 'calendar', 'Book Event')}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 flex items-center gap-1"
          >
            <ServiceIcon service="calendar" size={13} />
            <span>Calendar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
