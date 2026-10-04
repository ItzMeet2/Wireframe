import dagre from 'dagre';
import { WorkflowNode, WorkflowEdge, WorkflowSubNode } from '@/types/diagrams';

export const WORKFLOW_NODE_WIDTH = 250;
export const WORKFLOW_NODE_HEIGHT = 100;
export const WORKFLOW_AI_NODE_HEIGHT = 160;

export function applyDagreLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  subNodes: WorkflowSubNode[] = []
): WorkflowNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'LR',
    align: 'UL',
    nodesep: 60,
    ranksep: 100,
    marginx: 40,
    marginy: 40
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Group subnodes by parent
  const subNodeCounts = new Map<string, number>();
  for (const s of subNodes) {
    subNodeCounts.set(s.parentId, (subNodeCounts.get(s.parentId) || 0) + 1);
  }

  // Add nodes to dagre
  for (const node of nodes) {
    const hasSubnodes = (subNodeCounts.get(node.id) || 0) > 0 || node.type === 'ai';
    const height = hasSubnodes ? WORKFLOW_AI_NODE_HEIGHT : WORKFLOW_NODE_HEIGHT;
    g.setNode(node.id, {
      width: WORKFLOW_NODE_WIDTH,
      height
    });
  }

  // Add edges to dagre
  for (const edge of edges) {
    g.setEdge(edge.from, edge.to);
  }

  dagre.layout(g);

  // Map computed positions back
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    const hasSubnodes = (subNodeCounts.get(node.id) || 0) > 0 || node.type === 'ai';
    const height = hasSubnodes ? WORKFLOW_AI_NODE_HEIGHT : WORKFLOW_NODE_HEIGHT;

    return {
      ...node,
      position: {
        x: Math.round(dagreNode.x - WORKFLOW_NODE_WIDTH / 2),
        y: Math.round(dagreNode.y - height / 2)
      }
    };
  });
}

export function areNodesOverlapping(a: WorkflowNode, b: WorkflowNode): boolean {
  const hA = a.type === 'ai' ? WORKFLOW_AI_NODE_HEIGHT : WORKFLOW_NODE_HEIGHT;
  const hB = b.type === 'ai' ? WORKFLOW_AI_NODE_HEIGHT : WORKFLOW_NODE_HEIGHT;

  return (
    a.position.x < b.position.x + WORKFLOW_NODE_WIDTH &&
    a.position.x + WORKFLOW_NODE_WIDTH > b.position.x &&
    a.position.y < b.position.y + hB &&
    a.position.y + hA > b.position.y
  );
}
