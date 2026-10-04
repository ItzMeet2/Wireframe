import { describe, it, expect } from 'vitest';
import { StackDetector } from '../lib/stack/detector';
import { defaultExtractorRegistry } from '../lib/stack/extractorRegistry';
import { validateWireframeSpec } from '../lib/validation/wireframeSchema';
import { postProcessScreenLayout, snapToGrid, isOverlapping } from '../lib/layout/postProcessor';
import { redactSecrets } from '../lib/scanner/redact';
import { WorkspaceFile, WireframeScreen } from '../types/wireframe';

describe('StackDetector', () => {
  const detector = new StackDetector();

  it('correctly detects React / Next.js stack with high confidence', () => {
    const files: WorkspaceFile[] = [
      {
        path: 'package.json',
        name: 'package.json',
        size: 100,
        content: JSON.stringify({ dependencies: { next: '14.0.0', react: '18.0.0' } }),
        fileType: 'code',
        selected: true,
        hash: 'h1'
      },
      {
        path: 'app/dashboard/page.tsx',
        name: 'page.tsx',
        size: 200,
        content: 'export default function Dashboard() { return <div>Dashboard</div>; }',
        fileType: 'view',
        selected: true,
        hash: 'h2'
      }
    ];

    const result = detector.detect(files);
    expect(result.primaryStack).toBe('Next.js');
    expect(result.platform).toBe('web');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.evidence).toContain('package.json');
  });

  it('correctly detects ASP.NET MVC stack with high confidence', () => {
    const files: WorkspaceFile[] = [
      {
        path: 'MyApp.csproj',
        name: 'MyApp.csproj',
        size: 100,
        content: '<Project Sdk="Microsoft.NET.Sdk.Web"><ItemGroup></ItemGroup></Project>',
        fileType: 'code',
        selected: true,
        hash: 'h3'
      },
      {
        path: 'Views/Tasks/Index.cshtml',
        name: 'Index.cshtml',
        size: 200,
        content: '@model IEnumerable<TaskItem>\n<table>@foreach(var item in Model) {}</table>',
        fileType: 'view',
        selected: true,
        hash: 'h4'
      }
    ];

    const result = detector.detect(files);
    expect(result.primaryStack).toBe('ASP.NET MVC');
    expect(result.platform).toBe('web');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.evidence).toContain('MyApp.csproj');
  });

  it('correctly detects Flutter mobile stack with high confidence', () => {
    const files: WorkspaceFile[] = [
      {
        path: 'pubspec.yaml',
        name: 'pubspec.yaml',
        size: 100,
        content: 'name: my_mobile_app\nenvironment: ">=3.0.0"\ndependencies:\n  flutter:\n    sdk: flutter',
        fileType: 'code',
        selected: true,
        hash: 'h5'
      },
      {
        path: 'lib/screens/task_list_screen.dart',
        name: 'task_list_screen.dart',
        size: 300,
        content: 'class TaskListScreen extends StatelessWidget { Widget build(ctx) { return Scaffold(appBar: AppBar()); } }',
        fileType: 'view',
        selected: true,
        hash: 'h6'
      }
    ];

    const result = detector.detect(files);
    expect(result.primaryStack).toBe('Flutter');
    expect(result.platform).toBe('mobile');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.evidence).toContain('pubspec.yaml');
  });

  it('falls back to Docs-Only when no code or markers are found', () => {
    const files: WorkspaceFile[] = [
      {
        path: 'PRD.md',
        name: 'PRD.md',
        size: 500,
        content: '# Product Requirements\nUser Stories and wireframe notes',
        fileType: 'document',
        selected: true,
        hash: 'h7'
      }
    ];

    const result = detector.detect(files);
    expect(result.primaryStack).toBe('Docs-Only / Generic');
    expect(result.confidence).toBeLessThan(0.6);
  });
});

