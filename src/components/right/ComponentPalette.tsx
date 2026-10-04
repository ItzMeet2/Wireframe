'use client';

import React from 'react';
import { ElementType } from '@/types/wireframe';
import {
  Layout,
  Sliders,
  Type,
  Square,
  Image as ImageIcon,
  Table as TableIcon,
  List as ListIcon,
  BarChart2,
  CheckSquare,
  Radio,
  ToggleLeft,
  Columns,
  Maximize2
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddElement: (type: ElementType, label: string) => void;
}

const PALETTE_ITEMS: { type: ElementType; label: string; icon: any }[] = [
  { type: 'button', label: 'Button', icon: Square },
  { type: 'input', label: 'Input Field', icon: Type },
  { type: 'table', label: 'Data Table', icon: TableIcon },
  { type: 'card', label: 'Card Container', icon: Layout },
  { type: 'image', label: 'Image Box (X)', icon: ImageIcon },
  { type: 'chart', label: 'Analytics Chart', icon: BarChart2 },
  { type: 'navbar', label: 'Top Navbar', icon: Layout },
  { type: 'sidebar', label: 'Sidebar Nav', icon: Columns },
  { type: 'list', label: 'Item List', icon: ListIcon },
  { type: 'select', label: 'Dropdown Select', icon: Sliders },
  { type: 'toggle', label: 'Toggle Switch', icon: ToggleLeft },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'modal', label: 'Modal Dialog', icon: Maximize2 },
  { type: 'text', label: 'Text Block', icon: Type }
];

export default function ComponentPalette({ onAddElement }: ComponentPaletteProps) {
  return (
    <div className="p-3 border-b border-zinc-800 space-y-2">
      <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
        Component Palette
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => onAddElement(item.type, item.label)}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 flex items-center gap-1.5 text-xs transition-colors text-left"
              title={`Add ${item.label} to active screen`}
            >
              <Icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
