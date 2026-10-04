# WireGen — Stack-Agnostic Low-Fidelity Studio & Multi-Mode Diagram Engine

WireGen scans a user's workspace (PRD documents, code repositories, views, routes, models) and optional free-text briefs to automatically generate editable UI wireframes, node-based automation workflow graphs (n8n/Zapier style), and multi-stage process infographics.

---

## 🏛 Diagram Modes

WireGen supports three distinct output modes, selectable per project with automated mode detection:
1. **`wireframe`**: Interactive low-fidelity grayscale UI screens with 8px grid snapping, element inspectors, and click-through navigation arrows.
2. **`workflow`**: Node-based automation graph with custom handles, condition branching (`true` / `false`), AI sub-nodes (`model`, `memory`, `tool`), left-to-right Dagre auto-layout, and direct **n8n workflow JSON export**.
3. **`infographic`**: Vertical stack of numbered stage cards joined by down arrows, with integrated tool badges, tangible outcome cards, interactive mockup previews (`email`, `chat`, `calendar`, `table`), and gradient theme switching (`dark`, `light`, `pastel`).

---

## 🏛 Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Workspace & Brief Inputs                        │
│   PRDs (.md, .txt) | React/Next.js | ASP.NET MVC/Razor | Flutter Dart  │
│   Optional Free-Text Brief: "AI agent finds leads, emails them..."     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│          Mode Detector & IStackDetector / ScreenExtractors             │
│   • ModeDetector: identifies automation, agent & outreach keywords     │
│     and suggests Workflow and Infographic modes with confidence        │
│   • StackDetector: analyzes package.json, csproj, pubspec, extensions  │
│   • ScreenExtractors: ReactNext, RazorMvc, Flutter, Generic PRD        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│       AI Generation & Zod Schema Validators with 2-Retry Loop          │
│   • Anthropic Claude & OpenAI (Server-side API routes only)           │
│   • Wireframe Spec Validator: 8px grid, schema rules                   │
│   • Workflow Spec Validator: 1+ triggers, no orphans, no dangling      │
│     edges, cycle detection                                             │
│   • Infographic Spec Validator: 3-5 numbered stages, outcomes & mockups│
│   • Heuristic Fallback Engine: 100% offline deterministic resilience   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Multi-Mode Studio Canvas                        │
│   • Mode A (Wireframe): Konva canvas with pan/zoom, flows & palette    │
│   • Mode B (Workflow): React Flow with Dagre auto-layout & n8n export  │
│   • Mode C (Infographic): Numbered process stack with themes & mockups │
│   • Exporters: PNG, SVG, PDF, Markdown, JSON, n8n workflow JSON       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v22.16.0)
- npm 9+

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables (Server-Side Only)
Create a `.env.local` file in the root directory:
```bash
# Anthropic Claude API Key (server-side only, never sent to browser)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional OpenAI Fallback
OPENAI_API_KEY=sk-...
```
> **Security Note:** You can also configure server-side API keys on-the-fly inside the app using the **Settings** modal in the top right. Keys are stored in server-side session memory and are never written to `localStorage` or client state.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
```bash
npm test
```
Runs the full Vitest suite covering the Stack Detector, Screen Extractors, Zod Spec Validator, Layout Post-Processor, Secret Redactor, and End-to-End Task Manager resilience pipeline.

---

## 📋 Features

### Phase 1: Scanner, Stack Detector & Analysis
- **Folder & File Upload**: Uses `webkitdirectory` and HTML5 drag-and-drop. Automatically ignores build artifacts (`node_modules`, `.git`, `bin`, `obj`, `.next`, `dist`).
- **Stack Detector (`IStackDetector`)**: Deterministically identifies Next.js, React, ASP.NET MVC, Blazor, Flutter, Android, iOS/SwiftUI, with confidence score, evidence list, and manual UI override.
- **Pluggable Extractors (`IScreenExtractor`)**: Modular extractors for React/Next routes, Razor views/controllers, Flutter widgets (`Scaffold`, `AppBar`, `BottomNavigationBar`), and Generic PRDs.
- **Secret Redaction & Preview**: Redacts API keys, passwords, and connection strings. Users can click **Inspect Sent Files** to audit exact content and token estimates before AI submission.
- **Analysis Review Modal**: Allows product architects to review and modify detected roles, features, user flows, and screen inventories before generating wireframes.

