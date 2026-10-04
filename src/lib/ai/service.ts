import {
  WireframeScreen,
  DeviceType,
  LayoutType,
  WireframeElement,
  AnalysisSummary,
  StackInfo,
  ScreenHint
} from '@/types/wireframe';
import { validateWireframeSpec } from '@/lib/validation/wireframeSchema';
import { postProcessScreenLayout, DEVICE_DIMENSIONS } from '@/lib/layout/postProcessor';
import { WIREFRAME_SYSTEM_PROMPT, buildWireframeUserPrompt } from './prompts/wireframePrompt';
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisUserPrompt } from './prompts/analysisPrompt';
import { WorkflowSpec, InfographicSpec } from '@/types/diagrams';
import { validateWorkflowSpec, validateInfographicSpec } from '@/lib/validation/diagramSchemas';
import { WORKFLOW_SYSTEM_PROMPT, buildWorkflowUserPrompt } from './prompts/workflowPrompt';
import { INFOGRAPHIC_SYSTEM_PROMPT, buildInfographicUserPrompt } from './prompts/infographicPrompt';
import { defaultHeuristicDiagramGenerator } from '@/lib/diagrams/heuristicGenerator';
import { applyDagreLayout } from '@/lib/diagrams/layoutEngine';

export interface IAiProvider {
  callModel(systemPrompt: string, userPrompt: string): Promise<string>;
}

export class AnthropicProvider implements IAiProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async callModel(systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  }
}

