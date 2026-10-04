/**
 * Hash utility for calculating content hashes to cache analysis results.
 */

export async function computeHash(content: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Node.js crypto fallback
    try {
      const crypto = await import('crypto');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      // Simple fast hash fallback if crypto is unavailable
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      return Math.abs(hash).toString(16);
    }
  }
}
