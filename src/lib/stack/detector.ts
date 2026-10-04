import { StackInfo, WorkspaceFile, PlatformType } from '@/types/wireframe';
import { IStackDetector } from './types';

export class StackDetector implements IStackDetector {
  detect(files: WorkspaceFile[]): StackInfo {
    const evidence: string[] = [];
    const detectedStacks: { name: string; platform: PlatformType; weight: number; file: string }[] = [];

    let hasAnyCodeFile = false;

    for (const file of files) {
      const pathLower = file.path.toLowerCase();
      const content = file.content || '';

      // 1. Dependency Marker Files
      if (pathLower.endsWith('package.json')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        if (content.includes('"next"') || content.includes("'next'")) {
          detectedStacks.push({ name: 'Next.js', platform: 'web', weight: 2.5, file: file.path });
        } else if (content.includes('"expo"') || content.includes('"react-native"')) {
          detectedStacks.push({ name: 'React Native', platform: 'mobile', weight: 2.5, file: file.path });
        } else if (content.includes('"react"')) {
          detectedStacks.push({ name: 'React', platform: 'web', weight: 2.0, file: file.path });
        } else if (content.includes('"vue"') || content.includes('"nuxt"')) {
          detectedStacks.push({ name: 'Vue.js', platform: 'web', weight: 2.0, file: file.path });
        } else if (content.includes('"@angular/core"')) {
          detectedStacks.push({ name: 'Angular', platform: 'web', weight: 2.0, file: file.path });
        } else if (content.includes('"svelte"')) {
          detectedStacks.push({ name: 'Svelte', platform: 'web', weight: 2.0, file: file.path });
        }
      }

      if (pathLower.endsWith('.csproj')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        if (content.includes('Microsoft.NET.Sdk.Web') || content.includes('Microsoft.AspNetCore')) {
          if (content.includes('Blazor') || content.includes('.Components.Web')) {
            detectedStacks.push({ name: 'Blazor', platform: 'web', weight: 2.5, file: file.path });
          } else {
            detectedStacks.push({ name: 'ASP.NET MVC', platform: 'web', weight: 2.5, file: file.path });
          }
        } else if (content.includes('Microsoft.Maui') || content.includes('UseMaui')) {
          detectedStacks.push({ name: 'MAUI', platform: 'mobile', weight: 2.5, file: file.path });
        } else if (content.includes('UseWPF') || content.includes('PresentationCore')) {
          detectedStacks.push({ name: 'WPF', platform: 'desktop', weight: 2.5, file: file.path });
        } else {
          detectedStacks.push({ name: '.NET', platform: 'desktop', weight: 1.5, file: file.path });
        }
      }

      if (pathLower.endsWith('pubspec.yaml') || pathLower.endsWith('pubspec.yml')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        if (content.includes('flutter:') || content.includes('sdk: flutter')) {
          detectedStacks.push({ name: 'Flutter', platform: 'mobile', weight: 2.5, file: file.path });
        }
      }

      if (pathLower.endsWith('build.gradle') || pathLower.endsWith('androidmanifest.xml')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'Android', platform: 'mobile', weight: 2.0, file: file.path });
      }

      if (pathLower.endsWith('package.swift') || pathLower.includes('.xcodeproj/')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'SwiftUI', platform: 'mobile', weight: 2.0, file: file.path });
      }

      if (pathLower.endsWith('composer.json')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        if (content.includes('laravel/framework')) {
          detectedStacks.push({ name: 'Laravel', platform: 'web', weight: 2.0, file: file.path });
        }
      }

      if (pathLower.endsWith('requirements.txt') || pathLower.endsWith('pyproject.toml')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        if (content.includes('django')) {
          detectedStacks.push({ name: 'Django', platform: 'web', weight: 2.0, file: file.path });
        } else if (content.includes('fastapi') || content.includes('flask')) {
          detectedStacks.push({ name: 'FastAPI/Flask', platform: 'web', weight: 2.0, file: file.path });
        }
      }

      // 2. File Extension Detection
      if (pathLower.endsWith('.cshtml')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'ASP.NET MVC', platform: 'web', weight: 0.7, file: file.path });
      } else if (pathLower.endsWith('.razor')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'Blazor', platform: 'web', weight: 0.7, file: file.path });
      } else if (pathLower.endsWith('.xaml')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'WPF/XAML', platform: 'desktop', weight: 0.7, file: file.path });
      } else if (pathLower.endsWith('.dart')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'Flutter', platform: 'mobile', weight: 0.7, file: file.path });
      } else if (pathLower.endsWith('.kt') || pathLower.endsWith('.kts')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'Android (Kotlin)', platform: 'mobile', weight: 0.7, file: file.path });
      } else if (pathLower.endsWith('.swift')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'SwiftUI', platform: 'mobile', weight: 0.7, file: file.path });
      } else if (pathLower.endsWith('.tsx') || pathLower.endsWith('.jsx')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        if (pathLower.includes('/app/') || pathLower.includes('/pages/')) {
          detectedStacks.push({ name: 'Next.js', platform: 'web', weight: 0.8, file: file.path });
        } else {
          detectedStacks.push({ name: 'React', platform: 'web', weight: 0.7, file: file.path });
        }
      } else if (pathLower.endsWith('.vue')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'Vue.js', platform: 'web', weight: 0.7, file: file.path });
      } else if (pathLower.endsWith('.svelte')) {
        evidence.push(file.path);
        hasAnyCodeFile = true;
        detectedStacks.push({ name: 'Svelte', platform: 'web', weight: 0.7, file: file.path });
      }
    }

    const uniqueEvidence = Array.from(new Set(evidence));

    // If no code files or stacks detected, fall back to docs-only
    if (!hasAnyCodeFile || detectedStacks.length === 0) {
      return {
        primaryStack: 'Docs-Only / Generic',
        secondaryStacks: [],
        platform: 'web',
        confidence: 0.35,
        evidence: uniqueEvidence.length > 0 ? uniqueEvidence : files.map((f) => f.path).slice(0, 5)
      };
    }

    // Rank detected stacks by weight
    const scoreMap = new Map<string, { totalWeight: number; count: number; platform: PlatformType }>();

    for (const item of detectedStacks) {
      const existing = scoreMap.get(item.name) || { totalWeight: 0, count: 0, platform: item.platform };
      existing.totalWeight += item.weight;
      existing.count += 1;
      scoreMap.set(item.name, existing);
    }

    const sortedStacks = Array.from(scoreMap.entries()).sort(
      (a, b) => b[1].totalWeight - a[1].totalWeight
    );

    const [topStackName, topStackData] = sortedStacks[0];
    const secondaryStacks = sortedStacks.slice(1).map(([name]) => name);

    // Calculate confidence normalized between 0.65 and 0.98 (direct config markers get >= 0.85)
    const baseConfidence = topStackData.totalWeight >= 1.0 ? 0.88 : 0.75;
    const confidence = Math.min(0.98, Math.max(0.65, baseConfidence + (topStackData.count - 1) * 0.05));

    return {
      primaryStack: topStackName,
      secondaryStacks,
      platform: topStackData.platform,
      confidence: Number(confidence.toFixed(2)),
      evidence: uniqueEvidence
    };
  }
}
