import { ScreenHint, StackInfo, WorkspaceFile } from '@/types/wireframe';
import { IScreenExtractor } from '../types';

export class ReactNextExtractor implements IScreenExtractor {
  name = 'React/Next.js Route Extractor';

  canHandle(stackInfo: StackInfo): boolean {
    const s = stackInfo.primaryStack.toLowerCase();
    return s.includes('react') || s.includes('next');
  }

  extract(files: WorkspaceFile[]): ScreenHint[] {
    const hints: ScreenHint[] = [];

    for (const file of files) {
      const pathLower = file.path.toLowerCase().replace(/\\/g, '/');
      const content = file.content || '';

      // Next.js App Router: app/dashboard/page.tsx or app/tasks/[id]/page.tsx
      if (pathLower.includes('/app/') && (pathLower.endsWith('/page.tsx') || pathLower.endsWith('/page.jsx') || pathLower.endsWith('/page.js'))) {
        const routeMatch = pathLower.match(/\/app\/(.*?)\/page\.[a-z]+/);
        const routeSegment = routeMatch && routeMatch[1] ? routeMatch[1] : 'home';
        const cleanName = routeSegment === 'home' || routeSegment === ''
          ? 'Home Page'
          : routeSegment.split('/').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

        const components = this.extractComponents(content);

        hints.push({
          name: cleanName,
          route: `/${routeSegment}`,
          purpose: `Page route for ${cleanName} in Next.js App Router`,
          role: 'User',
          componentsHint: components.length > 0 ? components : ['navbar', 'header', 'card', 'button'],
          sourceFile: file.path,
          extractorName: this.name
        });
      }

      // Next.js Pages Router: pages/tasks.tsx, pages/index.tsx
      else if (pathLower.includes('/pages/') && !pathLower.includes('/api/') && !pathLower.includes('_app') && !pathLower.includes('_document')) {
        const pageMatch = pathLower.match(/\/pages\/(.*?)\.[a-z]+/);
        const pageName = pageMatch ? pageMatch[1] : 'page';
        const cleanName = pageName === 'index' ? 'Home' : pageName.charAt(0).toUpperCase() + pageName.slice(1);
        const components = this.extractComponents(content);

        hints.push({
          name: `${cleanName} Screen`,
          route: pageName === 'index' ? '/' : `/${pageName}`,
          purpose: `Page component for ${cleanName}`,
          role: 'User',
          componentsHint: components.length > 0 ? components : ['navbar', 'card', 'button'],
          sourceFile: file.path,
          extractorName: this.name
        });
      }

      // React Router Route definitions in JSX: <Route path="/dashboard" element={<Dashboard />} />
      else if (content.includes('<Route') && (content.includes('path=') || content.includes('element='))) {
        const routeRegex = /<Route[^>]*path=["']([^"']+)["'][^>]*element=\{?<([A-Z][a-zA-Z0-9]+)/g;
        let match;
        while ((match = routeRegex.exec(content)) !== null) {
          const routePath = match[1];
          const componentName = match[2];
          hints.push({
            name: `${componentName.replace(/Page|View|Screen/g, '')} Screen`,
            route: routePath,
            purpose: `React Router destination for ${routePath}`,
            role: 'User',
            componentsHint: ['header', 'navbar', 'card', 'button'],
            sourceFile: file.path,
            extractorName: this.name
          });
        }
      }
    }

    return hints;
  }

  private extractComponents(content: string): string[] {
    const found = new Set<string>();
    if (/table|datagrid/i.test(content)) found.add('table');
    if (/button|btn|submit/i.test(content)) found.add('button');
    if (/input|textfield|form/i.test(content)) found.add('input');
    if (/nav|navbar|appbar/i.test(content)) found.add('navbar');
    if (/sidebar|drawer/i.test(content)) found.add('sidebar');
    if (/card/i.test(content)) found.add('card');
    if (/modal|dialog/i.test(content)) found.add('modal');
    if (/chart|graph/i.test(content)) found.add('chart');
    if (/list|items/i.test(content)) found.add('list');
    return Array.from(found);
  }
}
