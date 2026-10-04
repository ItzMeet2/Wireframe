import { ScreenHint, StackInfo, WorkspaceFile } from '@/types/wireframe';
import { IScreenExtractor } from './types';
import { ReactNextExtractor } from './extractors/reactNextExtractor';
import { RazorMvcExtractor } from './extractors/razorMvcExtractor';
import { FlutterExtractor } from './extractors/flutterExtractor';
import { GenericExtractor } from './extractors/genericExtractor';

export class ExtractorRegistry {
  private extractors: IScreenExtractor[] = [];

  constructor() {
    // Default built-in extractors
    this.register(new ReactNextExtractor());
    this.register(new RazorMvcExtractor());
    this.register(new FlutterExtractor());
    this.register(new GenericExtractor());
  }

  register(extractor: IScreenExtractor) {
    // Insert newer extractors before generic fallback
    if (this.extractors.length > 0 && this.extractors[this.extractors.length - 1] instanceof GenericExtractor) {
      this.extractors.splice(this.extractors.length - 1, 0, extractor);
    } else {
      this.extractors.push(extractor);
    }
  }

  extractAll(stackInfo: StackInfo, files: WorkspaceFile[]): ScreenHint[] {
    const allHints: ScreenHint[] = [];
    const seenNames = new Set<string>();

    for (const extractor of this.extractors) {
      if (extractor.canHandle(stackInfo)) {
        const hints = extractor.extract(files);
        for (const hint of hints) {
          const key = hint.name.toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            allHints.push(hint);
          }
        }
      }
    }

    return allHints;
  }
}

export const defaultExtractorRegistry = new ExtractorRegistry();
