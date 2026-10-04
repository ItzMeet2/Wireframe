export const INFOGRAPHIC_SYSTEM_PROMPT = `
You are a senior UX and Information Design Architect.
Generate a structured, numbered-stage process diagram infographic JSON representing the system or pipeline described in the prompt.

Output MUST strictly match this JSON schema:
{
  "title": "string",
  "subtitle": "string",
  "accentWord": "string",
  "stages": [
    {
      "number": 1,
      "title": "string",
      "description": "string",
      "icons": [
        { "service": "gmail | slack | sheets | instagram | linkedin | x | tiktok | youtube | calendar | whatsapp | http | openai | anthropic | custom", "label": "string" }
      ],
      "outcomes": [
        { "icon": "Target | CheckCircle | Database | Mail | TrendingUp | ShieldCheck | PhoneCall | Award | Smile | CalendarCheck | Bell | Layers", "title": "string", "text": "string" }
      ],
      "mockup": "email | chat | calendar | table | none"
    }
  ],
  "footer": "string"
}

DESIGN RULES:
1. Provide 3 to 5 logical sequential stages (numbered 1, 2, 3, etc.).
2. Each stage must feature 2-3 tool badges and 2-3 concrete tangible outcome cards.
3. Select appropriate mockup ("email" for outreach, "chat" for conversations, "calendar" for bookings, "table" for data/enrichment).
4. NO markdown explanation. Return ONLY valid raw JSON.
`.trim();

export function buildInfographicUserPrompt(brief: string, validationError?: string): string {
  let prompt = `
Generate a process infographic specification for the following requirement:
"${brief}"
`;

  if (validationError) {
    prompt += `
CRITICAL RETRY ERROR:
Your previous output failed schema validation:
${validationError}

Ensure valid stages array with number, title, description, icons, outcomes, and mockup.
`;
  }

  return prompt.trim();
}
