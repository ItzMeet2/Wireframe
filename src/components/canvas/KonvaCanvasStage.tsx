'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Arrow } from 'react-konva';
import { WireframeScreen, WireframeElement, DeviceType } from '@/types/wireframe';
import { DEVICE_DIMENSIONS, snapToGrid } from '@/lib/layout/postProcessor';

interface KonvaCanvasStageProps {
  screens: WireframeScreen[];
  activeScreenId: string | null;
  selectedElementId: string | null;
  showFlows: boolean;
  onSelectScreen: (screenId: string) => void;
  onSelectElement: (elementId: string | null, screenId: string | null) => void;
  onUpdateElementPosition: (screenId: string, elementId: string, x: number, y: number) => void;
  onRegenerateScreen?: (screen: WireframeScreen) => void;
}

export default function KonvaCanvasStage({
  screens,
  activeScreenId,
  selectedElementId,
  showFlows,
  onSelectScreen,
  onSelectElement,
  onUpdateElementPosition,
  onRegenerateScreen
}: KonvaCanvasStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: 80, y: 80 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute layout offsets for screens side-by-side
  const screenPositions = new Map<string, { x: number; y: number; width: number; height: number }>();
  let currentOffsetX = 0;
  const SCREEN_GAP = 80;

  screens.forEach((screen) => {
    const dims = DEVICE_DIMENSIONS[screen.device] || DEVICE_DIMENSIONS.desktop;
    screenPositions.set(screen.screenId, {
      x: currentOffsetX,
      y: 0,
      width: dims.width,
      height: dims.height
    });
    currentOffsetX += dims.width + SCREEN_GAP;
  });

  // Center on active screen when selected
  useEffect(() => {
    if (activeScreenId && screenPositions.has(activeScreenId) && stageRef.current) {
      const pos = screenPositions.get(activeScreenId)!;
      const targetX = stageSize.width / 2 - (pos.x + pos.width / 2) * scale;
      const targetY = stageSize.height / 2 - (pos.y + pos.height / 2) * scale;
      setPosition({ x: targetX, y: targetY });
    }
  }, [activeScreenId]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale
    };

    const scaleBy = 1.08;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.min(Math.max(newScale, 0.2), 2.5);

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale
    });
  };

  // Render individual wireframe element in Konva
  const renderElement = (el: WireframeElement, screenId: string, screenX: number, screenY: number) => {
    const isSelected = selectedElementId === el.id;
    const { id, type, label, x, y, width, height } = el;

    const handleDragEnd = (e: any) => {
      const snappedX = snapToGrid(e.target.x());
      const snappedY = snapToGrid(e.target.y());
      e.target.position({ x: snappedX, y: snappedY });
      onUpdateElementPosition(screenId, id, snappedX, snappedY);
    };

    return (
      <Group
        key={id}
        x={x}
        y={y}
        draggable
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelectScreen(screenId);
          onSelectElement(id, screenId);
        }}
      >
        {/* Selection indicator halo */}
        {isSelected && (
          <Rect
            x={-3}
            y={-3}
            width={width + 6}
            height={height + 6}
            stroke="#2563EB"
            strokeWidth={2}
            dash={[4, 4]}
          />
        )}

        {/* Header / Navbar */}
        {(type === 'header' || type === 'navbar') && (
          <>
            <Rect
              width={width}
              height={height}
              fill="#F4F4F5"
              stroke="#A1A1AA"
              strokeWidth={1}
            />
            <Text
              text={label || type.toUpperCase()}
              x={14}
              y={height / 2 - 7}
              fontSize={13}
              fontStyle="bold"
              fontFamily="sans-serif"
              fill="#18181B"
            />
          </>
        )}

        {/* Sidebar */}
        {type === 'sidebar' && (
          <>
            <Rect
              width={width}
              height={height}
              fill="#FAFAFA"
              stroke="#D4D4D8"
              strokeWidth={1}
            />
            <Text
              text={label || 'Sidebar Menu'}
              x={12}
              y={16}
              fontSize={12}
              fontFamily="sans-serif"
              fill="#52525B"
              width={width - 24}
            />
          </>
        )}

        {/* Button */}
        {type === 'button' && (
          <>
            <Rect
              width={width}
              height={height}
              fill="#E4E4E7"
              stroke="#71717A"
              strokeWidth={1.5}
              cornerRadius={4}
            />
            <Text
              text={label || 'Button'}
              width={width}
              height={height}
              align="center"
              verticalAlign="middle"
              fontSize={12}
              fontStyle="bold"
              fontFamily="sans-serif"
              fill="#18181B"
            />
          </>
        )}

        {/* Input / Select / Textarea */}
        {(type === 'input' || type === 'select' || type === 'textarea') && (
          <>
            <Rect
              width={width}
              height={height}
              fill="#FFFFFF"
              stroke="#A1A1AA"
              strokeWidth={1}
              cornerRadius={3}
            />
            <Text
              text={label || (type === 'input' ? 'Input text...' : type)}
              x={8}
              y={type === 'textarea' ? 8 : height / 2 - 6}
              fontSize={11}
              fontFamily="sans-serif"
              fill="#71717A"
              width={width - 16}
            />
          </>
        )}

        {/* Image - Low Fi placeholder with crossing X */}
        {type === 'image' && (
          <>
            <Rect
              width={width}
              height={height}
              fill="#F4F4F5"
              stroke="#A1A1AA"
              strokeWidth={1}
            />
            <Line points={[0, 0, width, height]} stroke="#D4D4D8" strokeWidth={1} />
            <Line points={[width, 0, 0, height]} stroke="#D4D4D8" strokeWidth={1} />
            <Text
              text={label || 'Image Placeholder'}
              width={width}
              height={height}
              align="center"
              verticalAlign="middle"
              fontSize={11}
              fontFamily="sans-serif"
              fill="#71717A"
            />
          </>
        )}

        {/* Table / Card / Chart */}
        {(type === 'table' || type === 'card' || type === 'chart') && (
          <>
            <Rect
              width={width}
              height={height}
              fill="#FFFFFF"
              stroke="#D4D4D8"
              strokeWidth={1}
              cornerRadius={4}
            />
            <Rect
              width={width}
              height={28}
              fill="#F4F4F5"
              stroke="#E4E4E7"
              strokeWidth={1}
              cornerRadius={[4, 4, 0, 0]}
            />
            <Text
              text={label || type.toUpperCase()}
              x={10}
              y={8}
              fontSize={11}
              fontStyle="bold"
              fontFamily="sans-serif"
              fill="#3F3F46"
              width={width - 20}
            />
            {type === 'table' && (
              <>
                <Line points={[0, 56, width, 56]} stroke="#F4F4F5" strokeWidth={1} />
                <Line points={[0, 84, width, 84]} stroke="#F4F4F5" strokeWidth={1} />
                <Line points={[0, 112, width, 112]} stroke="#F4F4F5" strokeWidth={1} />
              </>
            )}
            {type === 'chart' && (
              <>
                <Line points={[16, height - 20, width - 16, height - 20]} stroke="#A1A1AA" strokeWidth={1.5} />
                <Line points={[16, 40, 16, height - 20]} stroke="#A1A1AA" strokeWidth={1.5} />
                <Line
                  points={[
                    20, height - 30,
                    width * 0.3, height - 60,
                    width * 0.6, height - 40,
                    width - 24, height - 90
                  ]}
                  stroke="#71717A"
                  strokeWidth={2}
                />
              </>
            )}
          </>
        )}

        {/* Generic fallback / Text / Icon / Toggle */}
        {!['header', 'navbar', 'sidebar', 'button', 'input', 'select', 'textarea', 'image', 'table', 'card', 'chart'].includes(type) && (
          <>
            <Rect
              width={width}
              height={height}
              fill="#FFFFFF"
              stroke="#D4D4D8"
              strokeWidth={1}
              dash={[3, 3]}
            />
            <Text
              text={label || type}
              x={6}
              y={height / 2 - 6}
              fontSize={11}
              fontFamily="sans-serif"
              fill="#52525B"
            />
          </>
        )}
      </Group>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-zinc-950 select-none cursor-grab active:cursor-grabbing"
    >
      {/* Zoom / Pan Controls Overlay */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center bg-zinc-900/90 border border-zinc-700/80 rounded-lg shadow-xl px-2 py-1 backdrop-blur-md gap-2 text-xs text-zinc-300">
        <button
          onClick={() => setScale((s) => Math.max(s - 0.15, 0.2))}
          className="p-1 hover:bg-zinc-800 rounded font-bold px-2 text-zinc-200"
          title="Zoom Out"
        >
          -
        </button>
        <span className="w-12 text-center font-mono font-medium">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale((s) => Math.min(s + 0.15, 2.5))}
          className="p-1 hover:bg-zinc-800 rounded font-bold px-2 text-zinc-200"
          title="Zoom In"
        >
          +
        </button>
        <div className="w-[1px] h-4 bg-zinc-700 mx-1" />
        <button
          onClick={() => {
            setScale(0.85);
            setPosition({ x: 80, y: 80 });
          }}
          className="px-2 py-1 hover:bg-zinc-800 rounded text-zinc-300"
        >
          Reset View
        </button>
      </div>

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onClick={(e) => {
          if (e.target === stageRef.current) {
            onSelectElement(null, null);
          }
        }}
      >
        <Layer>
          {/* Render Screen Frames */}
          {screens.map((screen) => {
            const pos = screenPositions.get(screen.screenId) || { x: 0, y: 0, width: 800, height: 600 };
            const isActive = activeScreenId === screen.screenId;
            const isHeuristic = screen.generationSource === 'heuristic';

            return (
              <Group key={screen.screenId} x={pos.x} y={pos.y}>
                {/* Screen Header Bar above frame */}
                <Group y={-38}>
                  <Text
                    text={screen.name}
                    fontSize={15}
                    fontStyle="bold"
                    fontFamily="sans-serif"
                    fill={isActive ? '#60A5FA' : '#E4E4E7'}
                  />
                  {/* Heuristic / AI Source Badge */}
                  <Rect
                    x={screen.name.length * 9 + 16}
                    y={-1}
                    width={isHeuristic ? 116 : 84}
                    height={18}
                    fill={isHeuristic ? '#27272A' : '#1E293B'}
                    stroke={isHeuristic ? '#71717A' : '#3B82F6'}
                    strokeWidth={1}
                    cornerRadius={9}
                  />
                  <Text
                    text={isHeuristic ? 'Heuristic Extractor' : 'AI Generated'}
                    x={screen.name.length * 9 + 24}
                    y={3}
                    fontSize={9}
                    fontFamily="sans-serif"
                    fill={isHeuristic ? '#A1A1AA' : '#93C5FD'}
                  />
                </Group>

                {/* Outer Device Frame Container */}
                <Rect
                  width={pos.width}
                  height={pos.height}
                  fill="#FAFAFA"
                  stroke={isActive ? '#3B82F6' : '#52525B'}
                  strokeWidth={isActive ? 2.5 : 1}
                  cornerRadius={screen.device === 'mobile' ? 24 : 4}
                  shadowColor="rgba(0,0,0,0.5)"
                  shadowBlur={16}
                  shadowOffset={{ x: 0, y: 8 }}
                  onClick={() => onSelectScreen(screen.screenId)}
                />

                {/* Elements inside screen */}
                {screen.elements.map((el) => renderElement(el, screen.screenId, pos.x, pos.y))}
              </Group>
            );
          })}

          {/* Click-through Navigation Flow Arrows (Clean & Selective) */}
          {showFlows && (() => {
            // 1. If an element is actively selected, only draw flow for that element
            if (selectedElementId) {
              const activeScreen = screens.find((s) => s.screenId === activeScreenId);
              const selectedEl = activeScreen?.elements.find((e) => e.id === selectedElementId);
              if (selectedEl && selectedEl.navigatesTo && screenPositions.has(selectedEl.navigatesTo)) {
                const srcPos = screenPositions.get(activeScreen!.screenId)!;
                const destPos = screenPositions.get(selectedEl.navigatesTo)!;
                const startX = srcPos.x + selectedEl.x + selectedEl.width;
                const startY = srcPos.y + selectedEl.y + selectedEl.height / 2;
                const endX = destPos.x;
                const endY = destPos.y + 60;
                return (
                  <Group key={`flow_selected_${selectedEl.id}`}>
                    <Arrow
                      points={[startX, startY, startX + 35, startY, endX - 35, endY, endX, endY]}
                      stroke="#38BDF8"
                      strokeWidth={2.5}
                      fill="#38BDF8"
                      pointerLength={9}
                      pointerWidth={9}
                      tension={0.3}
                      dash={[6, 3]}
                    />
                  </Group>
                );
              }
              return null;
            }

            // 2. If no element is selected, only draw at most 1 clean high-level arrow per target screen
            const drawnPairs = new Set<string>();
            return screens.flatMap((screen) => {
              const srcPos = screenPositions.get(screen.screenId);
              if (!srcPos) return [];

              return screen.elements
                .filter((el) => el.navigatesTo && screenPositions.has(el.navigatesTo))
                .slice(0, 1)
                .map((el) => {
                  const pairKey = `${screen.screenId}->${el.navigatesTo}`;
                  if (drawnPairs.has(pairKey)) return null;
                  drawnPairs.add(pairKey);

                  const destPos = screenPositions.get(el.navigatesTo!)!;
                  const startX = srcPos.x + srcPos.width;
                  const startY = srcPos.y + 36;
                  const endX = destPos.x;
                  const endY = destPos.y + 36;

                  return (
                    <Group key={`flow_scr_${pairKey}`}>
                      <Arrow
                        points={[startX, startY, startX + 25, startY, endX - 25, endY, endX, endY]}
                        stroke="#60A5FA"
                        strokeWidth={1.5}
                        fill="#60A5FA"
                        opacity={0.35}
                        pointerLength={6}
                        pointerWidth={6}
                        dash={[5, 4]}
                      />
                    </Group>
                  );
                });
            });
          })()}
        </Layer>
      </Stage>
    </div>
  );
}
