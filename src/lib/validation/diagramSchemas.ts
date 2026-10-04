import { z } from 'zod';
import {
  WorkflowSpec,
  InfographicSpec,
  WorkflowNodeType,
  ServiceType,
  PortType,
  InfographicMockupType
} from '@/types/diagrams';

export const WorkflowNodeTypeEnum = z.enum([
  'trigger',
  'action',
  'condition',
  'ai',
  'http',
  'transform',
  'router',
  'output'
]);

export const ServiceTypeEnum = z.string().default('custom');

export const PortTypeEnum = z.enum(['default', 'true', 'false', 'tool', 'memory']);

export const WorkflowNodeSchema = z.object({
  id: z.string().min(1, 'Node id is required'),
  type: WorkflowNodeTypeEnum,
  label: z.string().min(1, 'Node label is required'),
  service: ServiceTypeEnum.default('custom'),
  description: z.string().default(''),
  config: z.record(z.string(), z.any()).default({}),
  position: z.object({
    x: z.number().default(0),
    y: z.number().default(0)
  }).default({ x: 0, y: 0 })
});

export const WorkflowEdgeSchema = z.object({
  id: z.string().min(1, 'Edge id is required'),
  from: z.string().min(1, 'Edge "from" node id is required'),
  to: z.string().min(1, 'Edge "to" node id is required'),
  fromPort: PortTypeEnum.default('default'),
  label: z.string().optional()
});

export const WorkflowSubNodeSchema = z.object({
  parentId: z.string().min(1, 'SubNode parentId is required'),
  kind: z.enum(['model', 'memory', 'tool']),
  label: z.string().min(1, 'SubNode label is required')
});

export const RawWorkflowSpecSchema = z.object({
  id: z.string().default('workflow_1'),
  name: z.string().min(1, 'Workflow name is required'),
  nodes: z.array(WorkflowNodeSchema).min(1, 'Workflow must contain at least one node'),
  edges: z.array(WorkflowEdgeSchema).default([]),
  subNodes: z.array(WorkflowSubNodeSchema).optional().default([])
});

export interface DiagramValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  rawError?: string;
}

/**
 * Validate Workflow Spec:
 * - Exactly one or more triggers
 * - No orphan nodes
 * - No dangling edges
 * - No cycles unless marked as loops
 */
export function validateWorkflowSpec(jsonInput: unknown): DiagramValidationResult<WorkflowSpec> {
  try {
    let parsedJson = jsonInput;
    if (typeof jsonInput === 'string') {
      try {
        parsedJson = JSON.parse(jsonInput);
      } catch (err: any) {
        return {
          success: false,
          errors: [`Invalid JSON string: ${err.message}`],
          rawError: err.message
        };
      }
    }

    const parseResult = RawWorkflowSpecSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      const errs = parseResult.error.issues.map(
        (issue) => `Field [${issue.path.join('.')}]: ${issue.message}`
      );
      return {
        success: false,
        errors: errs,
        rawError: JSON.stringify(parseResult.error.format(), null, 2)
      };
    }

    const spec = parseResult.data;
    const errors: string[] = [];
    const nodeMap = new Map<string, (typeof spec.nodes)[0]>();
    spec.nodes.forEach((n) => nodeMap.set(n.id, n));

    // 1. Exactly one or more triggers
    const triggerNodes = spec.nodes.filter((n) => n.type === 'trigger');
    if (triggerNodes.length < 1) {
      errors.push('Workflow validation error: Must contain at least one "trigger" node.');
    }

    // 2. No dangling edges
    for (const edge of spec.edges) {
      if (!nodeMap.has(edge.from)) {
        errors.push(`Dangling edge "${edge.id}": Source node "${edge.from}" does not exist in nodes list.`);
      }
      if (!nodeMap.has(edge.to)) {
        errors.push(`Dangling edge "${edge.id}": Target node "${edge.to}" does not exist in nodes list.`);
      }
    }

    // 3. No orphan nodes (nodes with 0 incoming AND 0 outgoing edges)
    if (spec.nodes.length > 1) {
      const connectedNodeIds = new Set<string>();
      for (const edge of spec.edges) {
        connectedNodeIds.add(edge.from);
        connectedNodeIds.add(edge.to);
      }

      for (const node of spec.nodes) {
        if (!connectedNodeIds.has(node.id)) {
          errors.push(`Orphan node "${node.id}" (${node.label}): Node has no incoming or outgoing connections.`);
        }
      }
    }

    // 4. Cycle detection (unless node or edge is explicitly marked as loop)
    const hasUnmarkedCycle = detectCycles(spec.nodes, spec.edges);
    if (hasUnmarkedCycle) {
      errors.push('Workflow validation error: Graph contains an unmarked cycle or recursive loop.');
    }

    if (errors.length > 0) {
      return {
        success: false,
        errors,
        rawError: errors.join('; ')
      };
    }

    return {
      success: true,
      data: spec as WorkflowSpec
    };
  } catch (err: any) {
    return {
      success: false,
      errors: [err?.message || 'Unknown workflow validation error'],
      rawError: String(err)
    };
  }
}