describe('Screen Extractors', () => {
  it('extracts React/Next route screens and components', () => {
    const files: WorkspaceFile[] = [
      {
        path: 'src/app/tasks/page.tsx',
        name: 'page.tsx',
        size: 100,
        content: 'export default function Tasks() { return <div><button>Add</button><table></table></div>; }',
        fileType: 'view',
        selected: true,
        hash: 'e1'
      }
    ];
    const stackInfo = {
      primaryStack: 'Next.js',
      secondaryStacks: ['React'],
      platform: 'web' as const,
      confidence: 0.9,
      evidence: ['package.json']
    };

    const hints = defaultExtractorRegistry.extractAll(stackInfo, files);
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0].name).toContain('Tasks');
    expect(hints[0].componentsHint).toContain('button');
    expect(hints[0].componentsHint).toContain('table');
  });

  it('extracts Flutter screens and maps AppBar/Scaffold', () => {
    const files: WorkspaceFile[] = [
      {
        path: 'lib/screens/dashboard_screen.dart',
        name: 'dashboard_screen.dart',
        size: 150,
        content: 'class DashboardScreen extends StatelessWidget { Widget build(ctx) { return Scaffold(appBar: AppBar(), bottomNavigationBar: BottomNavigationBar()); } }',
        fileType: 'view',
        selected: true,
        hash: 'e2'
      }
    ];
    const stackInfo = {
      primaryStack: 'Flutter',
      secondaryStacks: [],
      platform: 'mobile' as const,
      confidence: 0.95,
      evidence: ['pubspec.yaml']
    };

    const hints = defaultExtractorRegistry.extractAll(stackInfo, files);
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0].name).toContain('Dashboard');
    expect(hints[0].componentsHint).toContain('header');
    expect(hints[0].componentsHint).toContain('navbar');
  });
});

