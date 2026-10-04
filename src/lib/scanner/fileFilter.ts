/**
 * File filter utility to ignore build artifacts, package dependencies,
 * and unsupported binaries during workspace scanning.
 */

const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'bin',
  'obj',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  '.vscode',
  '.idea',
  'coverage',
  '.turbo',
  'vendor'
];

const IGNORED_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.DS_Store',
  'Thumbs.db'
];

const ALLOWED_EXTENSIONS = new Set([
  // Documents
  'md', 'txt', 'pdf', 'docx', 'doc', 'json', 'yaml', 'yml',
  // Web & React & Vue & Svelte
  'tsx', 'jsx', 'ts', 'js', 'vue', 'svelte', 'html', 'css',
  // .NET & C#
  'cs', 'cshtml', 'razor', 'xaml', 'csproj', 'sln',
  // Mobile & Cross-Platform
  'dart', 'kt', 'kts', 'swift', 'xml', 'gradle',
  // Backend & Systems Stacks
  'py', 'php', 'rb', 'java', 'go', 'rs', 'c', 'cpp', 'h',
  // Data, Schema & Config
  'sql', 'prisma', 'graphql', 'gql', 'toml', 'proto', 'sh', 'bash'
]);

export function shouldIgnoreFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  const fileName = segments[segments.length - 1];

  // Check directory segments
  for (const seg of segments.slice(0, -1)) {
    if (IGNORED_DIRECTORIES.includes(seg)) {
      return true;
    }
  }

  // Check ignored files
  if (IGNORED_FILES.includes(fileName)) {
    return true;
  }

  // Check file extension
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return true;
  }

  return false;
}

export function detectFileType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'md':
    case 'txt':
    case 'doc':
    case 'docx':
    case 'pdf':
      return 'document';
    case 'tsx':
    case 'jsx':
    case 'vue':
    case 'svelte':
    case 'cshtml':
    case 'razor':
    case 'xaml':
    case 'html':
      return 'view';
    case 'ts':
    case 'js':
    case 'cs':
    case 'dart':
    case 'kt':
    case 'swift':
    case 'py':
      return 'code';
    case 'json':
    case 'yaml':
    case 'yml':
      return 'data';
    default:
      return 'other';
  }
}
