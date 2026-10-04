import { StackInfo, ScreenHint, WorkspaceFile } from '@/types/wireframe';

export interface IStackDetector {
  detect(files: WorkspaceFile[]): StackInfo;
}

export interface IScreenExtractor {
  name: string;
  canHandle(stackInfo: StackInfo): boolean;
  extract(files: WorkspaceFile[]): ScreenHint[];
}