function detectCycles(nodes: { id: string; config?: Record<string, any> }[], edges: { from: string; to: string; label?: string }[]): boolean {
  const adj = new Map<string, string[]>();
  for (const n of nodes) {
    adj.set(n.id, []);
  }

  for (const e of edges) {
    // If edge or node is explicitly marked as loop, ignore in cycle check
    const isLoopEdge = /loop|retry|repeat/i.test(e.label || '');
    if (!isLoopEdge && adj.has(e.from)) {
      adj.get(e.from)!.push(e.to);
    }
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(curr: string): boolean {
    visited.add(curr);
    inStack.add(curr);

    const neighbors = adj.get(curr) || [];
    for (const nxt of neighbors) {
      if (!visited.has(nxt)) {
        if (dfs(nxt)) return true;
      } else if (inStack.has(nxt)) {
        // Detected back-edge / cycle
        return true;
      }
    }

    inStack.delete(curr);
    return false;
  }

  for (const n of nodes) {
    if (!visited.has(n.id)) {
      if (dfs(n.id)) return true;
    }
  }

  return false;
}

// Infographic Zod Schema
export const InfographicIconItemSchema = z.object({
  service: z.string().default('custom'),
  label: z.string().default('')
});

export const InfographicOutcomeItemSchema = z.object({
  icon: z.string().default('Check'),
  title: z.string().default(''),
  text: z.string().default('')
});

export const InfographicStageSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1, 'Stage title is required'),
  description: z.string().default(''),
  icons: z.array(InfographicIconItemSchema).default([]),
  outcomes: z.array(InfographicOutcomeItemSchema).default([]),
  mockup: z.enum(['email', 'chat', 'calendar', 'table', 'none']).default('none')
});

export const InfographicSpecSchema = z.object({
  title: z.string().min(1, 'Infographic title is required'),
  subtitle: z.string().default(''),
  accentWord: z.string().default(''),
  stages: z.array(InfographicStageSchema).min(1, 'Infographic must have at least one stage'),
  footer: z.string().optional()
});

export function validateInfographicSpec(jsonInput: unknown): DiagramValidationResult<InfographicSpec> {
  try {
    let parsedJson = jsonInput;
    if (typeof jsonInput === 'string') {
      try {
        parsedJson = JSON.parse(jsonInput);
      } catch (err: any) {
        return {
          success: false,
          errors: [`Invalid JSON string: ${err.message}`],
          rawError: err.message
        };
      }
    }

    const result = InfographicSpecSchema.safeParse(parsedJson);
    if (!result.success) {
      const errs = result.error.issues.map((i) => `Field [${i.path.join('.')}]: ${i.message}`);
      return {
        success: false,
        errors: errs,
        rawError: JSON.stringify(result.error.format(), null, 2)
      };
    }

    return {
      success: true,
      data: result.data as InfographicSpec
    };
  } catch (err: any) {
    return {
      success: false,
      errors: [err?.message || 'Unknown infographic validation error'],
      rawError: String(err)
    };
  }
}
