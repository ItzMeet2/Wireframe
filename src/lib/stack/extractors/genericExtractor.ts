import { ScreenHint, StackInfo, WorkspaceFile } from '@/types/wireframe';
import { IScreenExtractor } from '../types';

export class GenericExtractor implements IScreenExtractor {
  name = 'Generic Document & Specification Extractor';

  canHandle(_stackInfo: StackInfo): boolean {
    // Generic extractor can run on any workspace, especially docs-only
    return true;
  }

  extract(files: WorkspaceFile[]): ScreenHint[] {
    const hints: ScreenHint[] = [];
    const seenNames = new Set<string>();

    for (const file of files) {
      const content = file.content || '';

      // 1. Markdown headings (# Dashboard, ## Task List, ### Screen: Login)
      const headingRegex = /^#{1,3}\s+(?:Screen:\s*)?([A-Za-z0-9\s/_-]{3,40})$/gm;
      let match;
      while ((match = headingRegex.exec(content)) !== null) {
        const title = match[1].trim();
        if (
          !seenNames.has(title.toLowerCase()) &&
          !/requirements|architecture|overview|summary|introduction|tech stack|scope|installation/i.test(title)
        ) {
          seenNames.add(title.toLowerCase());
          hints.push({
            name: title.endsWith('Screen') || title.endsWith('Page') || title.endsWith('View') ? title : `${title} Screen`,
            route: `/${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            purpose: `Screen identified from document specification heading: "${title}"`,
            role: /admin/i.test(title) ? 'Admin' : 'User',
            componentsHint: this.guessComponentsFromText(title, content),
            sourceFile: file.path,
            extractorName: this.name
          });
        }
      }

      // 2. Screen inventory lists: "- Screen: Task Details", "* Screen: Create Item", "- **Dashboard**"
      const listRegex = /(?:^|\n)[*-]\s+(?:\*\*|__)?(?:Screen:\s*)?([A-Z][A-Za-z0-9\s]{2,30})(?:\*\*|__)?(?:\s*[:-]\s*(.*))?/g;
      let listMatch;
      while ((listMatch = listRegex.exec(content)) !== null) {
        const item = listMatch[1].trim();
        const desc = listMatch[2] ? listMatch[2].trim() : '';
        if (
          !seenNames.has(item.toLowerCase()) &&
          /dashboard|login|signup|register|task|project|detail|profile|setting|checkout|cart|list|view|form|report/i.test(item)
        ) {
          seenNames.add(item.toLowerCase());
          hints.push({
            name: item.endsWith('Screen') || item.endsWith('Page') || item.endsWith('View') ? item : `${item} Screen`,
            route: `/${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            purpose: desc || `Screen defined in requirements list: "${item}"`,
            role: 'User',
            componentsHint: this.guessComponentsFromText(item, desc),
            sourceFile: file.path,
            extractorName: this.name
          });
        }
      }

      // 3. User stories: "As a [role], I want to [action] on the [screen]"
      const storyRegex = /As a\s+([A-Za-z0-9\s]+?),\s*I want to\s+([A-Za-z0-9\s]+?)(?:,\s*so that|\.\s*|\n)/gi;
      let storyMatch;
      while ((storyMatch = storyRegex.exec(content)) !== null) {
        const role = storyMatch[1].trim();
        const action = storyMatch[2].trim();
        const screenName = this.extractScreenFromAction(action);
        if (screenName && !seenNames.has(screenName.toLowerCase())) {
          seenNames.add(screenName.toLowerCase());
          hints.push({
            name: screenName,
            route: `/${screenName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            purpose: `User story: As a ${role}, I want to ${action}`,
            role,
            componentsHint: ['header', 'card', 'button', 'input'],
            sourceFile: file.path,
            extractorName: this.name
          });
        }
      }
    }

    return hints;
  }

  private extractScreenFromAction(action: string): string | null {
    if (/view|browse|see/i.test(action) && /task|project|item|dashboard|order|product/i.test(action)) {
      return 'Overview Dashboard';
    }
    if (/create|add|new/i.test(action) && /task|item|project/i.test(action)) {
      return 'Create Item Screen';
    }
    if (/edit|update/i.test(action)) {
      return 'Edit Details Screen';
    }
    if (/login|sign in|authenticate/i.test(action)) {
      return 'Login Screen';
    }
    return null;
  }

  private guessComponentsFromText(title: string, context: string): string[] {
    const combined = `${title} ${context}`.toLowerCase();
    const components: string[] = ['navbar'];

    if (combined.includes('dashboard') || combined.includes('chart') || combined.includes('stat')) {
      components.push('chart', 'card', 'table');
    }
    if (combined.includes('list') || combined.includes('tasks') || combined.includes('items')) {
      components.push('table', 'button', 'input');
    }
    if (combined.includes('create') || combined.includes('edit') || combined.includes('form')) {
      components.push('input', 'textarea', 'select', 'button');
    }
    if (combined.includes('login') || combined.includes('auth')) {
      components.push('input', 'button');
    }
    if (combined.includes('sidebar') || combined.includes('menu')) {
      components.push('sidebar');
    }

    return Array.from(new Set(components));
  }
}
