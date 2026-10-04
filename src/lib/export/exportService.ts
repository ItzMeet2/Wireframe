import { WireframeScreen, WireGenProject } from '@/types/wireframe';
import { DEVICE_DIMENSIONS } from '@/lib/layout/postProcessor';

export class ExportService {
  /**
   * Export all screens as formatted JSON spec
   */
  exportJsonSpec(project: WireGenProject): string {
    return JSON.stringify(
      {
        projectName: project.name,
        stack: project.stackInfo,
        screens: project.screens
      },
      null,
      2
    );
  }

  /**
   * Export comprehensive Markdown Screen Inventory
   */
  exportMarkdownInventory(project: WireGenProject): string {
    let md = `# ${project.name} - Screen Inventory & Wireframe Specs\n\n`;
    md += `**Primary Stack**: ${project.stackInfo.primaryStack} (${project.stackInfo.platform})\n`;
    md += `**Total Screens**: ${project.screens.length}\n`;
    md += `**Generated At**: ${new Date(project.updatedAt).toISOString()}\n\n`;

    if (project.analysisSummary?.flows && project.analysisSummary.flows.length > 0) {
      md += `## User Flows\n`;
      for (const flow of project.analysisSummary.flows) {
        md += `- **${flow.name}**: ${flow.steps.join(' ➔ ')}\n`;
      }
      md += `\n`;
    }

    md += `## Screens\n\n`;
    for (const screen of project.screens) {
      md += `### ${screen.name} (\`${screen.screenId}\`)\n`;
      md += `- **Device**: ${screen.device}\n`;
      md += `- **Layout Pattern**: ${screen.layout}\n`;
      md += `- **Primary Role**: ${screen.primaryRole || 'User'}\n`;
      md += `- **Purpose**: ${screen.purpose || 'N/A'}\n`;
      md += `- **Source**: ${screen.generationSource || 'heuristic'}\n`;
      md += `- **Component Count**: ${screen.elements.length}\n\n`;

      md += `| Element ID | Type | Label | Coordinates (X, Y) | Dimensions (W x H) | Navigates To |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      for (const el of screen.elements) {
        const cleanLabel = (el.label || '').replace(/[\n\r]+/g, ' ');
        md += `| \`${el.id}\` | \`${el.type}\` | ${cleanLabel || '-'} | ${el.x}, ${el.y} | ${el.width} x ${el.height} | ${el.navigatesTo || '-'} |\n`;
      }
      md += `\n---\n\n`;
    }

    return md;
  }

  /**
   * Generate vector SVG for a wireframe screen
   */
  exportScreenSvg(screen: WireframeScreen): string {
    const dims = DEVICE_DIMENSIONS[screen.device] || DEVICE_DIMENSIONS.desktop;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dims.width} ${dims.height}" width="${dims.width}" height="${dims.height}" style="background-color: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">\n`;

    // Screen frame & border
    svg += `  <rect x="0" y="0" width="${dims.width}" height="${dims.height}" fill="#FAFAFA" stroke="#D4D4D8" stroke-width="2"/>\n`;

    // Grid dots background
    svg += `  <defs>
    <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#E4E4E7" />
    </pattern>
  </defs>
  <rect width="${dims.width}" height="${dims.height}" fill="url(#grid)" />\n`;

    // Elements
    for (const el of screen.elements) {
      svg += this.renderSvgElement(el);
    }

    svg += `</svg>`;
    return svg;
  }

  private renderSvgElement(el: any): string {
    const { x, y, width, height, type, label } = el;
    let out = '';

    switch (type) {
      case 'navbar':
      case 'header':
        out += `  <!-- ${type}: ${label} -->\n`;
        out += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#F4F4F5" stroke="#A1A1AA" stroke-width="1.5" />\n`;
        out += `  <text x="${x + 16}" y="${y + height / 2 + 5}" font-size="14" font-weight="600" fill="#27272A">${this.escapeXml(label)}</text>\n`;
        break;

      case 'sidebar':
        out += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#FAFAFA" stroke="#D4D4D8" stroke-width="1.5" />\n`;
        out += `  <text x="${x + 12}" y="${y + 24}" font-size="13" font-weight="600" fill="#52525B">${this.escapeXml(label)}</text>\n`;
        break;

      case 'button':
        out += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="#E4E4E7" stroke="#71717A" stroke-width="1.5" />\n`;
        out += `  <text x="${x + width / 2}" y="${y + height / 2 + 4}" font-size="12" font-weight="600" fill="#18181B" text-anchor="middle">${this.escapeXml(label)}</text>\n`;
        break;

      case 'input':
      case 'select':
      case 'textarea':
        out += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="3" fill="#FFFFFF" stroke="#A1A1AA" stroke-width="1.5" />\n`;
        out += `  <text x="${x + 10}" y="${y + (type === 'textarea' ? 20 : height / 2 + 4)}" font-size="12" fill="#71717A">${this.escapeXml(label)}</text>\n`;
        break;

      case 'image':
        out += `  <!-- Image placeholder box with cross (X) -->\n`;
        out += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#F4F4F5" stroke="#A1A1AA" stroke-width="1.5" />\n`;
        out += `  <line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="#D4D4D8" stroke-width="1.5" />\n`;
        out += `  <line x1="${x + width}" y1="${y}" x2="${x}" y2="${y + height}" stroke="#D4D4D8" stroke-width="1.5" />\n`;
        out += `  <text x="${x + width / 2}" y="${y + height / 2 + 4}" font-size="12" fill="#71717A" text-anchor="middle">${this.escapeXml(label || 'Image')}</text>\n`;
        break;

      case 'table':
      case 'card':
      case 'chart':
        out += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="#FFFFFF" stroke="#D4D4D8" stroke-width="1.5" />\n`;
        out += `  <rect x="${x}" y="${y}" width="${width}" height="32" rx="4" fill="#F4F4F5" stroke="#E4E4E7" stroke-width="1" />\n`;
        out += `  <text x="${x + 12}" y="${y + 20}" font-size="12" font-weight="600" fill="#3F3F46">${this.escapeXml(label || type.toUpperCase())}</text>\n`;
        break;

      default:
        out += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#FFFFFF" stroke="#D4D4D8" stroke-width="1" stroke-dasharray="2,2" />\n`;
        out += `  <text x="${x + 6}" y="${y + height / 2 + 4}" font-size="11" fill="#71717A">${this.escapeXml(label || type)}</text>\n`;
        break;
    }

    return out;
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

export const defaultExportService = new ExportService();
