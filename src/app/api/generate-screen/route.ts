import { NextRequest, NextResponse } from 'next/server';
import { WireGenAiService, AnthropicProvider, OpenAIProvider } from '@/lib/ai/service';
import { getEffectiveAnthropicKey, getEffectiveOpenAiKey } from '../settings/route';
import { DeviceType, LayoutType } from '@/types/wireframe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      screensToGenerate, // array of screen definitions to batch generate with SSE
      singleScreen,       // or single screen regeneration
      inventory,
      device = 'desktop',
      layout = 'sidebar',
      instruction
    } = body;

    const anthropicKey = getEffectiveAnthropicKey();
    const openAiKey = getEffectiveOpenAiKey();

    let provider = null;
    if (anthropicKey) {
      provider = new AnthropicProvider(anthropicKey);
    } else if (openAiKey) {
      provider = new OpenAIProvider(openAiKey);
    }

    const aiService = new WireGenAiService(provider);

    // 1. Single screen generation (Direct JSON response)
    if (singleScreen) {
      const result = await aiService.generateScreen({
        screenId: singleScreen.id || singleScreen.screenId,
        name: singleScreen.name,
        purpose: singleScreen.purpose || '',
        role: singleScreen.role || 'User',
        device: (singleScreen.device || device) as DeviceType,
        layout: (singleScreen.layout || layout) as LayoutType,
        components: singleScreen.components || [],
        inventory: inventory || [],
        instruction
      });

      return NextResponse.json({
        success: true,
        screen: result.screen,
        retriesUsed: result.retriesUsed,
        source: result.source
      });
    }

    // 2. Multi-screen generation via Server-Sent Events (SSE)
    if (screensToGenerate && Array.isArray(screensToGenerate)) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (eventData: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`));
          };

          for (const s of screensToGenerate) {
            sendEvent({
              type: 'status',
              screenId: s.id,
              status: 'generating'
            });

            try {
              const res = await aiService.generateScreen({
                screenId: s.id,
                name: s.name,
                purpose: s.purpose || '',
                role: s.role || 'User',
                device: (s.device || device) as DeviceType,
                layout: (s.layout || layout) as LayoutType,
                components: s.components || [],
                inventory: inventory || screensToGenerate.map((x: any) => ({ id: x.id, name: x.name })),
                instruction
              });

              sendEvent({
                type: 'screen_ready',
                screenId: s.id,
                screen: res.screen,
                retriesUsed: res.retriesUsed,
                source: res.source
              });
            } catch (err: any) {
              sendEvent({
                type: 'error',
                screenId: s.id,
                error: err.message || 'Generation failed'
              });
            }
          }

          sendEvent({ type: 'complete' });
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      });
    }

    return NextResponse.json({ error: 'Missing screen parameters' }, { status: 400 });
  } catch (err: any) {
    console.error('Error generating screen:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
