import { DeviceType, LayoutType } from '@/types/wireframe';
import { DEVICE_DIMENSIONS } from '@/lib/layout/postProcessor';

export const WIREFRAME_SYSTEM_PROMPT = `
You are a senior UX designer specializing in low-fidelity wireframes.
Your task is to generate a structured wireframe specification JSON for a designated screen in an application.

The output MUST strictly match the following JSON Schema:
{
  "screenId": "string",
  "name": "string",
  "device": "mobile | tablet | desktop",
  "layout": "stack | grid | sidebar | tabs",
  "elements": [
    {
      "id": "string",
      "type": "header | navbar | sidebar | button | input | textarea | select | checkbox | radio | toggle | table | list | card | image | chart | modal | tabs | breadcrumb | footer | text | icon",
      "label": "string",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "children": [],
      "navigatesTo": "screenId | null",
      "notes": "string"
    }
  ]
}

DESIGN RULES:
1. Low-Fidelity Grayscale: Design clean, functional wireframe layouts.
2. Coordinates: Use realistic 8px-grid coordinates within the specified screen dimensions.
3. Element Types:
   - header/navbar: Full width across top (y=0 or below status bar), height 48-64.
   - sidebar: Left side (x=0, y=56 or 0, width 180-240, height fills screen).
   - button: Standard width 96-180, height 36-44.
   - input/select: Standard width 160-320, height 36-40.
   - table/card/list: Structured data containers, width 280-900, height 120-400.
   - image: Placeholder box (width 120-400, height 80-240).
4. Flows: Where a button, link, or row triggers navigation to another screen in the inventory, set "navigatesTo" to that screenId.
5. NO markdown formatting, NO explanation, NO conversational filler. Return ONLY valid raw JSON.
`.trim();

export function buildWireframeUserPrompt(params: {
  screenId: string;
  name: string;
  purpose: string;
  role: string;
  device: DeviceType;
  layout: LayoutType;
  components: string[];
  inventory: { id: string; name: string }[];
  instruction?: string;
  validationError?: string;
}): string {
  const dimensions = DEVICE_DIMENSIONS[params.device];

  let prompt = `
Generate a wireframe spec for screen:
Screen ID: "${params.screenId}"
Screen Name: "${params.name}"
Purpose: "${params.purpose}"
Primary User Role: "${params.role}"
Target Device: "${params.device}" (Width: ${dimensions.width}px, Height: ${dimensions.height}px)
Layout Pattern: "${params.layout}"
Required Components: ${params.components.join(', ')}

Screen Inventory for navigatesTo links:
${params.inventory.map((s) => `- ID: "${s.id}", Name: "${s.name}"`).join('\n')}
`;

  if (params.instruction) {
    prompt += `\nAdditional Custom Instruction: "${params.instruction}"\n`;
  }

  if (params.validationError) {
    prompt += `
CRITICAL RETRY INSTRUCTION:
Your previous output failed schema validation with the following errors:
${params.validationError}

Please fix these errors and ensure ALL elements have valid id, type, label, x, y, width, height, and valid navigatesTo IDs from the inventory (or null).
`;
  }

  return prompt.trim();
}
