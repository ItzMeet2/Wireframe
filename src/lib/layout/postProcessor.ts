import { WireframeElement, WireframeScreen, DeviceType } from '@/types/wireframe';

export const DEVICE_DIMENSIONS: Record<DeviceType, { width: number; height: number }> = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 }
};

export const GRID_SIZE = 8;
export const SCREEN_PADDING = 16;

export function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function getMinimumDimensions(type: string): { minWidth: number; minHeight: number } {
  switch (type) {
    case 'button':
      return { minWidth: 80, minHeight: 32 };
    case 'input':
    case 'select':
      return { minWidth: 120, minHeight: 36 };
    case 'textarea':
      return { minWidth: 160, minHeight: 64 };
    case 'header':
    case 'navbar':
      return { minWidth: 200, minHeight: 48 };
    case 'sidebar':
      return { minWidth: 160, minHeight: 300 };
    case 'card':
    case 'table':
    case 'list':
    case 'chart':
      return { minWidth: 180, minHeight: 80 };
    case 'icon':
    case 'toggle':
    case 'checkbox':
    case 'radio':
      return { minWidth: 24, minHeight: 24 };
    case 'text':
      return { minWidth: 40, minHeight: 16 };
    case 'modal':
      return { minWidth: 280, minHeight: 160 };
    default:
      return { minWidth: 32, minHeight: 24 };
  }
}

export function isOverlapping(a: WireframeElement, b: WireframeElement): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Deterministic layout post-processor:
 * 1. Enforces minimum sizes
 * 2. Snaps all coordinates (x, y, width, height) to the 8px grid
 * 3. Clamps elements within screen bounds
 * 4. Resolves overlapping sibling elements deterministically
 */
export function postProcessScreenLayout(screen: WireframeScreen): WireframeScreen {
  const dimensions = DEVICE_DIMENSIONS[screen.device] || DEVICE_DIMENSIONS.desktop;
  const maxContentWidth = dimensions.width - SCREEN_PADDING * 2;

  // Process elements recursively if nested, but flatten top-level positioning
  const processedElements: WireframeElement[] = [];

  // Sort by Y position, then X position for deterministic processing
  const sorted = [...screen.elements].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 4) return a.y - b.y;
    return a.x - b.x;
  });

  for (const raw of sorted) {
    const minDims = getMinimumDimensions(raw.type);

    // 1. Min dimensions
    let width = Math.max(raw.width || 0, minDims.minWidth);
    let height = Math.max(raw.height || 0, minDims.minHeight);

    // Full-width elements adaptation
    if (raw.type === 'navbar' || raw.type === 'header' || raw.type === 'footer') {
      width = Math.max(width, dimensions.width);
      raw.x = 0;
    }

    // 2. Snap to 8px grid
    let x = snapToGrid(raw.x);
    let y = snapToGrid(raw.y);
    width = snapToGrid(width);
    height = snapToGrid(height);

    // 3. Screen bounds clamping
    if (raw.type !== 'navbar' && raw.type !== 'header' && raw.type !== 'footer') {
      x = Math.max(SCREEN_PADDING, x);
      if (x + width > dimensions.width - SCREEN_PADDING) {
        width = Math.max(minDims.minWidth, dimensions.width - SCREEN_PADDING - x);
        width = snapToGrid(width);
        if (x + width > dimensions.width - SCREEN_PADDING) {
          x = snapToGrid(dimensions.width - SCREEN_PADDING - width);
        }
      }
    } else {
      x = 0;
      width = dimensions.width;
    }

    y = Math.max(0, y);

    const processedElem: WireframeElement = {
      ...raw,
      x,
      y,
      width,
      height,
      children: raw.children ? raw.children.map(c => processChild(c, width, height)) : []
    };

    // 4. Overlap resolution against already placed non-container elements
    // Note: Modal or overlays are permitted to overlay
    if (processedElem.type !== 'modal') {
      for (const placed of processedElements) {
        if (placed.type === 'modal') continue;
        
        // Skip background/full-width header overlaps if placing header at top
        if ((placed.type === 'header' || placed.type === 'navbar') && placed.y === 0 && processedElem.y < placed.height) {
          processedElem.y = snapToGrid(placed.height + 8);
        } else if (isOverlapping(placed, processedElem)) {
          // Push down below the colliding element
          processedElem.y = snapToGrid(placed.y + placed.height + 8);
        }
      }
    }

    processedElements.push(processedElem);
  }

  return {
    ...screen,
    elements: processedElements
  };
}

function processChild(child: WireframeElement, parentWidth: number, parentHeight: number): WireframeElement {
  const minDims = getMinimumDimensions(child.type);
  const width = snapToGrid(Math.max(child.width || 0, minDims.minWidth));
  const height = snapToGrid(Math.max(child.height || 0, minDims.minHeight));
  const x = snapToGrid(Math.min(child.x || 0, parentWidth - width));
  const y = snapToGrid(Math.min(child.y || 0, parentHeight - height));

  return {
    ...child,
    x: Math.max(0, x),
    y: Math.max(0, y),
    width,
    height,
    children: child.children ? child.children.map(c => processChild(c, width, height)) : []
  };
}
