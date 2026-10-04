/**
 * Secret Redaction Utility
 * Detects and redacts credentials, API keys, tokens, and connection strings
 * before any workspace content is transmitted to the AI models.
 */

const SECRET_PATTERNS = [
  // OpenAI & Anthropic API Keys
  /(?:sk-[a-zA-Z0-9_-]{20,})/g,
  /(?:sk-ant-[a-zA-Z0-9_-]{20,})/g,
  
  // Google API Key
  /(?:AIzaSy[a-zA-Z0-9_-]{33})/g,
  
  // GitHub Personal Access Tokens
  /(?:ghp_[a-zA-Z0-9]{36})/g,
  /(?:github_pat_[a-zA-Z0-9_]{82})/g,
  
  // AWS Access Key ID & Secret
  /(?:AKIA[0-9A-Z]{16})/g,
  /(?:aws_secret_access_key\s*=\s*['"]?[a-zA-Z0-9/+=]{40}['"]?)/gi,
  
  // Generic Bearer Tokens
  /(?:Bearer\s+[a-zA-Z0-9_.\-]{24,})/gi,
  
  // Database Connection Strings (PostgreSQL, MySQL, MongoDB, Redis, MSSQL)
  /(?:(?:mongodb|postgres|postgresql|mysql|redis):\/\/[^:\s]+:[^@\s]+@[^\s'"]+)/gi,
  /(?:Server=[^;]+;.*Database=[^;]+;.*(?:User Id|UID)=[^;]+;.*(?:Password|PWD)=[^;]+;?)/gi,
  
  // Private Keys
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
  
  // Generic password assignments
  /(?:(?:password|secret|apikey|api_key|access_token|client_secret)\s*[:=]\s*['"][^'"]{6,}['"])/gi
];

export interface RedactionResult {
  redactedText: string;
  redactedCount: number;
  hasRedactions: boolean;
}

export function redactSecrets(content: string): RedactionResult {
  let redactedText = content;
  let count = 0;

  for (const pattern of SECRET_PATTERNS) {
    redactedText = redactedText.replace(pattern, (match) => {
      count++;
      return '[REDACTED_SECRET]';
    });
  }

  return {
    redactedText,
    redactedCount: count,
    hasRedactions: count > 0
  };
}