describe('Zod Wireframe Spec Validation', () => {
  it('validates a correct wireframe spec JSON', () => {
    const validSpec = {
      screenId: 'screen_1',
      name: 'Dashboard Overview',
      device: 'desktop',
      layout: 'sidebar',
      elements: [
        {
          id: 'elem_1',
          type: 'button',
          label: 'Create Task',
          x: 40,
          y: 60,
          width: 120,
          height: 40,
          children: [],
          navigatesTo: 'screen_2',
          notes: ''
        }
      ]
    };

    const result = validateWireframeSpec(validSpec);
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Dashboard Overview');
  });

  it('rejects specs with missing required fields or invalid element types', () => {
    const invalidSpec = {
      screenId: 'screen_1',
      // missing name
      device: 'smartwatch', // invalid device
      layout: 'unknown-layout',
      elements: [
        {
          id: 'elem_1',
          type: 'hyperlink-xyz', // invalid element type
          x: 0,
          y: 0,
          width: 0, // too small
          height: 0
        }
      ]
    };

    const result = validateWireframeSpec(invalidSpec);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe('Deterministic Layout Post-Processor', () => {
  it('snaps coordinates and dimensions to 8px grid', () => {
    expect(snapToGrid(11)).toBe(8);
    expect(snapToGrid(13)).toBe(16);
    expect(snapToGrid(39)).toBe(40);
  });

  it('enforces minimum dimensions and resolves overlaps', () => {
    const inputScreen: WireframeScreen = {
      screenId: 's1',
      name: 'Test Screen',
      device: 'desktop',
      layout: 'stack',
      elements: [
        {
          id: 'btn1',
          type: 'button',
          label: 'Button 1',
          x: 23, // not snapped
          y: 47, // not snapped
          width: 20, // below min button width (80)
          height: 10 // below min button height (32)
        },
        {
          id: 'btn2',
          type: 'button',
          label: 'Button 2',
          x: 23, // completely overlaps btn1
          y: 47,
          width: 100,
          height: 40
        }
      ]
    };

    const processed = postProcessScreenLayout(inputScreen);
    const [b1, b2] = processed.elements;

    // Checks grid snapping (multiple of 8)
    expect(b1.x % 8).toBe(0);
    expect(b1.y % 8).toBe(0);
    expect(b1.width % 8).toBe(0);
    expect(b1.height % 8).toBe(0);

    // Checks minimum dimension enforcement
    expect(b1.width).toBeGreaterThanOrEqual(80);
    expect(b1.height).toBeGreaterThanOrEqual(32);

    // Checks collision resolution: b2 must be moved below b1
    expect(isOverlapping(b1, b2)).toBe(false);
    expect(b2.y).toBeGreaterThanOrEqual(b1.y + b1.height);
  });
});

describe('End-to-End Pipeline & Resilience', () => {
  it('processes sample Task Manager workspace and produces 5+ non-overlapping screens', async () => {
    const { TASK_MANAGER_WORKSPACE } = await import('../sample/taskManagerWorkspace');
    const { WireGenAiService } = await import('../lib/ai/service');

    const detector = new StackDetector();
    const stackInfo = detector.detect(TASK_MANAGER_WORKSPACE);

    expect(stackInfo.primaryStack).toBe('Next.js');
    expect(stackInfo.platform).toBe('web');

    const hints = defaultExtractorRegistry.extractAll(stackInfo, TASK_MANAGER_WORKSPACE);
    expect(hints.length).toBeGreaterThanOrEqual(1);

    const aiService = new WireGenAiService(null); // Heuristic mode for local deterministic execution
    const summary = await aiService.analyzeWorkspace(
      TASK_MANAGER_WORKSPACE.map(f => ({ path: f.path, content: f.content })),
      hints,
      stackInfo
    );

    expect(summary.screens.length).toBeGreaterThanOrEqual(5);

    // Generate wireframe for each screen and verify no overlaps
    for (const screenDef of summary.screens) {
      const generated = await aiService.generateScreen({
        screenId: screenDef.id,
        name: screenDef.name,
        purpose: screenDef.purpose,
        role: screenDef.role,
        device: 'desktop',
        layout: 'sidebar',
        components: screenDef.components,
        inventory: summary.screens.map(s => ({ id: s.id, name: s.name }))
      });

      expect(generated.screen).toBeDefined();
      expect(generated.screen.elements.length).toBeGreaterThan(0);
      expect(generated.screen.status).toBe('ready');

      // Verify no sibling element overlaps
      const elements = generated.screen.elements;
      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          if (elements[i].type !== 'modal' && elements[j].type !== 'modal') {
            const overlap = isOverlapping(elements[i], elements[j]);
            expect(overlap).toBe(false);
          }
        }
      }
    }
  }, 20000);

  it('safely recovers when AI returns completely invalid JSON (never crashes)', async () => {
    const { WireGenAiService } = await import('../lib/ai/service');

    // Mock an AI provider that returns malformed non-JSON
    const brokenAiProvider = {
      callModel: async () => 'Sorry, I am unable to generate JSON right now.'
    };

    const aiService = new WireGenAiService(brokenAiProvider);
    const result = await aiService.generateScreen({
      screenId: 'screen_fail_test',
      name: 'Resilience Test Screen',
      purpose: 'Testing resilience against broken LLM responses',
      role: 'User',
      device: 'desktop',
      layout: 'stack',
      components: ['button', 'card'],
      inventory: []
    });

    // App must not throw and must fallback safely to heuristic generator
    expect(result.screen).toBeDefined();
    expect(result.source).toBe('heuristic');
    expect(result.retriesUsed).toBeGreaterThanOrEqual(1);
    expect(result.screen.elements.length).toBeGreaterThan(0);
  });
});

describe('Secret Redaction', () => {
  it('redacts sensitive API keys and connection strings', () => {
    const sampleEnv = `
      OPENAI_KEY=sk-abc123456789012345678901234567890
      ANTHROPIC_KEY=sk-ant-api03-abcdef12345678901234567890
      DB_URI=postgres://admin:superSecret123@database.cluster.aws.com:5432/production
    `;

    const result = redactSecrets(sampleEnv);
    expect(result.hasRedactions).toBe(true);
    expect(result.redactedCount).toBeGreaterThanOrEqual(3);
    expect(result.redactedText).not.toContain('sk-abc');
    expect(result.redactedText).not.toContain('superSecret123');
    expect(result.redactedText).toContain('[REDACTED_SECRET]');
  });
});

describe('Workflow Schema Validator', () => {
  it('validates a complete, correctly connected workflow graph', async () => {
    const { validateWorkflowSpec } = await import('../lib/validation/diagramSchemas');
    const validWorkflow = {
      id: 'wf_test',
      name: 'Valid Workflow',
      nodes: [
        {
          id: 'n_trig',
          type: 'trigger',
          label: 'Webhook Trigger',
          service: 'http',
          description: 'Inbound webhook',
          config: {},
          position: { x: 0, y: 0 }
        },
        {
          id: 'n_action',
          type: 'action',
          label: 'Send Slack',
          service: 'slack',
          description: 'Post alert',
          config: {},
          position: { x: 200, y: 0 }
        }
      ],
      edges: [
        {
          id: 'e1',
          from: 'n_trig',
          to: 'n_action',
          fromPort: 'default'
        }
      ]
    };

    const res = validateWorkflowSpec(validWorkflow);
    expect(res.success).toBe(true);
    expect(res.data?.nodes.length).toBe(2);
  });

  it('rejects workflows with no trigger node', async () => {
    const { validateWorkflowSpec } = await import('../lib/validation/diagramSchemas');
    const noTrigger = {
      id: 'wf_no_trig',
      name: 'No Trigger',
      nodes: [
        {
          id: 'n1',
          type: 'action',
          label: 'Action 1',
          service: 'gmail',
          description: '',
          config: {},
          position: { x: 0, y: 0 }
        }
      ],
      edges: []
    };

    const res = validateWorkflowSpec(noTrigger);
    expect(res.success).toBe(false);
    expect(res.errors?.some(e => e.includes('trigger'))).toBe(true);
  });

  it('rejects workflows with orphan nodes and dangling edges', async () => {
    const { validateWorkflowSpec } = await import('../lib/validation/diagramSchemas');
    const badWorkflow = {
      id: 'wf_orphan',
      name: 'Orphan and Dangling',
      nodes: [
        {
          id: 'n_trig',
          type: 'trigger',
          label: 'Trigger',
          service: 'http',
          description: '',
          config: {},
          position: { x: 0, y: 0 }
        },
        {
          id: 'n_orphan',
          type: 'action',
          label: 'Isolated Node',
          service: 'slack',
          description: '',
          config: {},
          position: { x: 400, y: 400 }
        }
      ],
      edges: [
        {
          id: 'e_dangling',
          from: 'n_trig',
          to: 'non_existent_node_id',
          fromPort: 'default'
        }
      ]
    };

    const res = validateWorkflowSpec(badWorkflow);
    expect(res.success).toBe(false);
    expect(res.errors?.some(e => e.includes('Dangling edge'))).toBe(true);
    expect(res.errors?.some(e => e.includes('Orphan node'))).toBe(true);
  });

  it('rejects unmarked cycles in workflow graphs', async () => {
    const { validateWorkflowSpec } = await import('../lib/validation/diagramSchemas');
    const cycleWorkflow = {
      id: 'wf_cycle',
      name: 'Unmarked Cycle',
      nodes: [
        { id: 't1', type: 'trigger', label: 'Trigger', service: 'http', description: '', config: {}, position: { x: 0, y: 0 } },
        { id: 'a1', type: 'action', label: 'Step 1', service: 'gmail', description: '', config: {}, position: { x: 100, y: 0 } },
        { id: 'a2', type: 'action', label: 'Step 2', service: 'slack', description: '', config: {}, position: { x: 200, y: 0 } }
      ],
      edges: [
        { id: 'e1', from: 't1', to: 'a1', fromPort: 'default' },
        { id: 'e2', from: 'a1', to: 'a2', fromPort: 'default' },
        { id: 'e3', from: 'a2', to: 'a1', fromPort: 'default' }
      ]
    };

    const res = validateWorkflowSpec(cycleWorkflow);
    expect(res.success).toBe(false);
    expect(res.errors?.some(e => e.includes('cycle'))).toBe(true);
  });
});

describe('Workflow Auto-Layout (Dagre)', () => {
  it('arranges nodes left-to-right with zero overlaps', async () => {
    const { applyDagreLayout, areNodesOverlapping } = await import('../lib/diagrams/layoutEngine');
    const nodes = [
      { id: 'n1', type: 'trigger' as const, label: 'Trigger', service: 'http' as const, description: '', config: {}, position: { x: 0, y: 0 } },
      { id: 'n2', type: 'ai' as const, label: 'AI Agent', service: 'anthropic' as const, description: '', config: {}, position: { x: 0, y: 0 } },
      { id: 'n3', type: 'action' as const, label: 'Email', service: 'gmail' as const, description: '', config: {}, position: { x: 0, y: 0 } }
    ];
    const edges = [
      { id: 'e1', from: 'n1', to: 'n2', fromPort: 'default' as const },
      { id: 'e2', from: 'n2', to: 'n3', fromPort: 'default' as const }
    ];

    const positioned = applyDagreLayout(nodes, edges);

    // Left to right progression: n1.x < n2.x < n3.x
    expect(positioned[0].position.x).toBeLessThan(positioned[1].position.x);
    expect(positioned[1].position.x).toBeLessThan(positioned[2].position.x);

    // Verify zero overlaps
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        expect(areNodesOverlapping(positioned[i], positioned[j])).toBe(false);
      }
    }
  });
});

