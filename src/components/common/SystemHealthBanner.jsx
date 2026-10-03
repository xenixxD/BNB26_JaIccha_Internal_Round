import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Terminal, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';

export const SystemHealthBanner = () => {
  const { systemHealth, fetchSystemHealth } = useStore();

  useEffect(() => {
    fetchSystemHealth();
  }, [fetchSystemHealth]);

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 flex items-center justify-between shadow-inner">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-semibold tracking-wider text-slate-200">SYSTEM STATUS:</span>
        </div>

        {systemHealth.ffmpeg_available ? (
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>FFmpeg Export Engine Active (9:16 H.264/AAC)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title="FFmpeg binary not detected on system path. Server video rendering disabled. Preview mode enabled.">
            <AlertTriangle className="w-3 h-3" />
            <span>FFmpeg Binary Not Detected — Export Disabled (Preview Mode Active)</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1 text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
          <Cpu className="w-3 h-3 text-indigo-400" />
          <span>AI Engine: {systemHealth.gemini_configured ? "Gemini 1.5 Pro Connected" : "NLP Heuristics Active"}</span>
        </div>
      </div>

      <div className="text-slate-500 hidden md:block">
        CreatorAI v{systemHealth.version || "1.0.0"} • Hackathon Build
      </div>
    </div>
  );
};
