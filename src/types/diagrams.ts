export type DiagramMode = 'wireframe' | 'workflow' | 'infographic';

export type WorkflowNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'ai'
  | 'http'
  | 'transform'
  | 'router'
  | 'output';

export type ServiceType =
  | 'gmail'
  | 'slack'
  | 'sheets'
  | 'instagram'
  | 'linkedin'
  | 'x'
  | 'tiktok'
  | 'youtube'
  | 'calendar'
  | 'whatsapp'
  | 'http'
  | 'openai'
  | 'anthropic'
  | 'github'
  | 'database'
  | 'server'
  | 'react'
  | 'nextjs'
  | 'docker'
  | 'storage'
  | 'auth'
  | 'queue'
  | 'custom'
  | (string & {});

export type PortType = 'default' | 'true' | 'false' | 'tool' | 'memory';

export interface WorkflowSubNode {
  parentId: string;
  kind: 'model' | 'memory' | 'tool';
  label: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  service: ServiceType;
  description: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  fromPort: PortType;
  label?: string;
}

export interface WorkflowSpec {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  subNodes?: WorkflowSubNode[];
  generationSource?: 'ai' | 'heuristic';
}

// Infographic Spec
export type InfographicMockupType = 'email' | 'chat' | 'calendar' | 'table' | 'none';
export type InfographicTheme = 'dark' | 'light' | 'pastel';

export interface InfographicIconItem {
  service: string;
  label: string;
}

export interface InfographicOutcomeItem {
  icon: string;
  title: string;
  text: string;
}

export interface InfographicStage {
  number: number;
  title: string;
  description: string;
  icons: InfographicIconItem[];
  outcomes: InfographicOutcomeItem[];
  mockup: InfographicMockupType;
}

export interface InfographicSpec {
  title: string;
  subtitle: string;
  accentWord: string;
  stages: InfographicStage[];
  footer?: string;
  theme?: InfographicTheme;
  generationSource?: 'ai' | 'heuristic';
}

export interface ModeSuggestion {
  suggestedModes: DiagramMode[];
  confidence: number;
  reason: string;
  keywordsFound: string[];
}
