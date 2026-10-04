import { NextRequest, NextResponse } from 'next/server';
import { WireGenAiService, AnthropicProvider, OpenAIProvider } from '@/lib/ai/service';
import { getEffectiveAnthropicKey, getEffectiveOpenAiKey } from '../settings/route';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, brief, title, files } = body;

    const anthropicKey = getEffectiveAnthropicKey();
    const openAiKey = getEffectiveOpenAiKey();

    let provider = null;
    if (anthropicKey) {
      provider = new AnthropicProvider(anthropicKey);
    } else if (openAiKey) {
      provider = new OpenAIProvider(openAiKey);
    }

    const aiService = new WireGenAiService(provider);

    if (mode === 'workflow') {
      const result = await aiService.generateWorkflowDiagram(
        brief || 'Repository Architecture & Service Graph',
        title || 'Architecture Workflow Graph',
        files
      );
      return NextResponse.json({
        success: true,
        workflow: result.workflow,
        retriesUsed: result.retriesUsed,
        source: result.source
      });
    }

    if (mode === 'infographic') {
      const result = await aiService.generateInfographicDiagram(
        brief || 'Autonomous multi-channel lead generation and engagement pipeline',
        title || 'Autonomous Lead-Gen Pipeline'
      );
      return NextResponse.json({
        success: true,
        infographic: result.infographic,
        retriesUsed: result.retriesUsed,
        source: result.source
      });
    }

    return NextResponse.json({ error: `Unsupported mode: ${mode}` }, { status: 400 });
  } catch (err: any) {
    console.error('Error in generate-diagram route:', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
