import { WorkspaceFile } from '@/types/wireframe';
import { ModeSuggestion, DiagramMode } from '@/types/diagrams';

const WORKFLOW_KEYWORDS = [
  'automation',
  'workflow',
  'pipeline',
  'agent',
  'ai agent',
  'trigger',
  'webhook',
  'integration',
  'zapier',
  'n8n',
  'make.com',
  'lead',
  'leads',
  'outreach',
  'prospect',
  'scrape',
  'cold email',
  'follow up',
  'follow-up',
  'book meeting',
  'booking',
  'crm',
  'social media'
];

export function detectDiagramMode(files: WorkspaceFile[], briefText?: string): ModeSuggestion {
  const combinedText = [
    briefText || '',
    ...files.map((f) => `${f.name} ${f.content || ''}`)
  ].join(' ').toLowerCase();

  const matchedKeywords: string[] = [];
  let score = 0;

  for (const kw of WORKFLOW_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi');
    const matches = combinedText.match(regex);
    if (matches && matches.length > 0) {
      matchedKeywords.push(kw);
      score += Math.min(matches.length, 3);
    }
  }

  // If score indicates strong automation/agent/pipeline intent
  if (score >= 3 || matchedKeywords.length >= 2) {
    const confidence = Math.min(0.98, 0.65 + matchedKeywords.length * 0.06);
    return {
      suggestedModes: ['workflow', 'infographic', 'wireframe'],
      confidence: Number(confidence.toFixed(2)),
      reason: `Detected automation & agent workflow concepts (${matchedKeywords.slice(0, 5).join(', ')}). Suggested Workflow graph and Infographic modes.`,
      keywordsFound: matchedKeywords
    };
  }

  return {
    suggestedModes: ['wireframe'],
    confidence: 0.85,
    reason: 'Detected interactive application UI screens & components.',
    keywordsFound: []
  };
}
