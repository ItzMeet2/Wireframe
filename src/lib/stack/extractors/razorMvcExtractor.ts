import { ScreenHint, StackInfo, WorkspaceFile } from '@/types/wireframe';
import { IScreenExtractor } from '../types';

export class RazorMvcExtractor implements IScreenExtractor {
  name = 'ASP.NET MVC & Razor View Extractor';

  canHandle(stackInfo: StackInfo): boolean {
    const s = stackInfo.primaryStack.toLowerCase();
    return s.includes('asp.net') || s.includes('blazor') || s.includes('.net');
  }

  extract(files: WorkspaceFile[]): ScreenHint[] {
    const hints: ScreenHint[] = [];

    for (const file of files) {
      const pathLower = file.path.toLowerCase().replace(/\\/g, '/');
      const content = file.content || '';

      // Views/Tasks/Index.cshtml or Views/Account/Login.cshtml
      if (pathLower.includes('/views/') && pathLower.endsWith('.cshtml') && !pathLower.includes('_viewstart') && !pathLower.includes('_viewimports')) {
        const segments = pathLower.split('/views/')[1].split('/');
        const controllerFolder = segments[0] || 'Home';
        const viewName = segments[1] ? segments[1].replace('.cshtml', '') : 'Index';

        const components = this.extractComponents(content);

        hints.push({
          name: `${controllerFolder} ${viewName}`,
          route: `/${controllerFolder}/${viewName}`,
          purpose: `Razor view for ${controllerFolder} Controller (${viewName})`,
          role: controllerFolder.toLowerCase().includes('admin') ? 'Admin' : 'User',
          componentsHint: components.length > 0 ? components : ['navbar', 'header', 'table', 'button'],
          sourceFile: file.path,
          extractorName: this.name
        });
      }

      // Blazor Pages: Pages/Tasks.razor or @page "/tasks"
      else if (pathLower.endsWith('.razor')) {
        const pageRouteMatch = content.match(/@page\s+["']([^"']+)["']/i);
        const fileName = pathLower.split('/').pop()?.replace('.razor', '') || 'BlazorPage';
        const route = pageRouteMatch ? pageRouteMatch[1] : `/${fileName.toLowerCase()}`;
        const components = this.extractComponents(content);

        hints.push({
          name: `${fileName} Screen`,
          route,
          purpose: `Blazor component view for ${fileName}`,
          role: 'User',
          componentsHint: components.length > 0 ? components : ['navbar', 'card', 'button'],
          sourceFile: file.path,
          extractorName: this.name
        });
      }

      // MVC Controllers: TaskController.cs with public IActionResult Index() or Details()
      else if (pathLower.endsWith('controller.cs')) {
        const controllerName = pathLower.split('/').pop()?.replace('controller.cs', '') || '';
        const actionRegex = /public\s+(?:IActionResult|ActionResult|Task<IActionResult>)\s+([A-Za-z0-9_]+)\s*\(/g;
        let actionMatch;

        while ((actionMatch = actionRegex.exec(content)) !== null) {
          const actionName = actionMatch[1];
          if (['index', 'details', 'create', 'edit', 'login', 'dashboard', 'list'].includes(actionName.toLowerCase())) {
            hints.push({
              name: `${controllerName.charAt(0).toUpperCase() + controllerName.slice(1)} ${actionName}`,
              route: `/${controllerName}/${actionName}`,
              purpose: `Action method ${actionName} on ${controllerName}Controller`,
              role: controllerName.toLowerCase().includes('admin') ? 'Admin' : 'User',
              componentsHint: ['header', 'table', 'button', 'input'],
              sourceFile: file.path,
              extractorName: this.name
            });
          }
        }
      }
    }

    return hints;
  }

  private extractComponents(content: string): string[] {
    const found = new Set<string>();
    if (/<table|@foreach/i.test(content)) found.add('table');
    if (/<button|type="submit"|btn/i.test(content)) found.add('button');
    if (/<input|asp-for/i.test(content)) found.add('input');
    if (/<nav|navbar/i.test(content)) found.add('navbar');
    if (/card|panel/i.test(content)) found.add('card');
    if (/modal|dialog/i.test(content)) found.add('modal');
    if (/<select/i.test(content)) found.add('select');
    return Array.from(found);
  }
}
