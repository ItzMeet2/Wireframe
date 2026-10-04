export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export type LayoutType = 'stack' | 'grid' | 'sidebar' | 'tabs';

export type ElementType =
  | 'header'
  | 'navbar'
  | 'sidebar'
  | 'button'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'table'
  | 'list'
  | 'card'
  | 'image'
  | 'chart'
  | 'modal'
  | 'tabs'
  | 'breadcrumb'
  | 'footer'
  | 'text'
  | 'icon';

export interface WireframeElement {
  id: string;
  type: ElementType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: WireframeElement[];
  navigatesTo?: string | null;
  notes?: string;
}

export type GenerationSource = 'ai' | 'heuristic' | 'manual';
export type ScreenStatus = 'queued' | 'generating' | 'validated' | 'failed' | 'ready';

export interface WireframeScreen {
  screenId: string;
  name: string;
  device: DeviceType;
  layout: LayoutType;
  elements: WireframeElement[];
  purpose?: string;
  primaryRole?: string;
  generationSource?: GenerationSource;
  status?: ScreenStatus;
  errorMessage?: string;
  retriesUsed?: number;
  version?: number;
  notes?: string;
}

export type PlatformType = 'web' | 'mobile' | 'desktop' | 'tablet';

export interface StackInfo {
  primaryStack: string;
  secondaryStacks: string[];
  platform: PlatformType;
  confidence: number;
  evidence: string[];
  isManualOverride?: boolean;
}

export interface ScreenHint {
  name: string;
  route?: string;
  purpose: string;
  role?: string;
  componentsHint: string[];
  sourceFile: string;
  extractorName: string;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  size: number;
  content: string;
  selected: boolean;
  isRedacted?: boolean;
  hash: string;
  fileType: string;
}

export interface AnalysisSummary {
  appType: string;
  roles: string[];
  features: string[];
  entities: string[];
  sitemap: { title: string; route?: string; children?: string[] }[];
  flows: { name: string; steps: string[] }[];
  screens: {
    id: string;
    name: string;
    purpose: string;
    role: string;
    components: string[];
    navigatesTo?: string[];
    source?: GenerationSource;
  }[];
  stackInfo: StackInfo;
}

import { DiagramMode, WorkflowSpec, InfographicSpec } from './diagrams';

export interface WireGenProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  diagramMode?: DiagramMode;
  files: WorkspaceFile[];
  stackInfo: StackInfo;
  analysisSummary: AnalysisSummary | null;
  screens: WireframeScreen[];
  activeScreenId: string | null;
  workflowSpec?: WorkflowSpec | null;
  infographicSpec?: InfographicSpec | null;
  history?: {
    past: WireframeScreen[][];
    future: WireframeScreen[][];
  };
}
