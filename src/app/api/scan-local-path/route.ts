import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WorkspaceFile } from '@/types/wireframe';
import { shouldIgnoreFile, detectFileType } from '@/lib/scanner/fileFilter';
import { redactSecrets } from '@/lib/scanner/redact';

export const runtime = 'nodejs';

const MAX_FILES_TO_SCAN = 250;
const MAX_FILE_SIZE_BYTES = 512 * 1024; // 512 KB per file

// Directories to skip early to avoid traversing deep node_modules or build trees
const PRUNED_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '.next',
  '.nuxt',
  'dist',
  'build',
  'out',
  '.vscode',
  '.idea',
  'coverage',
  '.turbo',
  'vendor',
  'bin',
  'obj',
  '__pycache__',
  'venv',
  '.venv',
  'env',
  '.env',
  '.cache'
]);

interface ScanResult {
  files: WorkspaceFile[];
  projectName: string;
  scannedCount: number;
  totalSkipped: number;
  rootPath: string;
}

function traverseDirectory(
  rootDir: string,
  currentDir: string,
  collected: WorkspaceFile[],
  stats: { skipped: number }
) {
  if (collected.length >= MAX_FILES_TO_SCAN) return;

  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch (err) {
    console.warn(`Could not read directory ${currentDir}:`, err);
    return;
  }

  for (const entry of entries) {
    if (collected.length >= MAX_FILES_TO_SCAN) break;

    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      // Fast directory pruning
      if (PRUNED_DIR_NAMES.has(entry.name.toLowerCase()) || entry.name.startsWith('.')) {
        stats.skipped++;
        continue;
      }
      traverseDirectory(rootDir, fullPath, collected, stats);
    } else if (entry.isFile()) {
      if (shouldIgnoreFile(relPath)) {
        stats.skipped++;
        continue;
      }

      try {
        const fileStat = fs.statSync(fullPath);
        if (fileStat.size > MAX_FILE_SIZE_BYTES) {
          stats.skipped++;
          continue;
        }

        const textContent = fs.readFileSync(fullPath, 'utf8');
        const hash = crypto.createHash('sha256').update(textContent).digest('hex');
        const redactCheck = redactSecrets(textContent);

        collected.push({
          path: relPath,
          name: entry.name,
          size: fileStat.size,
          content: redactCheck.redactedText,
          selected: true,
          isRedacted: redactCheck.hasRedactions,
          hash,
          fileType: detectFileType(relPath)
        });
      } catch (err) {
        // Skip unreadable / binary files
        stats.skipped++;
      }
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let rawPath: string = (body.path || '').trim();

    if (!rawPath) {
      return NextResponse.json(
        { error: 'Please provide a valid directory path.' },
        { status: 400 }
      );
    }

    // Clean up quotes if user copied path as "E:\folder"
    if ((rawPath.startsWith('"') && rawPath.endsWith('"')) || (rawPath.startsWith("'") && rawPath.endsWith("'"))) {
      rawPath = rawPath.slice(1, -1).trim();
    }

    // Resolve path
    const resolvedPath = path.resolve(rawPath);

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json(
        { error: `Directory path not found on system: "${resolvedPath}"` },
        { status: 404 }
      );
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return NextResponse.json(
        { error: `The provided path is a file, not a directory: "${resolvedPath}"` },
        { status: 400 }
      );
    }

    // Determine project name from package.json or folder basename
    let projectName = path.basename(resolvedPath) || 'Local Project';
    const pkgPath = path.join(resolvedPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkgData = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkgData.name) {
          projectName = pkgData.name;
        }
      } catch {}
    }

    const collectedFiles: WorkspaceFile[] = [];
    const stats = { skipped: 0 };

    traverseDirectory(resolvedPath, resolvedPath, collectedFiles, stats);

    if (collectedFiles.length === 0) {
      return NextResponse.json(
        {
          error: `No supported code or documentation files found in "${resolvedPath}". (Ignored build outputs/dependencies: ${stats.skipped} items)`
        },
        { status: 404 }
      );
    }

    const result: ScanResult = {
      files: collectedFiles,
      projectName,
      scannedCount: collectedFiles.length,
      totalSkipped: stats.skipped,
      rootPath: resolvedPath
    };

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: any) {
    console.error('Error in scan-local-path route:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to scan local path' },
      { status: 500 }
    );
  }
}