### Phase 2: Spec Generation, Validation & Konva Canvas
- **Zod Schema Validation**: Every generated screen spec is validated against the strict WireGen JSON schema.
- **2-Retry Feedback Loop**: If an LLM response fails schema validation, the detailed Zod error path and message is fed back to the model for up to 2 corrective retries.
- **Deterministic Post-Processor**: Snaps coordinates and dimensions to an 8px grid, clamps elements within device viewports, enforces minimum touch targets (buttons min 80x32, inputs min 120x36), and eliminates element collisions.
- **Konva Canvas Studio**: Grayscale low-fidelity style, X-boxes for image placeholders, smooth pan and zoom, device frame toggles, and click-through flow arrows.
- **Real-Time Streaming**: Server-Sent Events (SSE) stream generation status (`queued` ➔ `generating` ➔ `validated` / `failed`) with live visual progress.
- **Single-Screen Regeneration**: Allows targeted re-prompting (e.g. *"Add a filter bar and make it denser"*).

### Phase 3 & 4: Editing, Exports & Persistence
- **Component Palette**: Easily add Buttons, Input fields, Data Tables, Cards, Image X-boxes, Analytics Charts, Modals, and Navigation bars.
- **Keyboard Shortcuts**: `Delete`/`Backspace` to remove, `Ctrl+D` to duplicate, `Ctrl+Z`/`Ctrl+Y` for undo/redo, Arrow keys to nudge by 8px.
- **Multi-Format Export**:
  - Wireframe JSON Spec (`.json`)
  - Markdown Screen Inventory (`.md`)
  - Standalone Vector SVG (`.svg`)
  - Print / Save as PDF
- **IndexedDB Persistence**: Automatically saves all screen changes, coordinates, and project settings locally so edits survive page reloads.

---

## 🤖 System Prompts

### 1. Analysis System Prompt (`src/lib/ai/prompts/analysisPrompt.ts`)
```text
You are an expert UX Architect and Product Systems Analyst.
Analyze the provided workspace content (PRD documents, code files, views, routes, models) and output a comprehensive architectural model of the product.

You must return a valid JSON object matching this exact schema:
{
  "appType": "string (e.g. Dashboard, E-Commerce, Project Management, Mobile App)",
  "roles": ["string (e.g. Admin, Project Manager, Member)"],
  "features": ["string (feature descriptions)"],
  "entities": ["string (domain models e.g. Task, User, Workspace, Project)"],
  "sitemap": [{ "title": "string", "route": "string", "children": ["optional sub-routes"] }],
  "flows": [{ "name": "string", "steps": ["Step 1", "Step 2", "Step 3"] }],
  "screens": [{
    "id": "screen_1",
    "name": "string",
    "purpose": "string",
    "role": "string",
    "components": ["header", "navbar", "table", "button", "input"],
    "navigatesTo": ["screen_2"]
  }]
}
```

### 2. Wireframe Generation System Prompt (`src/lib/ai/prompts/wireframePrompt.ts`)
```text
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
```

---

## 🧩 How to Extend

### 1. Adding a New Screen Extractor
Implement the `IScreenExtractor` interface and register it with `defaultExtractorRegistry`:
```typescript
import { IScreenExtractor } from '@/lib/stack/types';
import { defaultExtractorRegistry } from '@/lib/stack/extractorRegistry';

export class SvelteKitExtractor implements IScreenExtractor {
  name = 'SvelteKit Route Extractor';

  canHandle(stackInfo: StackInfo): boolean {
    return stackInfo.primaryStack.toLowerCase().includes('svelte');
  }

  extract(files: WorkspaceFile[]): ScreenHint[] {
    // Inspect +page.svelte files and return ScreenHint objects
    return [];
  }
}

// Register via DI
defaultExtractorRegistry.register(new SvelteKitExtractor());
```

### 2. Adding a New Element Type
1. Add the type string to `ElementType` in `src/types/wireframe.ts` and `ElementTypeEnum` in `src/lib/validation/wireframeSchema.ts`.
2. Define default dimensions in `getMinimumDimensions()` in `src/lib/layout/postProcessor.ts`.
3. Add the visual shape to `renderElement()` in `src/components/canvas/KonvaCanvasStage.tsx`.
4. Add the component to `src/components/right/ComponentPalette.tsx`.

### 3. Adding a New Export Format
Add the generator method to `ExportService` in `src/lib/export/exportService.ts` and attach the trigger button in `src/components/modals/ExportModal.tsx`.