export class OpenAIProvider implements IAiProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async callModel(systemPrompt: string, userPrompt: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

/**
 * Intelligent deterministic heuristic generator that produces valid,
 * high-fidelity wireframe layouts matching the exact Zod schema when no LLM key is configured.
 */
export class HeuristicWireframeGenerator {
  generateScreen(params: {
    screenId: string;
    name: string;
    device: DeviceType;
    layout: LayoutType;
    purpose?: string;
    primaryRole?: string;
    components?: string[];
    navigatesToTarget?: string | null;
  }): WireframeScreen {
    const dims = DEVICE_DIMENSIONS[params.device] || DEVICE_DIMENSIONS.desktop;
    const isMobile = params.device === 'mobile';
    const components = params.components || ['header', 'card', 'button'];

    const elements: WireframeElement[] = [];
    let currentY = 0;

    // 1. Header / Navbar
    if (isMobile) {
      elements.push({
        id: 'header_main',
        type: 'header',
        label: params.name,
        x: 0,
        y: 0,
        width: dims.width,
        height: 56,
        children: []
      });
      currentY = 64;
    } else {
      elements.push({
        id: 'navbar_top',
        type: 'navbar',
        label: `WireGen App  |  ${params.name}`,
        x: 0,
        y: 0,
        width: dims.width,
        height: 64,
        children: []
      });
      currentY = 80;
    }

    // 2. Sidebar if desktop & layout is sidebar
    let contentLeft = 16;
    let contentWidth = dims.width - 32;

    if (!isMobile && params.layout === 'sidebar') {
      elements.push({
        id: 'sidebar_nav',
        type: 'sidebar',
        label: 'Navigation Menu\n• Dashboard\n• Tasks\n• Projects\n• Settings',
        x: 16,
        y: currentY,
        width: 200,
        height: dims.height - currentY - 24,
        children: []
      });
      contentLeft = 232;
      contentWidth = dims.width - contentLeft - 16;
    }

    // 3. Title / Breadcrumb
    elements.push({
      id: 'title_heading',
      type: 'text',
      label: `${params.name}`,
      x: contentLeft,
      y: currentY,
      width: Math.min(contentWidth, 320),
      height: 32,
      notes: params.purpose
    });
    currentY += 40;

    // 4. Action bar or Filter
    if (components.includes('button') || components.includes('input')) {
      elements.push({
        id: 'search_bar',
        type: 'input',
        label: 'Search or filter items...',
        x: contentLeft,
        y: currentY,
        width: isMobile ? contentWidth - 96 : 280,
        height: 36
      });

      elements.push({
        id: 'btn_primary_action',
        type: 'button',
        label: '+ New Action',
        x: isMobile ? contentLeft + contentWidth - 88 : contentLeft + 296,
        y: currentY,
        width: 88,
        height: 36,
        navigatesTo: params.navigatesToTarget || null
      });
      currentY += 48;
    }

    // 5. Main Content: Table, Cards, or Form
    if (components.includes('table')) {
      elements.push({
        id: 'table_main',
        type: 'table',
        label: 'Items Table\nColumns: ID | Title | Status | Assignee | Due Date',
        x: contentLeft,
        y: currentY,
        width: contentWidth,
        height: isMobile ? 300 : 280,
        navigatesTo: params.navigatesToTarget || null
      });
      currentY += isMobile ? 312 : 292;
    } else if (components.includes('chart')) {
      elements.push({
        id: 'chart_analytics',
        type: 'chart',
        label: 'Activity & Progress Chart',
        x: contentLeft,
        y: currentY,
        width: isMobile ? contentWidth : (contentWidth - 16) / 2,
        height: 200
      });

      if (!isMobile) {
        elements.push({
          id: 'card_stats',
          type: 'card',
          label: 'Summary Statistics\n• Total Tasks: 48\n• In Progress: 14\n• Completed: 34',
          x: contentLeft + (contentWidth - 16) / 2 + 16,
          y: currentY,
          width: (contentWidth - 16) / 2,
          height: 200
        });
      }
      currentY += 216;
    } else {
      // Default Card Container
      elements.push({
        id: 'card_content',
        type: 'card',
        label: `${params.name} Content Container\n${params.purpose || 'Main container section'}`,
        x: contentLeft,
        y: currentY,
        width: contentWidth,
        height: 240
      });
      currentY += 256;
    }

    // 6. Mobile bottom navigation bar
    if (isMobile) {
      elements.push({
        id: 'navbar_bottom',
        type: 'navbar',
        label: '🏠 Home   📋 Tasks   🔔 Alerts   👤 Profile',
        x: 0,
        y: dims.height - 56,
        width: dims.width,
        height: 56
      });
    }

    const rawScreen: WireframeScreen = {
      screenId: params.screenId,
      name: params.name,
      device: params.device,
      layout: params.layout,
      elements,
      purpose: params.purpose,
      primaryRole: params.primaryRole,
      generationSource: 'heuristic',
      status: 'ready'
    };

    return postProcessScreenLayout(rawScreen);
  }
}

export class WireGenAiService {
  private provider: IAiProvider | null = null;
  private heuristicGenerator = new HeuristicWireframeGenerator();

  constructor(provider?: IAiProvider | null) {
    this.provider = provider || null;
  }

  setProvider(provider: IAiProvider | null) {
    this.provider = provider;
  }

  async analyzeWorkspace(
    files: { path: string; content: string }[],
    hints: ScreenHint[],
    stackInfo: StackInfo
  ): Promise<AnalysisSummary> {
    if (!this.provider) {
      return this.heuristicAnalysis(files, hints, stackInfo);
    }

    const userPrompt = buildAnalysisUserPrompt(files, hints, stackInfo);

    try {
      const responseText = await this.provider.callModel(ANALYSIS_SYSTEM_PROMPT, userPrompt);
      const cleanedJson = this.extractJson(responseText);
      const parsed = JSON.parse(cleanedJson);

      return {
        appType: parsed.appType || 'Web Application',
        roles: parsed.roles || ['User', 'Admin'],
        features: parsed.features || ['Task Management', 'Dashboard'],
        entities: parsed.entities || ['User', 'Item'],
        sitemap: parsed.sitemap || [],
        flows: parsed.flows || [],
        screens: (parsed.screens || []).map((s: any) => ({
          ...s,
          source: 'ai' as const
        })),
        stackInfo
      };
    } catch {
      // Graceful fallback to heuristic analysis if AI call fails
      return this.heuristicAnalysis(files, hints, stackInfo);
    }
  }

  async generateScreen(params: {
    screenId: string;
    name: string;
    purpose: string;
    role: string;
    device: DeviceType;
    layout: LayoutType;
    components: string[];
    inventory: { id: string; name: string }[];
    instruction?: string;
  }): Promise<{ screen: WireframeScreen; retriesUsed: number; source: 'ai' | 'heuristic' }> {
    // If no AI provider configured, use the heuristic engine
    if (!this.provider) {
      const nextTarget = params.inventory.find(i => i.id !== params.screenId)?.id || null;
      const screen = this.heuristicGenerator.generateScreen({
        ...params,
        navigatesToTarget: nextTarget
      });
      return { screen, retriesUsed: 0, source: 'heuristic' };
    }

    let validationError = '';
    let retriesUsed = 0;
    const maxRetries = 2;

    while (retriesUsed <= maxRetries) {
      const userPrompt = buildWireframeUserPrompt({
        ...params,
        validationError: validationError || undefined
      });

      try {
        const rawResponse = await this.provider.callModel(WIREFRAME_SYSTEM_PROMPT, userPrompt);
        const jsonString = this.extractJson(rawResponse);
        const validation = validateWireframeSpec(jsonString);

        if (validation.success && validation.data) {
          const processed = postProcessScreenLayout({
            ...validation.data,
            screenId: params.screenId,
            name: params.name,
            device: params.device,
            purpose: params.purpose,
            primaryRole: params.role,
            generationSource: 'ai',
            status: 'ready',
            retriesUsed
          });

          return {
            screen: processed,
            retriesUsed,
            source: 'ai'
          };
        }

        // Validation failed; prepare feedback for retry
        validationError = (validation.errors || []).join('; ');
        retriesUsed++;
      } catch (err: any) {
        validationError = `API/Parsing Exception: ${err.message}`;
        retriesUsed++;
      }
    }

    // If retries exceeded, safely fallback to heuristic generator so user is NEVER crashed
    const fallbackScreen = this.heuristicGenerator.generateScreen({
      ...params,
      navigatesToTarget: params.inventory.find(i => i.id !== params.screenId)?.id || null
    });
    fallbackScreen.status = 'ready';
    fallbackScreen.generationSource = 'heuristic';
    fallbackScreen.retriesUsed = retriesUsed;
    fallbackScreen.errorMessage = `AI validation limit reached. Generated with heuristic fallback.`;

    return {
      screen: fallbackScreen,
      retriesUsed,
      source: 'heuristic'
    };
  }

  async generateWorkflowDiagram(
    brief: string,
    title: string = 'Automated Workflow Pipeline',
    files?: WorkspaceFile[]
  ): Promise<{ workflow: WorkflowSpec; retriesUsed: number; source: 'ai' | 'heuristic' }> {
    if (!this.provider) {
      return {
        workflow: defaultHeuristicDiagramGenerator.generateWorkflow(brief, title, files),
        retriesUsed: 0,
        source: 'heuristic'
      };
    }

    let validationError = '';
    let retriesUsed = 0;
    const maxRetries = 2;

    let enrichedBrief = brief;
    if (files && files.length > 0) {
      const fileSummary = files.slice(0, 30).map(f => f.path).join('\n');
      enrichedBrief = `${brief}\n\nRepository Architecture Context:\nAnalyzed Codebase Files:\n${fileSummary}`;
    }

    while (retriesUsed <= maxRetries) {
      const userPrompt = buildWorkflowUserPrompt(enrichedBrief, validationError || undefined);

      try {
        const rawResponse = await this.provider.callModel(WORKFLOW_SYSTEM_PROMPT, userPrompt);
        const jsonString = this.extractJson(rawResponse);
        const validation = validateWorkflowSpec(jsonString);

        if (validation.success && validation.data) {
          const positionedNodes = applyDagreLayout(
            validation.data.nodes,
            validation.data.edges,
            validation.data.subNodes
          );

          return {
            workflow: {
              ...validation.data,
              nodes: positionedNodes,
              generationSource: 'ai'
            },
            retriesUsed,
            source: 'ai'
          };
        }

        validationError = (validation.errors || []).join('; ');
        retriesUsed++;
      } catch (err: any) {
        validationError = `Workflow parsing error: ${err.message}`;
        retriesUsed++;
      }
    }

    // Fallback safely to heuristic
    const fallbackWf = defaultHeuristicDiagramGenerator.generateWorkflow(brief, title, files);
    return {
      workflow: fallbackWf,
      retriesUsed,
      source: 'heuristic'
    };
  }

  async generateInfographicDiagram(
    brief: string,
    title: string = 'Multi-Stage Process Infographic'
  ): Promise<{ infographic: InfographicSpec; retriesUsed: number; source: 'ai' | 'heuristic' }> {
    if (!this.provider) {
      return {
        infographic: defaultHeuristicDiagramGenerator.generateInfographic(brief, title),
        retriesUsed: 0,
        source: 'heuristic'
      };
    }

    let validationError = '';
    let retriesUsed = 0;
    const maxRetries = 2;

    while (retriesUsed <= maxRetries) {
      const userPrompt = buildInfographicUserPrompt(brief, validationError || undefined);

      try {
        const rawResponse = await this.provider.callModel(INFOGRAPHIC_SYSTEM_PROMPT, userPrompt);
        const jsonString = this.extractJson(rawResponse);
        const validation = validateInfographicSpec(jsonString);

        if (validation.success && validation.data) {
          return {
            infographic: {
              ...validation.data,
              generationSource: 'ai'
            },
            retriesUsed,
            source: 'ai'
          };
        }

        validationError = (validation.errors || []).join('; ');
        retriesUsed++;
      } catch (err: any) {
        validationError = `Infographic parsing error: ${err.message}`;
        retriesUsed++;
      }
    }

    // Fallback safely to heuristic
    const fallbackInfo = defaultHeuristicDiagramGenerator.generateInfographic(brief, title);
    return {
      infographic: fallbackInfo,
      retriesUsed,
      source: 'heuristic'
    };
  }

  private extractJson(text: string): string {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) return jsonMatch[1].trim();

    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.substring(firstBrace, lastBrace + 1);
    }
    return text.trim();
  }

  private heuristicAnalysis(
    files: { path: string; content: string }[],
    hints: ScreenHint[],
    stackInfo: StackInfo
  ): AnalysisSummary {
    const screens = hints.map((h, index) => {
      const nextHint = hints[(index + 1) % hints.length];
      return {
        id: `screen_${index + 1}`,
        name: h.name,
        purpose: h.purpose,
        role: h.role || 'User',
        components: h.componentsHint,
        navigatesTo: nextHint && nextHint.name !== h.name ? [`screen_${((index + 1) % hints.length) + 1}`] : [],
        source: 'heuristic' as const
      };
    });

    if (screens.length === 0) {
      screens.push(
        {
          id: 'screen_1',
          name: 'Dashboard Overview',
          purpose: 'Main overview with statistics, quick actions, and recent activity',
          role: 'User',
          components: ['navbar', 'chart', 'card', 'button'],
          navigatesTo: ['screen_2'],
          source: 'heuristic' as const
        },
        {
          id: 'screen_2',
          name: 'Task List',
          purpose: 'Filterable list of tasks with status tags and search',
          role: 'User',
          components: ['navbar', 'table', 'input', 'button'],
          navigatesTo: ['screen_3'],
          source: 'heuristic' as const
        },
        {
          id: 'screen_3',
          name: 'Task Details',
          purpose: 'Detailed view of an individual task with edit options',
          role: 'User',
          components: ['navbar', 'card', 'button', 'text'],
          navigatesTo: ['screen_4'],
          source: 'heuristic' as const
        },
        {
          id: 'screen_4',
          name: 'Create Task Modal',
          purpose: 'Form to input title, description, assignee, and priority',
          role: 'User',
          components: ['modal', 'input', 'textarea', 'select', 'button'],
          navigatesTo: ['screen_2'],
          source: 'heuristic' as const
        },
        {
          id: 'screen_5',
          name: 'Settings & Profile',
          purpose: 'User account preferences, notification settings, and team access',
          role: 'User',
          components: ['navbar', 'card', 'toggle', 'button'],
          navigatesTo: ['screen_1'],
          source: 'heuristic' as const
        }
      );
    }

    return {
      appType: stackInfo.platform === 'mobile' ? 'Mobile App' : 'Web Application',
      roles: ['User', 'Admin', 'Project Manager'],
      features: [
        'Task tracking & status management',
        'Real-time overview metrics and dashboard',
        'Filtering, search and item sorting',
        'Detailed view and inline modification',
        'User roles and permissions'
      ],
      entities: ['Task', 'Project', 'User', 'Comment', 'ActivityLog'],
      sitemap: screens.map((s) => ({ title: s.name, route: `/${s.id}` })),
      flows: [
        {
          name: 'Task Lifecycle Flow',
          steps: ['Dashboard Overview', 'Task List', 'Create Task Modal', 'Task Details']
        }
      ],
      screens,
      stackInfo
    };
  }
}
