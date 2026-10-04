import { WorkflowSpec, InfographicSpec } from '@/types/diagrams';

export class DiagramExporter {
  /**
   * Export workflow as n8n-compatible workflow JSON
   */
  exportN8nWorkflow(workflow: WorkflowSpec): string {
    const nodes: any[] = [];
    const connections: Record<string, { main: any[][] }> = {};

    const nodeNameMap = new Map<string, string>();

    for (const node of workflow.nodes) {
      nodeNameMap.set(node.id, node.label);

      let n8nType = 'n8n-nodes-base.httpRequest';
      if (node.type === 'trigger') {
        n8nType = 'n8n-nodes-base.webhook';
      } else if (node.type === 'ai') {
        n8nType = '@n8n/n8n-nodes-langchain.agent';
      } else if (node.type === 'condition') {
        n8nType = 'n8n-nodes-base.if';
      } else if (node.service === 'gmail') {
        n8nType = 'n8n-nodes-base.gmail';
      } else if (node.service === 'slack') {
        n8nType = 'n8n-nodes-base.slack';
      } else if (node.service === 'sheets') {
        n8nType = 'n8n-nodes-base.googleSheets';
      }

      nodes.push({
        parameters: { ...node.config },
        id: node.id,
        name: node.label,
        type: n8nType,
        typeVersion: 1,
        position: [node.position.x, node.position.y]
      });
    }

    for (const edge of workflow.edges) {
      const fromName = nodeNameMap.get(edge.from);
      const toName = nodeNameMap.get(edge.to);
      if (!fromName || !toName) continue;

      if (!connections[fromName]) {
        connections[fromName] = { main: [[]] };
      }

      const outputIndex = edge.fromPort === 'false' ? 1 : 0;
      while (connections[fromName].main.length <= outputIndex) {
        connections[fromName].main.push([]);
      }

      connections[fromName].main[outputIndex].push({
        node: toName,
        type: 'main',
        index: 0
      });
    }

    const n8nPayload = {
      name: workflow.name,
      nodes,
      connections,
      active: false,
      settings: {
        executionOrder: 'v1'
      },
      meta: {
        templateCredsSetupCompleted: true,
        generator: 'WireGen Multi-Mode Diagram Studio'
      }
    };

    return JSON.stringify(n8nPayload, null, 2);
  }

  /**
   * Export workflow as vector SVG
   */
  exportWorkflowSvg(workflow: WorkflowSpec): string {
    const maxX = Math.max(...workflow.nodes.map((n) => n.position.x + 280), 1000);
    const maxY = Math.max(...workflow.nodes.map((n) => n.position.y + 200), 700);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxX + 100} ${maxY + 100}" width="${maxX + 100}" height="${maxY + 100}" style="background-color: #09090B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n`;

    // Grid dots
    svg += `  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#27272A" />
    </pattern>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
    </marker>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />\n`;

    // Edges
    const nodePosMap = new Map<string, { x: number; y: number }>();
    workflow.nodes.forEach((n) => nodePosMap.set(n.id, n.position));

    for (const edge of workflow.edges) {
      const fromPos = nodePosMap.get(edge.from);
      const toPos = nodePosMap.get(edge.to);
      if (!fromPos || !toPos) continue;

      const startX = fromPos.x + 250;
      const startY = fromPos.y + 50;
      const endX = toPos.x;
      const endY = toPos.y + 50;
      const midX = (startX + endX) / 2;

      svg += `  <path d="M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}" fill="none" stroke="#3B82F6" stroke-width="2" marker-end="url(#arrow)" />\n`;
      if (edge.label) {
        svg += `  <text x="${midX}" y="${(startY + endY) / 2 - 8}" fill="#93C5FD" font-size="11" text-anchor="middle" font-weight="600">${this.escapeXml(edge.label)}</text>\n`;
      }
    }

    // Nodes
    for (const node of workflow.nodes) {
      const { x, y } = node.position;
      const height = node.type === 'ai' ? 140 : 96;

      svg += `  <!-- Node: ${node.label} -->\n`;
      svg += `  <rect x="${x}" y="${y}" width="250" height="${height}" rx="12" fill="#18181B" stroke="#3F3F46" stroke-width="1.5" />\n`;
      svg += `  <circle cx="${x + 24}" cy="${y + 28}" r="8" fill="#27272A" stroke="#52525B" />\n`;
      svg += `  <text x="${x + 42}" y="${y + 32}" font-size="13" font-weight="bold" fill="#FAFAFA">${this.escapeXml(node.label)}</text>\n`;
      svg += `  <text x="${x + 16}" y="${y + 56}" font-size="10" fill="#A1A1AA" width="218">${this.escapeXml(node.description.slice(0, 45))}</text>\n`;

      // Status pill
      svg += `  <rect x="${x + 16}" y="${y + 70}" width="65" height="16" rx="8" fill="#27272A" />\n`;
      svg += `  <text x="${x + 48}" y="${y + 82}" font-size="9" fill="#93C5FD" font-weight="bold" text-anchor="middle">${node.type.toUpperCase()}</text>\n`;
    }

    svg += `</svg>`;
    return svg;
  }

  /**
   * Export infographic as standalone Vector SVG
   */
  exportInfographicSvg(info: InfographicSpec): string {
    const width = 960;
    const stageHeight = 220;
    const height = 180 + info.stages.length * stageHeight;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #09090B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n`;

    // Title & Subtitle Header
    svg += `  <text x="480" y="56" font-size="28" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${this.escapeXml(info.title)}</text>\n`;
    svg += `  <text x="480" y="88" font-size="14" fill="#94A3B8" text-anchor="middle">${this.escapeXml(info.subtitle)}</text>\n`;

    // Render Stages
    let currentY = 120;
    for (const stage of info.stages) {
      svg += `  <!-- Stage ${stage.number}: ${stage.title} -->\n`;
      svg += `  <rect x="40" y="${currentY}" width="880" height="180" rx="16" fill="#18181B" stroke="#27272A" stroke-width="1.5" />\n`;

      // Number badge
      svg += `  <circle cx="80" cy="${currentY + 44}" r="22" fill="#2563EB" />\n`;
      svg += `  <text x="80" y="${currentY + 51}" font-size="18" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${stage.number}</text>\n`;

      // Stage Title & description
      svg += `  <text x="120" y="${currentY + 40}" font-size="18" font-weight="bold" fill="#FFFFFF">${this.escapeXml(stage.title)}</text>\n`;
      svg += `  <text x="120" y="${currentY + 64}" font-size="12" fill="#94A3B8">${this.escapeXml(stage.description.slice(0, 85))}</text>\n`;

      // Outcome cards
      let outX = 120;
      for (const outcome of stage.outcomes.slice(0, 3)) {
        svg += `  <rect x="${outX}" y="${currentY + 90}" width="220" height="70" rx="8" fill="#27272A" stroke="#3F3F46" />\n`;
        svg += `  <text x="${outX + 12}" y="${currentY + 114}" font-size="12" font-weight="bold" fill="#60A5FA">${this.escapeXml(outcome.title)}</text>\n`;
        svg += `  <text x="${outX + 12}" y="${currentY + 134}" font-size="10" fill="#CBD5E1">${this.escapeXml(outcome.text.slice(0, 38))}</text>\n`;
        outX += 236;
      }

      currentY += stageHeight;
    }

    svg += `</svg>`;
    return svg;
  }

  private escapeXml(unsafe: string): string {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  downloadFile(content: string, fileName: string, mimeType: string) {
    if (typeof window === 'undefined') return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const defaultDiagramExporter = new DiagramExporter();
