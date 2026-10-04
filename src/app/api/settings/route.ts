import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Server-side in-memory session keys (never exposed or transmitted to client)
let serverCustomAnthropicKey = '';
let serverCustomOpenAiKey = '';

export function getEffectiveAnthropicKey(): string {
  return serverCustomAnthropicKey || process.env.ANTHROPIC_API_KEY || '';
}

export function getEffectiveOpenAiKey(): string {
  return serverCustomOpenAiKey || process.env.OPENAI_API_KEY || '';
}

export async function GET() {
  const hasAnthropic = Boolean(getEffectiveAnthropicKey());
  const hasOpenAi = Boolean(getEffectiveOpenAiKey());

  return NextResponse.json({
    hasAnthropicKey: hasAnthropic,
    hasOpenAiKey: hasOpenAi,
    activeProvider: hasAnthropic ? 'Anthropic Claude' : hasOpenAi ? 'OpenAI GPT-4o' : 'Heuristic Engine (Local)'
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.anthropicApiKey !== undefined) {
      serverCustomAnthropicKey = body.anthropicApiKey.trim();
    }
    if (body.openAiApiKey !== undefined) {
      serverCustomOpenAiKey = body.openAiApiKey.trim();
    }

    return NextResponse.json({
      success: true,
      hasAnthropicKey: Boolean(getEffectiveAnthropicKey()),
      hasOpenAiKey: Boolean(getEffectiveOpenAiKey()),
      activeProvider: Boolean(getEffectiveAnthropicKey())
        ? 'Anthropic Claude'
        : Boolean(getEffectiveOpenAiKey())
        ? 'OpenAI GPT-4o'
        : 'Heuristic Engine (Local)'
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
