import { ScreenHint, StackInfo, WorkspaceFile } from '@/types/wireframe';
import { IScreenExtractor } from '../types';

export class FlutterExtractor implements IScreenExtractor {
  name = 'Flutter Widget & Navigator Extractor';

  canHandle(stackInfo: StackInfo): boolean {
    return stackInfo.primaryStack.toLowerCase().includes('flutter');
  }

  extract(files: WorkspaceFile[]): ScreenHint[] {
    const hints: ScreenHint[] = [];

    for (const file of files) {
      const pathLower = file.path.toLowerCase().replace(/\\/g, '/');
      const content = file.content || '';

      if (!pathLower.endsWith('.dart')) continue;

      // Detect Widget classes: class TaskListScreen extends StatelessWidget / StatefulWidget
      const classRegex = /class\s+([A-Za-z0-9_]+)\s+extends\s+(?:StatelessWidget|StatefulWidget)/g;
      let match;

      while ((match = classRegex.exec(content)) !== null) {
        const className = match[1];

        // Filter out non-screen internal widgets if desired, but keep Screen/Page/View
        const isScreenName = /Screen|Page|View|Dashboard|Home|List|Detail|Profile|Settings|Login/i.test(className);
        if (isScreenName || content.includes('Scaffold(')) {
          const components = this.extractFlutterComponents(content);

          hints.push({
            name: this.formatScreenName(className),
            route: `/${className.toLowerCase().replace(/screen|page|view/g, '')}`,
            purpose: `Flutter widget view for ${className}`,
            role: 'User',
            componentsHint: components.length > 0 ? components : ['header', 'navbar', 'card', 'button'],
            sourceFile: file.path,
            extractorName: this.name
          });
        }
      }
    }

    return hints;
  }

  private formatScreenName(className: string): string {
    return className
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private extractFlutterComponents(content: string): string[] {
    const found = new Set<string>();
    // Stack-specific components mapped to generic element types:
    // AppBar -> header
    if (/AppBar\(/i.test(content)) found.add('header');
    // BottomNavigationBar / NavigationBar -> navbar
    if (/BottomNavigationBar\(|NavigationBar\(/i.test(content)) found.add('navbar');
    // Drawer -> sidebar
    if (/Drawer\(/i.test(content)) found.add('sidebar');
    // FloatingActionButton / ElevatedButton / TextButton -> button
    if (/FloatingActionButton\(|ElevatedButton\(|TextButton\(|OutlinedButton\(/i.test(content)) found.add('button');
    // TextField / TextFormField -> input
    if (/TextField\(|TextFormField\(/i.test(content)) found.add('input');
    // ListView / GridView -> list or card
    if (/ListView\(/i.test(content)) found.add('list');
    if (/GridView\(/i.test(content)) found.add('card');
    // Card -> card
    if (/Card\(/i.test(content)) found.add('card');
    // AlertDialog / showDialog -> modal
    if (/AlertDialog\(|showDialog\(/i.test(content)) found.add('modal');
    // Image.asset / Image.network -> image
    if (/Image\.(?:asset|network)\(/i.test(content)) found.add('image');
    // Checkbox / Switch -> checkbox / toggle
    if (/Checkbox\(/i.test(content)) found.add('checkbox');
    if (/Switch\(/i.test(content)) found.add('toggle');

    return Array.from(found);
  }
}
