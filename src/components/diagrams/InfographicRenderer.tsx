'use client';

import React, { useState } from 'react';
import {
  InfographicSpec,
  InfographicStage,
  InfographicTheme,
  InfographicMockupType
} from '@/types/diagrams';
import ServiceIcon from './ServiceIcon';
import { defaultDiagramExporter } from '@/lib/diagrams/diagramExporter';
import {
  ArrowDown,
  Download,
  Printer,
  Sparkles,
  CheckCircle,
  TrendingUp,
  Target,
  Database,
  Mail,
  ShieldCheck,
  PhoneCall,
  Award,
  Smile,
  CalendarCheck,
  Bell,
  Layers,
  Palette,
  Eye
} from 'lucide-react';

interface InfographicRendererProps {
  infographic: InfographicSpec;
  onChangeInfographic?: (updated: InfographicSpec) => void;
}

const OUTCOME_ICONS: Record<string, any> = {
  Target,
  CheckCircle,
  Database,
  Mail,
  TrendingUp,
  ShieldCheck,
  PhoneCall,
  Award,
  Smile,
  CalendarCheck,
  Bell,
  Layers
};

export default function InfographicRenderer({
  infographic,
  onChangeInfographic
}: InfographicRendererProps) {
  const [theme, setTheme] = useState<InfographicTheme>(infographic.theme || 'dark');

  const handleExportSvg = () => {
    const svgStr = defaultDiagramExporter.exportInfographicSvg(infographic);
    defaultDiagramExporter.downloadFile(
      svgStr,
      `${infographic.title.toLowerCase().replace(/\s+/g, '-')}-infographic.svg`,
      'image/svg+xml'
    );
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          wrapper: 'bg-zinc-100 text-zinc-900',
          card: 'bg-white border-zinc-200 shadow-md',
          subtext: 'text-zinc-600',
          numberBg: 'bg-blue-600 text-white',
          outcomeCard: 'bg-zinc-50 border-zinc-200 text-zinc-800',
          outcomeTitle: 'text-blue-700',
          mockupBg: 'bg-zinc-100 border-zinc-300'
        };
      case 'pastel':
        return {
          wrapper: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-slate-800',
          card: 'bg-white/80 border-purple-100 shadow-lg backdrop-blur-sm',
          subtext: 'text-slate-600',
          numberBg: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white',
          outcomeCard: 'bg-purple-50/60 border-purple-100 text-slate-700',
          outcomeTitle: 'text-purple-700',
          mockupBg: 'bg-purple-50/50 border-purple-200'
        };
      default: // Dark
        return {
          wrapper: 'bg-zinc-950 text-zinc-100',
          card: 'bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-md',
          subtext: 'text-zinc-400',
          numberBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30',
          outcomeCard: 'bg-zinc-950/80 border-zinc-800/90 text-zinc-300',
          outcomeTitle: 'text-blue-400',
          mockupBg: 'bg-zinc-950 border-zinc-800'
        };
    }
  };

  const classes = getThemeClasses();

  // Render miniature mockup box
  const renderMockup = (mockup: InfographicMockupType) => {
    if (mockup === 'none') return null;

    if (mockup === 'email') {
      return (
        <div className={`mt-3 p-2.5 rounded-lg border text-[11px] font-mono ${classes.mockupBg}`}>
          <div className="flex items-center gap-1.5 text-zinc-400 pb-1.5 border-b border-zinc-700/40 mb-1.5">
            <Mail className="w-3 h-3 text-red-400" />
            <span>To: alex@enterprise.com • Subject: Autonomous Lead-Gen</span>
          </div>
          <div className="text-zinc-300 text-[10px] leading-relaxed">
            "Hi Alex, noticed your team expanded the sales engineering org. We built an AI pipeline that books 30+ discovery calls..."
          </div>
        </div>
      );
    }

    if (mockup === 'chat') {
      return (
        <div className={`mt-3 p-2.5 rounded-lg border text-[11px] font-mono space-y-1.5 ${classes.mockupBg}`}>
          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live AI Voice Call • 01:24 connected</span>
          </div>
          <div className="bg-zinc-800/80 p-1.5 rounded text-[10px] text-zinc-200">
            Agent: "Would Thursday at 2pm EST work for a 15-minute demo with Sarah?"
          </div>
        </div>
      );
    }

    if (mockup === 'calendar') {
      return (
        <div className={`mt-3 p-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-between ${classes.mockupBg}`}>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-600 text-white font-bold text-[10px]">THU 14</div>
            <div>
              <div className="font-semibold text-zinc-200 text-[10px]">Product Demo & Technical Discovery</div>
              <div className="text-zinc-400 text-[9px]">2:00 PM - 2:30 PM • Google Meet link attached</div>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/40">
            Confirmed
          </span>
        </div>
      );
    }

    if (mockup === 'table') {
      return (
        <div className={`mt-3 p-2 rounded-lg border text-[10px] font-mono overflow-x-auto ${classes.mockupBg}`}>
          <div className="grid grid-cols-4 gap-2 text-zinc-400 pb-1 border-b border-zinc-700/40 font-semibold">
            <span>PROSPECT</span>
            <span>ROLE</span>
            <span>INTENT</span>
            <span>ACTION</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-zinc-300 pt-1 text-[9px]">
            <span className="truncate">Sarah Jenkins</span>
            <span>VP Growth</span>
            <span className="text-emerald-400">92 / 100</span>
            <span className="text-blue-400">Enriched</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`w-full h-full overflow-y-auto ${classes.wrapper} transition-colors duration-300`}>
      {/* Control Toolbar */}
      <div className="sticky top-0 z-20 px-6 py-2.5 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-purple-950/60 border border-purple-800/40 rounded text-purple-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-zinc-200">Process Infographic Diagram</span>
          {infographic.generationSource === 'heuristic' && (
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded font-mono">
              Heuristic Infographic
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
            {(['dark', 'light', 'pastel'] as InfographicTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-2 py-1 rounded text-[11px] capitalize font-medium transition-colors ${
                  theme === t ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportSvg}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium flex items-center gap-1.5 border border-zinc-700/60"
            title="Download Standalone Vector SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SVG</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-1.5 shadow-sm"
            title="Print or Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Infographic Content */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Title Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>Multi-Stage Autonomous Pipeline</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {infographic.title.split(infographic.accentWord || '').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {infographic.accentWord}
                  </span>
                )}
              </React.Fragment>
            ))}
          </h1>

          <p className={`text-sm md:text-base max-w-2xl mx-auto leading-relaxed ${classes.subtext}`}>
            {infographic.subtitle}
          </p>
        </div>

        {/* Vertical Stack of Stages */}
        <div className="space-y-6">
          {infographic.stages.map((stage, idx) => (
            <React.Fragment key={stage.number}>
              {/* Stage Card */}
              <div className={`p-6 rounded-2xl border transition-all ${classes.card}`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Number, Title, Tools, Mockup */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${classes.numberBg}`}
                      >
                        {stage.number}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold leading-tight">{stage.title}</h2>
                        <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                          Stage {stage.number} of {infographic.stages.length}
                        </span>
                      </div>
                    </div>

                    <p className={`text-xs leading-relaxed ${classes.subtext}`}>{stage.description}</p>

                    {/* Integrated Tools Badges */}
                    {stage.icons && stage.icons.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Integrated Services:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {stage.icons.map((item, iconIdx) => (
                            <div
                              key={iconIdx}
                              className="px-2 py-1 rounded-lg bg-zinc-800/60 border border-zinc-700/50 flex items-center gap-1.5 text-xs text-zinc-200"
                            >
                              <ServiceIcon service={item.service} size={14} />
                              <span className="text-[11px] font-medium">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Miniature Mockup */}
                    {renderMockup(stage.mockup)}
                  </div>

                  {/* Right Column: Outcomes Cards */}
                  <div className="md:col-span-7 grid grid-cols-1 gap-2.5">
                    {stage.outcomes.map((outcome, oIdx) => {
                      const IconComponent = OUTCOME_ICONS[outcome.icon] || CheckCircle;

                      return (
                        <div
                          key={oIdx}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${classes.outcomeCard}`}
                        >
                          <div className="p-2 rounded-lg bg-zinc-800/80 text-blue-400 flex-shrink-0 mt-0.5">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`text-xs font-bold ${classes.outcomeTitle}`}>
                              {outcome.title}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                              {outcome.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Connecting Down Arrow between stages */}
              {idx < infographic.stages.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-blue-400 shadow-md">
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Footer */}
        {infographic.footer && (
          <div className="pt-6 border-t border-zinc-800 text-center text-xs text-zinc-500 font-mono">
            {infographic.footer}
          </div>
        )}
      </div>
    </div>
  );
}
