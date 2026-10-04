import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { WorkspaceFile } from '@/types/wireframe';
import { shouldIgnoreFile, detectFileType } from '@/lib/scanner/fileFilter';
import { redactSecrets } from '@/lib/scanner/redact';

export const runtime = 'nodejs';

const MAX_GIT_FILES = 120;
const MAX_FILE_SIZE_BYTES = 400 * 1024; // 400 KB

interface ParsedGitUrl {
  owner: string;
  repo: string;
  branch?: string;
  subpath?: string;
}

export function parseGitHubUrl(inputUrl: string): ParsedGitUrl | null {
  let clean = inputUrl.trim();
  // Remove markdown brackets, quotes, trailing slash
  clean = clean.replace(/^[<"']+|[>"']+$/g, '').replace(/\/+$/, '');

  // Handle shorthand "owner/repo"
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(clean)) {
    const [owner, repo] = clean.split('/');
    return { owner, repo: repo.replace(/\.git$/, '') };
  }

  // Handle http(s)://github.com/owner/repo or git@github.com:...
  const httpRegex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/tree\/([^/]+)(?:\/(.*))?)?$/i;
  const match = clean.match(httpRegex);

  if (match) {
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    const branch = match[3];
    const subpath = match[4];
    return { owner, repo, branch, subpath };
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gitUrl, customBranch, token: clientToken } = body;

    if (!gitUrl || typeof gitUrl !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a valid GitHub repository URL.' },
        { status: 400 }
      );
    }

    const parsed = parseGitHubUrl(gitUrl);
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            'Invalid GitHub URL format. Examples: "https://github.com/facebook/react" or "owner/repo" or "https://github.com/owner/repo/tree/main/subfolder"'
        },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;
    const token = clientToken || process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      'User-Agent': 'WireGen-GitDiagram/1.0',
      Accept: 'application/vnd.github.v3+json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // 1. Fetch repo details from GitHub
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers
    });

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return NextResponse.json(
          { error: `Repository "${owner}/${repo}" was not found or is private.` },
          { status: 404 }
        );
      }
      if (repoRes.status === 403) {
        return NextResponse.json(
          {
            error:
              'GitHub API rate limit exceeded. You can configure a GitHub Personal Access Token in Settings to get 5,000 requests/hour.'
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: `GitHub API error: ${repoRes.statusText} (${repoRes.status})` },
        { status: repoRes.status }
      );
    }

    const repoData = await repoRes.json();
    const branch = customBranch || parsed.branch || repoData.default_branch || 'main';
    const subpathFilter = parsed.subpath ? parsed.subpath.replace(/^\/+|\/+$/g, '') : null;

    // 2. Fetch Git Tree recursively
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    );

    if (!treeRes.ok) {
      return NextResponse.json(
        {
          error: `Could not retrieve file tree for branch "${branch}". Status: ${treeRes.status}`
        },
        { status: treeRes.status }
      );
    }

    const treeData = await treeRes.json();
    const treeItems: Array<{ path: string; type: string; size?: number; sha: string }> =
      treeData.tree || [];

    // Filter tree items
    const candidateFiles = treeItems.filter((item) => {
      if (item.type !== 'blob') return false;

      // If subpath is specified, only include files inside that subpath
      if (subpathFilter) {
        if (!item.path.startsWith(subpathFilter + '/') && item.path !== subpathFilter) {
          return false;
        }
      }

      if (shouldIgnoreFile(item.path)) return false;
      if (item.size && item.size > MAX_FILE_SIZE_BYTES) return false;

      return true;
    });

    if (candidateFiles.length === 0) {
      return NextResponse.json(
        {
          error: `No supported code or documentation files found in ${owner}/${repo}${
            subpathFilter ? ` (${subpathFilter})` : ''
          }.`
        },
        { status: 404 }
      );
    }

    // Sort to prioritize key architectural files: package.json, README, configs, src/ routes
    candidateFiles.sort((a, b) => {
      const aLower = a.path.toLowerCase();
      const bLower = b.path.toLowerCase();

      const getPriority = (p: string) => {
        if (p.endsWith('package.json')) return 100;
        if (p.endsWith('readme.md')) return 90;
        if (p.endsWith('tsconfig.json')) return 80;
        if (p.includes('/api/')) return 70;
        if (p.includes('schema') || p.includes('model')) return 65;
        if (p.includes('/page.') || p.includes('/routes.')) return 60;
        if (p.includes('/app/') || p.includes('/src/')) return 50;
        return 10;
      };

      return getPriority(bLower) - getPriority(aLower);
    });

    const selectedCandidates = candidateFiles.slice(0, MAX_GIT_FILES);

    // 3. Concurrently fetch raw file contents from raw.githubusercontent.com
    const batchSize = 10;
    const workspaceFiles: WorkspaceFile[] = [];

    for (let i = 0; i < selectedCandidates.length; i += batchSize) {
      const batch = selectedCandidates.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (item) => {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
          const res = await fetch(rawUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch ${item.path}: ${res.status}`);
          }

          const text = await res.text();
          const hash = crypto.createHash('sha256').update(text).digest('hex');
          const redactCheck = redactSecrets(text);

          const relativePath = subpathFilter
            ? item.path.replace(new RegExp(`^${subpathFilter}/?`), '')
            : item.path;

          const fileName = relativePath.split('/').pop() || relativePath;

          const wsFile: WorkspaceFile = {
            path: relativePath,
            name: fileName,
            size: item.size || text.length,
            content: redactCheck.redactedText,
            selected: true,
            isRedacted: redactCheck.hasRedactions,
            hash,
            fileType: detectFileType(relativePath)
          };

          return wsFile;
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          workspaceFiles.push(r.value);
        }
      }
    }

    if (workspaceFiles.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve file contents from repository.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      files: workspaceFiles,
      projectName: repoData.name || repo,
      description: repoData.description || '',
      stars: repoData.stargazers_count || 0,
      defaultBranch: branch,
      subpath: subpathFilter,
      repoUrl: repoData.html_url || `https://github.com/${owner}/${repo}`,
      totalFilesFound: candidateFiles.length,
      scannedCount: workspaceFiles.length
    });
  } catch (err: any) {
    console.error('Error in git/scan route:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to scan GitHub repository' },
      { status: 500 }
    );
  }
}
