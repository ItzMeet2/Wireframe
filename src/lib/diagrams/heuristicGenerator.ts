import {
  WorkflowSpec,
  WorkflowNode,
  WorkflowEdge,
  WorkflowSubNode,
  InfographicSpec,
  InfographicStage
} from '@/types/diagrams';
import { WorkspaceFile } from '@/types/wireframe';
import { applyDagreLayout } from './layoutEngine';

export class HeuristicDiagramGenerator {
  generateWorkflow(
    brief: string = '',
    title: string = 'Automated Pipeline',
    files?: WorkspaceFile[]
  ): WorkflowSpec {
    // If workspace files are present, generate a repository architecture diagram (like GitDiagram)
    if (files && files.length > 0 && !brief.toLowerCase().includes('lead-gen')) {
      return this.generateRepoArchitectureWorkflow(files, title, brief);
    }

    const briefLower = brief.toLowerCase();

    // Default lead-gen / outreach nodes matching acceptance criteria
    const nodes: WorkflowNode[] = [
      {
        id: 'node_trigger',
        type: 'trigger',
        label: 'Social Lead Ingestion',
        service: briefLower.includes('linkedin') ? 'linkedin' : 'instagram',
        description: 'Monitors social mentions, keywords, and hashtag interactions',
        config: { pollInterval: '15m' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'node_ai_agent',
        type: 'ai',
        label: 'AI Lead Researcher',
        service: 'anthropic',
        description: 'Extracts company size, tech stack, and buying intent',
        config: { model: 'claude-3-5-sonnet', temperature: 0.2 },
        position: { x: 0, y: 0 }
      },
      {
        id: 'node_condition',
        type: 'condition',
        label: 'High Buying Intent?',
        service: 'custom',
        description: 'Checks if intent score >= 75 and verified contact exists',
        config: { threshold: 75 },
        position: { x: 0, y: 0 }
      },
      {
        id: 'node_email',
        type: 'action',
        label: 'Send AI Outreach Email',
        service: 'gmail',
        description: 'Dispatches hyper-personalized initial pitch',
        config: { template: 'b2b-lead-v1' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'node_call',
        type: 'action',
        label: 'AI Voice Follow-up Call',
        service: 'whatsapp',
        description: 'Initiates autonomous phone follow-up for clicked links',
        config: { voiceModel: 'natural-conversational' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'node_calendar',
        type: 'action',
        label: 'Book Discovery Meeting',
        service: 'calendar',
        description: 'Locks available calendar slot with round-robin rep',
        config: { duration: 30 },
        position: { x: 0, y: 0 }
      },
      {
        id: 'node_nurture',
        type: 'transform',
        label: 'Log to Nurture Sheet',
        service: 'sheets',
        description: 'Appends cold leads to 30-day re-engagement drip',
        config: { sheetName: 'Unqualified Leads' },
        position: { x: 0, y: 0 }
      },
      {
        id: 'node_output',
        type: 'output',
        label: 'CRM Sync & Slack Alert',
        service: 'slack',
        description: 'Notifies sales team in #leads channel and updates CRM deal',
        config: { channel: '#sales-leads' },
        position: { x: 0, y: 0 }
      }
    ];

    const edges: WorkflowEdge[] = [
      {
        id: 'e_trig_ai',
        from: 'node_trigger',
        to: 'node_ai_agent',
        fromPort: 'default'
      },
      {
        id: 'e_ai_cond',
        from: 'node_ai_agent',
        to: 'node_condition',
        fromPort: 'default'
      },
      {
        id: 'e_cond_true',
        from: 'node_condition',
        to: 'node_email',
        fromPort: 'true',
        label: 'Yes (Intent >= 75)'
      },
      {
        id: 'e_email_call',
        from: 'node_email',
        to: 'node_call',
        fromPort: 'default',
        label: 'Interested / Clicked'
      },
      {
        id: 'e_call_cal',
        from: 'node_call',
        to: 'node_calendar',
        fromPort: 'default',
        label: 'Agreed to Demo'
      },
      {
        id: 'e_cal_out',
        from: 'node_calendar',
        to: 'node_output',
        fromPort: 'default'
      },
      {
        id: 'e_cond_false',
        from: 'node_condition',
        to: 'node_nurture',
        fromPort: 'false',
        label: 'No (Nurture)'
      },
      {
        id: 'e_nurt_out',
        from: 'node_nurture',
        to: 'node_output',
        fromPort: 'default'
      }
    ];

    const subNodes: WorkflowSubNode[] = [
      { parentId: 'node_ai_agent', kind: 'model', label: 'Claude 3.5 Sonnet' },
      { parentId: 'node_ai_agent', kind: 'memory', label: 'CRM Vector Store' },
      { parentId: 'node_ai_agent', kind: 'tool', label: 'Social Profile Scraper' }
    ];

    // Compute left-to-right dagre layout
    const positionedNodes = applyDagreLayout(nodes, edges, subNodes);

    return {
      id: `wf_${Date.now()}`,
      name: title,
      nodes: positionedNodes,
      edges,
      subNodes,
      generationSource: 'heuristic'
    };
  }

  generateRepoArchitectureWorkflow(
    files: WorkspaceFile[],
    title: string = 'Repository Architecture',
    brief: string = ''
  ): WorkflowSpec {
    // 1. Identify modules & files
    const uiFiles = files.filter(
      (f) =>
        f.fileType === 'view' ||
        /\/(components|pages|views|templates|app)\//i.test(f.path) ||
        /\.(tsx|jsx|vue|svelte|html)$/i.test(f.path)
    );
    const apiFiles = files.filter(
      (f) =>
        /\/(api|routes|controllers|handlers)\//i.test(f.path) ||
        /(route|controller|handler)\.(ts|js|py|go|cs)$/i.test(f.path)
    );
    const serviceFiles = files.filter(
      (f) =>
        /\/(services|lib|core|domain|utils|scanner)\//i.test(f.path) ||
        /(service|util|helper|pipeline)\.(ts|js|py|go|cs)$/i.test(f.path)
    );
    const aiFiles = files.filter(
      (f) =>
        /\/(ai|agents|llm|prompts|models)\//i.test(f.path) ||
        f.content.toLowerCase().includes('openai') ||
        f.content.toLowerCase().includes('anthropic') ||
        f.content.toLowerCase().includes('langchain')
    );
    const dbFiles = files.filter(
      (f) =>
        /\/(prisma|models|db|schema|entities|store)\//i.test(f.path) ||
        /\.(prisma|sql)$/i.test(f.path) ||
        f.content.toLowerCase().includes('database') ||
        f.content.toLowerCase().includes('indexeddb') ||
        f.content.toLowerCase().includes('postgres') ||
        f.content.toLowerCase().includes('sqlite') ||
        f.content.toLowerCase().includes('mongodb')
    );

    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];
    const subNodes: WorkflowSubNode[] = [];

    // Node 1: Client / UI Entrypoint
    const topUiSubnodes = uiFiles.slice(0, 3).map((f) => ({
      parentId: 'node_repo_client',
      kind: 'tool' as const,
      label: f.name.replace(/\.[^/.]+$/, '')
    }));
    subNodes.push(...topUiSubnodes);

    nodes.push({
      id: 'node_repo_client',
      type: 'trigger',
      label: 'Client UI & Web App',
      service: 'nextjs',
      description: `Frontend presentation layer with ${uiFiles.length || 1} component/view modules`,
      config: { filesCount: uiFiles.length },
      position: { x: 0, y: 0 }
    });

    // Node 2: API Gateway / Routers
    const topApiSubnodes = apiFiles.slice(0, 3).map((f) => ({
      parentId: 'node_repo_api',
      kind: 'tool' as const,
      label: f.path.split('/').slice(-2).join('/')
    }));
    subNodes.push(...topApiSubnodes);

    nodes.push({
      id: 'node_repo_api',
      type: 'router',
      label: 'API Gateway & Handlers',
      service: 'server',
      description: `REST/SSE route handlers dispatching incoming requests (${apiFiles.length || 1} routes)`,
      config: { endpointsCount: apiFiles.length },
      position: { x: 0, y: 0 }
    });
    edges.push({
      id: 'e_client_api',
      from: 'node_repo_client',
      to: 'node_repo_api',
      fromPort: 'default',
      label: 'HTTP / SSE'
    });

    // Node 3: Core Domain & Services
    const topServiceSubnodes = serviceFiles.slice(0, 3).map((f) => ({
      parentId: 'node_repo_services',
      kind: 'model' as const,
      label: f.name.replace(/\.[^/.]+$/, '')
    }));
    subNodes.push(...topServiceSubnodes);

    nodes.push({
      id: 'node_repo_services',
      type: 'action',
      label: 'Core Services & Pipelines',
      service: 'custom',
      description: `Domain orchestration, pipelines, validation and processors (${serviceFiles.length || 1} modules)`,
      config: { modulesCount: serviceFiles.length },
      position: { x: 0, y: 0 }
    });
    edges.push({
      id: 'e_api_services',
      from: 'node_repo_api',
      to: 'node_repo_services',
      fromPort: 'default',
      label: 'Dispatch Execution'
    });

    // Node 4: AI / LLM Engine (if AI detected or standard)
    if (
      aiFiles.length > 0 ||
      brief.toLowerCase().includes('ai') ||
      files.some((f) => f.content.includes('claude') || f.content.includes('openai'))
    ) {
      subNodes.push(
        { parentId: 'node_repo_ai', kind: 'model', label: 'Claude / GPT-4o' },
        { parentId: 'node_repo_ai', kind: 'tool', label: 'Structured Prompts' }
      );
      nodes.push({
        id: 'node_repo_ai',
        type: 'ai',
        label: 'AI & Inference Engine',
        service: 'anthropic',
        description: 'Multi-provider LLM integration with schema validation and fallback',
        config: { model: 'claude-3-5-sonnet' },
        position: { x: 0, y: 0 }
      });
      edges.push({
        id: 'e_services_ai',
        from: 'node_repo_services',
        to: 'node_repo_ai',
        fromPort: 'default',
        label: 'Inference & Prompts'
      });
      edges.push({
        id: 'e_ai_db',
        from: 'node_repo_ai',
        to: 'node_repo_db',
        fromPort: 'default',
        label: 'Save Output'
      });
    }

    // Node 5: Storage & Database
    const topDbSubnodes = dbFiles.slice(0, 3).map((f) => ({
      parentId: 'node_repo_db',
      kind: 'memory' as const,
      label: f.name.replace(/\.[^/.]+$/, '')
    }));
    if (topDbSubnodes.length === 0) {
      topDbSubnodes.push({ parentId: 'node_repo_db', kind: 'memory', label: 'IndexedDB / Cache' });
    }
    subNodes.push(...topDbSubnodes);

    nodes.push({
      id: 'node_repo_db',
      type: 'output',
      label: 'Database & State Storage',
      service: 'database',
      description: 'Persistent models, local cache, schema definitions and transactions',
      config: { storeType: 'hybrid' },
      position: { x: 0, y: 0 }
    });
    edges.push({
      id: 'e_services_db',
      from: 'node_repo_services',
      to: 'node_repo_db',
      fromPort: 'default',
      label: 'Persist & Query'
    });

    // Node 6: External Integrations / Git
    subNodes.push({ parentId: 'node_repo_ext', kind: 'tool', label: 'GitHub API / Webhooks' });
    nodes.push({
      id: 'node_repo_ext',
      type: 'output',
      label: 'External Services & Git Sync',
      service: 'github',
      description: 'Git repository sync, cloud webhooks and 3rd-party integrations',
      config: { sync: 'active' },
      position: { x: 0, y: 0 }
    });
    edges.push({
      id: 'e_services_ext',
      from: 'node_repo_services',
      to: 'node_repo_ext',
      fromPort: 'default',
      label: 'Sync & Notify'
    });

    const positionedNodes = applyDagreLayout(nodes, edges, subNodes);

    return {
      id: `repo_wf_${Date.now()}`,
      name: `${title} Architecture`,
      nodes: positionedNodes,
      edges,
      subNodes,
      generationSource: 'heuristic'
    };
  }

  generateInfographic(brief: string = '', title: string = 'Autonomous Lead-Gen Pipeline'): InfographicSpec {
    const stages: InfographicStage[] = [
      {
        number: 1,
        title: 'Lead Discovery & Social Scraping',
        description: 'Scans target platforms, detects high-intent buyer conversations, and enriches profiles with verified contact details.',
        icons: [
          { service: 'linkedin', label: 'LinkedIn Sales Nav' },
          { service: 'x', label: 'X Social Signals' },
          { service: 'instagram', label: 'Instagram DMs' }
        ],
        outcomes: [
          { icon: 'Target', title: 'Intent Scoring', text: 'Filter prospects by hiring, tech stack, and funding velocity' },
          { icon: 'CheckCircle', title: 'Verified Contacts', text: 'Direct business emails & phone numbers verified' },
          { icon: 'Database', title: 'Automated CRM Entry', text: 'Real-time sync to HubSpot / Salesforce' }
        ],
        mockup: 'table'
      },
      {
        number: 2,
        title: 'AI Personalization & Email Outreach',
        description: 'Generates context-rich email sequences based on prospect recent achievements, publications, and pain points.',
        icons: [
          { service: 'anthropic', label: 'Claude 3.5' },
          { service: 'gmail', label: 'Google Workspace' },
          { service: 'openai', label: 'GPT-4o Copywriter' }
        ],
        outcomes: [
          { icon: 'Mail', title: 'Dynamic Copywriting', text: '100% unique personalized angle per prospect' },
          { icon: 'TrendingUp', title: 'High Response Rates', text: 'Achieves 48% open rates and 18% reply rates' },
          { icon: 'ShieldCheck', title: 'Spam Guard Active', text: 'Domain warm-up and deliverability tracking' }
        ],
        mockup: 'email'
      },
      {
        number: 3,
        title: 'AI Voice Calling & Interest Verification',
        description: 'Instantly calls leads who engage with emails or express interest, addressing questions with conversational human-like cadence.',
        icons: [
          { service: 'whatsapp', label: 'AI Voice Dialer' },
          { service: 'phone', label: 'Smart IVR' }
        ],
        outcomes: [
          { icon: 'PhoneCall', title: 'Sub-Minute Followup', text: 'Calls warm leads within 120 seconds of reply' },
          { icon: 'Award', title: 'Objection Handling', text: 'Trained on high-converting sales playbooks' },
          { icon: 'Smile', title: 'Sentiment Analysis', text: 'Scores lead enthusiasm and purchase readiness' }
        ],
        mockup: 'chat'
      },
      {
        number: 4,
        title: 'Calendar Booking & CRM Handoff',
        description: 'Locks qualified appointments into executive calendars, dispatches reminders, and delivers briefings to account executives.',
        icons: [
          { service: 'calendar', label: 'Google Calendar' },
          { service: 'slack', label: 'Slack Alerts' },
          { service: 'sheets', label: 'Pipeline Analytics' }
        ],
        outcomes: [
          { icon: 'CalendarCheck', title: 'Zero Friction Booking', text: 'Direct calendar invite with Zoom / Meet links' },
          { icon: 'Bell', title: 'Instant Rep Notification', text: 'Detailed dossier posted to #sales-pipeline Slack' },
          { icon: 'Layers', title: 'Continuous Follow-Up', text: 'Automatic reminders reduce no-show rate to under 6%' }
        ],
        mockup: 'calendar'
      }
    ];

    return {
      title,
      subtitle: 'End-to-End Autonomous AI Agent Workflow from Discovery to Closed-Won',
      accentWord: 'Autonomous',
      stages,
      footer: 'Powered by WireGen Multi-Mode Diagram Studio • Stack-Agnostic AI Pipeline',
      theme: 'dark',
      generationSource: 'heuristic'
    };
  }
}

export const defaultHeuristicDiagramGenerator = new HeuristicDiagramGenerator();
