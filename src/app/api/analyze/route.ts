import { NextRequest, NextResponse } from 'next/server';
import { WireGenAiService, AnthropicProvider, OpenAIProvider } from '@/lib/ai/service';
import { redactSecrets } from '@/lib/scanner/redact';
import { getEffectiveAnthropicKey, getEffectiveOpenAiKey } from '../settings/route';
import { AnalysisSummary } from '@/types/wireframe';

export const runtime = 'nodejs';

// Server-side cache by workspace content hash
const analysisCache = new Map<string, AnalysisSummary>();

export async function POST(req: NextRequest) {
  try {
    const { files, screenHints, stackInfo, cacheKey } = await req.json();

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'files array is required' }, { status: 400 });
    }

    // 1. Check cache by content hash
    if (cacheKey && analysisCache.has(cacheKey)) {
      return NextResponse.json({
        summary: analysisCache.get(cacheKey),
        fromCache: true
      });
    }

    // 2. Server-side secret redaction safeguard
    const safeFiles = files.map((f: any) => ({
      path: f.path,
      content: redactSecrets(f.content || '').redactedText
    }));

    // 3. Configure AI provider
    const anthropicKey = getEffectiveAnthropicKey();
    const openAiKey = getEffectiveOpenAiKey();

    let provider = null;
    if (anthropicKey) {
      provider = new AnthropicProvider(anthropicKey);
    } else if (openAiKey) {
      provider = new OpenAIProvider(openAiKey);
    }

    const aiService = new WireGenAiService(provider);
    const summary = await aiService.analyzeWorkspace(safeFiles, screenHints || [], stackInfo);

    // Save in cache
    if (cacheKey) {
      analysisCache.set(cacheKey, summary);
    }

    return NextResponse.json({
      summary,
      fromCache: false
    });
  } catch (err: any) {
    console.error('Error during workspace analysis:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
