import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  Video,
  Scissors,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Calendar,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Square,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export const VideoEditorPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const {
    clips,
    activeClipId,
    setActiveClip,
    assets,
    updateClip,
    updateClipTimestamps,
    generateAiContentForClip,
    exportClip,
    moveClipStatus,
    systemHealth
  } = useStore();

  const currentClip = clips.find((c) => c.id === activeClipId) || clips[0];
  const currentAsset = assets.find((a) => a.id === currentClip?.assetId) || assets[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram_reels');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Sync Video seek to trim bounds
  useEffect(() => {
    if (videoRef.current && currentClip) {
      videoRef.current.currentTime = currentClip.startTime;
    }
  }, [currentClip?.id, currentClip?.startTime]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && currentClip) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      if (time >= currentClip.endTime) {
        videoRef.current.pause();
        videoRef.current.currentTime = currentClip.startTime;
        setIsPlaying(false);
      }
    }
  };

  const handleGenerateAiContent = async () => {
    if (currentClip) {
      await generateAiContentForClip(currentClip.id, selectedPlatform);
    }
  };

  const handleExportClip = async () => {
    if (!currentClip) return;
    setExporting(true);
    setExportResult(null);

    const result = await exportClip(currentClip.id);
    setExporting(false);
    setExportResult(result);
  };

  const handleSaveToPlanner = () => {
    if (currentClip) {
      moveClipStatus(currentClip.id, 'Ready for Review');
      navigate('/planner');
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!currentClip) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active clip selected. Go to <button onClick={() => navigate('/clip-studio')} className="text-indigo-400 underline font-semibold">Clip Studio</button> to generate clips.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[11px] font-semibold mb-1">
            <Scissors className="w-3 h-3 text-violet-400" />
            <span>Editable Video Workspace</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">{currentClip.title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Trim timing bounds, set vertical 9:16 aspect ratio, generate AI hooks, captions, and export.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportClip}
            disabled={exporting}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-3.5 rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{exporting ? 'Processing Export...' : 'Export Video (FFmpeg)'}</span>
          </button>

          <button
            onClick={handleSaveToPlanner}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Save to Content Planner</span>
          </button>
        </div>
      </div>

      {/* 3-Column SaaS Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================== */}
        {/* LEFT COLUMN: Clips Navigator & Source Assets (3 Cols)   */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Project Clips ({clips.length})</span>
              <button onClick={() => navigate('/clip-studio')} className="text-indigo-400 hover:underline text-[10px] font-semibold">+ New</button>
            </h3>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {clips.map((clip) => {
                const isActive = clip.id === currentClip.id;
                return (
                  <div
                    key={clip.id}
                    onClick={() => setActiveClip(clip.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 border-indigo-500 text-slate-100 shadow'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 truncate">{clip.title}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">{clip.potentialScore}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{clip.duration}s • {clip.aspectRatio}</span>
                      <span className="capitalize text-indigo-300">{clip.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER COLUMN: Video Player & Timeline Controls (5 Cols) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Aspect Ratio Selector Controls */}
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Target Canvas:</span>
              <div className="flex items-center gap-1">
                {[
                  { label: '9:16 Vertical', ratio: '9:16', icon: Smartphone },
                  { label: '16:9 Landscape', ratio: '16:9', icon: Monitor },
                  { label: '1:1 Square', ratio: '1:1', icon: Square },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = currentClip.aspectRatio === item.ratio;
                  return (
                    <button
                      key={item.ratio}
                      onClick={() => updateClip(currentClip.id, { aspectRatio: item.ratio })}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{item.ratio}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Canvas Framing Container */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
              {/* Dynamic Aspect Ratio Visual Overlay Frame */}
              <div
                className={`transition-all duration-300 border-2 border-indigo-500/80 shadow-2xl relative flex items-center justify-center overflow-hidden bg-black ${
                  currentClip.aspectRatio === '9:16'
                    ? 'h-full aspect-[9/16]'
                    : currentClip.aspectRatio === '1:1'
                    ? 'h-full aspect-square'
                    : 'w-full h-full'
                }`}
              >
                <video
                  ref={videoRef}
                  src={currentAsset?.url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-cover"
                />

                {/* Subtitle Overlay Preview */}
                {currentClip.subtitles && currentClip.subtitles.length > 0 && (
                  <div className="absolute bottom-6 left-2 right-2 text-center pointer-events-none">
                    <span className="bg-black/80 text-yellow-300 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-yellow-500/30 shadow-2xl backdrop-blur-sm inline-block max-w-[90%]">
                      {currentClip.subtitles[0]?.text || "SAMPLE CAPTION"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Controls & Playback */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <button
                  onClick={togglePlay}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-full shadow-lg transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>

                <div className="text-xs font-mono text-slate-300">
                  <span>{currentTime.toFixed(1)}s</span> / <span className="text-slate-500">{currentClip.endTime}s</span>
                </div>

                <div className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
                  Duration: {currentClip.duration}s
                </div>
              </div>

              {/* Start & End Timestamp Range Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Time (Seconds)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={currentClip.startTime}
                    onChange={(e) => updateClipTimestamps(currentClip.id, e.target.value, currentClip.endTime)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Time (Seconds)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={currentClip.startTime + 1}
                    value={currentClip.endTime}
                    onChange={(e) => updateClipTimestamps(currentClip.id, currentClip.startTime, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Export Result Notification Banner */}
            {exportResult && (
              <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                exportResult.status === 'completed'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {exportResult.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                  <span>{exportResult.status === 'completed' ? 'Clip Exported Successfully!' : 'Export Notice'}</span>
                </div>
                <p className="text-[11px]">{exportResult.error_message || `Output file ready: ${exportResult.output_filename} (${(exportResult.file_size_bytes / 1024 / 1024).toFixed(1)} MB)`}</p>
                {exportResult.output_url && (
                  <a
                    href={exportResult.output_url}
                    download
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 underline mt-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Exported .MP4
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: AI Hooks, Captions & Subtitles (4 Cols)   */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Content Generator
              </h3>

              <button
                onClick={handleGenerateAiContent}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate Content</span>
              </button>
            </div>

            {/* Platform Selection Tabs */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Target Platform Format</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {[
                  { id: 'instagram_reels', name: 'Instagram Reels' },
                  { id: 'youtube_shorts', name: 'YouTube Shorts' },
                  { id: 'tiktok', name: 'TikTok' },
                  { id: 'linkedin', name: 'LinkedIn' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className={`py-1.5 px-2 rounded text-[10px] font-semibold transition-all ${
                      selectedPlatform === p.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hook Alternatives */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-300">AI Hook Alternatives</label>
              <div className="space-y-1.5">
                {currentClip.hooks?.map((hook, idx) => (
                  <div
                    key={idx}
                    onClick={() => updateClip(currentClip.id, { selectedHookIndex: idx })}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      currentClip.selectedHookIndex === idx
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{hook}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(hook, `hook_${idx}`);
                      }}
                      className="text-slate-500 hover:text-slate-300 p-1"
                    >
                      {copiedField === `hook_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption Editor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">Caption & Description</label>
                <button
                  onClick={() => copyToClipboard(currentClip.caption, 'caption')}
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {copiedField === 'caption' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Caption
                </button>
              </div>
              <textarea
                rows={4}
                value={currentClip.caption || ''}
                onChange={(e) => updateClip(currentClip.id, { caption: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              />
            </div>

            {/* Subtitles Lines Editor */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-semibold text-slate-300">Subtitles Overlay Lines</label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {currentClip.subtitles?.map((sub, idx) => (
                  <div key={sub.id || idx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">{sub.start}s</span>
                    <input
                      type="text"
                      value={sub.text}
                      onChange={(e) => {
                        const newSubs = [...currentClip.subtitles];
                        newSubs[idx].text = e.target.value;
                        updateClip(currentClip.id, { subtitles: newSubs });
                      }}
                      className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