describe('Lead-Gen Automation Acceptance Fixture', () => {
  const leadGenBrief = 'AI agent finds leads on social media, emails them, calls interested ones, books meetings, follows up';

  it('detects automation keywords and suggests workflow and infographic modes', async () => {
    const { detectDiagramMode } = await import('../lib/diagrams/modeDetector');
    const suggestion = detectDiagramMode([], leadGenBrief);

    expect(suggestion.suggestedModes).toContain('workflow');
    expect(suggestion.suggestedModes).toContain('infographic');
    expect(suggestion.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('generates a 4-stage process infographic from the one-paragraph brief', async () => {
    const { defaultHeuristicDiagramGenerator } = await import('../lib/diagrams/heuristicGenerator');
    const infographic = defaultHeuristicDiagramGenerator.generateInfographic(leadGenBrief, 'Lead-Gen Outreach');

    expect(infographic.stages.length).toBe(4);
    expect(infographic.stages[0].title).toContain('Discovery');
    expect(infographic.stages[1].title).toContain('Email');
    expect(infographic.stages[2].title).toContain('Voice');
    expect(infographic.stages[3].title).toContain('Booking');

    // Each stage has outcomes and tool icons
    for (const stage of infographic.stages) {
      expect(stage.icons.length).toBeGreaterThan(0);
      expect(stage.outcomes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('generates a connected workflow graph with trigger, AI node, condition branches, and output nodes', async () => {
    const { defaultHeuristicDiagramGenerator } = await import('../lib/diagrams/heuristicGenerator');
    const { validateWorkflowSpec } = await import('../lib/validation/diagramSchemas');
    const workflow = defaultHeuristicDiagramGenerator.generateWorkflow(leadGenBrief, 'Lead-Gen Pipeline');

    // 1. Validation pass
    const validation = validateWorkflowSpec(workflow);
    expect(validation.success).toBe(true);

    // 2. Trigger node
    const trigger = workflow.nodes.find(n => n.type === 'trigger');
    expect(trigger).toBeDefined();

    // 3. AI node with sub-nodes (model, memory, tool)
    const aiNode = workflow.nodes.find(n => n.type === 'ai');
    expect(aiNode).toBeDefined();
    const subNodes = workflow.subNodes?.filter(s => s.parentId === aiNode!.id);
    expect(subNodes && subNodes.length).toBeGreaterThanOrEqual(2);

    // 4. Condition node with true and false branches
    const conditionNode = workflow.nodes.find(n => n.type === 'condition');
    expect(conditionNode).toBeDefined();
    const trueEdge = workflow.edges.find(e => e.from === conditionNode!.id && e.fromPort === 'true');
    const falseEdge = workflow.edges.find(e => e.from === conditionNode!.id && e.fromPort === 'false');
    expect(trueEdge).toBeDefined();
    expect(falseEdge).toBeDefined();

    // 5. Output node
    const outputNode = workflow.nodes.find((n) => n.type === 'output');
    expect(outputNode).toBeDefined();
  });
});

describe('GitDiagram & Local Path Scanning Features', () => {
  it('correctly parses various GitHub URL formats and subfolders', async () => {
    const { parseGitHubUrl } = await import('../app/api/git/scan/route');

    // Standard repo URL
    const res1 = parseGitHubUrl('https://github.com/facebook/react');
    expect(res1).toEqual({ owner: 'facebook', repo: 'react' });

    // Shorthand owner/repo
    const res2 = parseGitHubUrl('vercel/next.js');
    expect(res2).toEqual({ owner: 'vercel', repo: 'next.js' });

    // Subfolder in branch
    const res3 = parseGitHubUrl(
      'https://github.com/facebook/react/tree/main/packages/react-dom'
    );
    expect(res3).toEqual({
      owner: 'facebook',
      repo: 'react',
      branch: 'main',
      subpath: 'packages/react-dom'
    });

    // Clean .git and trailing slashes
    const res4 = parseGitHubUrl('https://github.com/shadcn-ui/ui.git/');
    expect(res4).toEqual({ owner: 'shadcn-ui', repo: 'ui' });

    // Invalid URL
    const res5 = parseGitHubUrl('not-a-valid-git-url');
    expect(res5).toBeNull();
  });

  it('generates a comprehensive repository architecture diagram (GitDiagram style) from workspace files', async () => {
    const { defaultHeuristicDiagramGenerator } = await import(
      '../lib/diagrams/heuristicGenerator'
    );
    const { validateWorkflowSpec } = await import('../lib/validation/diagramSchemas');

    const sampleRepoFiles: WorkspaceFile[] = [
      {
        path: 'package.json',
        name: 'package.json',
        size: 500,
        content: JSON.stringify({ name: 'my-saas-app', dependencies: { next: '14.0', openai: '^4.0' } }),
        fileType: 'code',
        selected: true,
        hash: 'h1'
      },
      {
        path: 'src/app/page.tsx',
        name: 'page.tsx',
        size: 800,
        content: 'export default function Page() { return <div>Home</div>; }',
        fileType: 'view',
        selected: true,
        hash: 'h2'
      },
      {
        path: 'src/app/api/analyze/route.ts',
        name: 'route.ts',
        size: 1200,
        content: 'export async function POST(req) { return Response.json({}); }',
        fileType: 'code',
        selected: true,
        hash: 'h3'
      },
      {
        path: 'src/lib/services/aiPipeline.ts',
        name: 'aiPipeline.ts',
        size: 1500,
        content: 'export class AiPipeline { run() {} }',
        fileType: 'code',
        selected: true,
        hash: 'h4'
      },
      {
        path: 'prisma/schema.prisma',
        name: 'schema.prisma',
        size: 600,
        content: 'model User { id String @id }',
        fileType: 'code',
        selected: true,
        hash: 'h5'
      }
    ];

    const workflow = defaultHeuristicDiagramGenerator.generateWorkflow(
      '',
      'My SaaS App',
      sampleRepoFiles
    );

    // Verify valid workflow schema
    const validation = validateWorkflowSpec(workflow);
    expect(validation.success).toBe(true);

    // Verify client/UI node exists
    const clientNode = workflow.nodes.find((n) => n.id === 'node_repo_client');
    expect(clientNode).toBeDefined();

    // Verify API gateway node exists
    const apiNode = workflow.nodes.find((n) => n.id === 'node_repo_api');
    expect(apiNode).toBeDefined();

    // Verify Core services node exists
    const servicesNode = workflow.nodes.find((n) => n.id === 'node_repo_services');
    expect(servicesNode).toBeDefined();

    // Verify Database node exists
    const dbNode = workflow.nodes.find((n) => n.id === 'node_repo_db');
    expect(dbNode).toBeDefined();

    // Verify edges connect client to API to services
    const clientToApi = workflow.edges.find(
      (e) => e.from === 'node_repo_client' && e.to === 'node_repo_api'
    );
    expect(clientToApi).toBeDefined();

    const apiToServices = workflow.edges.find(
      (e) => e.from === 'node_repo_api' && e.to === 'node_repo_services'
    );
    expect(apiToServices).toBeDefined();
  });

  it('scans a real local folder path, excludes node_modules and .git, and loads files', async () => {
    const { POST } = await import('../app/api/scan-local-path/route');
    const { NextRequest } = await import('next/server');

    const req = new NextRequest('http://localhost/api/scan-local-path', {
      method: 'POST',
      body: JSON.stringify({ path: '.' })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.files.length).toBeGreaterThan(5);
    expect(data.projectName).toBeDefined();

    // Verify none of the files are inside node_modules or .git
    const hasIgnored = data.files.some(
      (f: any) => f.path.includes('node_modules') || f.path.includes('.git') || f.path.includes('.next')
    );
    expect(hasIgnored).toBe(false);
  });
});



