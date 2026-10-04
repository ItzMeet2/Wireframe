export const ANALYSIS_SYSTEM_PROMPT = `
You are an expert UX Architect and Product Systems Analyst.
Analyze the provided workspace content (PRD documents, code files, views, routes, models) and output a comprehensive architectural model of the product.

You must return a valid JSON object matching this exact schema:
{
  "appType": "string (e.g. Dashboard, E-Commerce, Project Management, Mobile App)",
  "roles": ["string (e.g. Admin, Project Manager, Member)"],
  "features": ["string (feature descriptions)"],
  "entities": ["string (domain models e.g. Task, User, Workspace, Project)"],
  "sitemap": [
    { "title": "string", "route": "string", "children": ["optional sub-routes"] }
  ],
  "flows": [
    { "name": "string", "steps": ["Step 1", "Step 2", "Step 3"] }
  ],
  "screens": [
    {
      "id": "screen_1",
      "name": "string",
      "purpose": "string",
      "role": "string",
      "components": ["header", "navbar", "table", "button", "input"],
      "navigatesTo": ["screen_2"]
    }
  ]
}

Return ONLY the JSON object. Do not enclose in markdown ticks if possible, or use standard json blocks. No conversational text.
`.trim();

export function buildAnalysisUserPrompt(
  workspaceFiles: { path: string; content: string }[],
  screenHints: { name: string; route?: string; purpose: string; componentsHint: string[] }[],
  stackInfo: { primaryStack: string; platform: string }
): string {
  return `
Project Stack Detected: ${stackInfo.primaryStack} (${stackInfo.platform})

Deterministic Screen Hints from Code Extractors:
${JSON.stringify(screenHints, null, 2)}

Workspace Content:
${workspaceFiles
  .map(
    (f) => `--- File: ${f.path} ---
${f.content.slice(0, 4000)}
`
  )
  .join('\n\n')}

Analyze all the above information, consolidate the screens (retaining and expanding on the deterministic screen hints), and produce the JSON analysis model.
`.trim();
}
