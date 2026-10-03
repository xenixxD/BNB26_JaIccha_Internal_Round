import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Panel } from '../components/ui/Panel';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  Download,
  Calendar,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Square,
  Undo2,
  Redo2,
  Sliders,
  Scissors,
  Sparkles,
  Layers,
  Lock,
  Eye,
  Type,
  Music,
  Film,
  Loader2,
  CheckCircle2,
  AlertTriangle
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
    updateAssetDuration,
    saveDraft,
    loadDraftVersions,
    restoreDraftVersion,
    draftVersions
  } = useStore();

  const currentClip = clips.find((c) => c.id === activeClipId) || clips[0];
  const currentAsset = assets.find((a) => a.id === currentClip?.assetId) || assets[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoSrc, setVideoSrc] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram_reels');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [leftTab, setLeftTab] = useState('media'); // 'media' | 'captions' | 'audio'
  const [timelineZoom, setTimelineZoom] = useState(100);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState('');

  useEffect(() => {
    setVideoSrc(currentAsset?.url || null);
  }, [currentAsset?.url]);

  useEffect(() => {
    if (currentClip) loadDraftVersions(currentClip.id);
  }, [currentClip?.id]);

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

  const handleExportClip = async () => {
    if (!currentClip) return;
    setExporting(true);
    setExportResult(null);

    const result = await exportClip(currentClip.id);
    setExporting(false);
    setExportResult(result);
  };

  const handleSaveDraft = async () => {
    if (!currentClip || savingDraft) return;
    setSavingDraft(true);
    setDraftError('');
    try {
      await saveDraft(currentClip.id);
    } catch (error) {
      setDraftError(error.message || 'Draft could not be saved.');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleRestoreDraft = (event) => {
    const version = Number(event.target.value);
    const draft = draftVersions.find((item) => item.version === version);
    if (draft) restoreDraftVersion(draft);
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
      <div className="p-8 text-center text-ink-muted">
        No active clip selected. Go to <button onClick={() => navigate('/clip-studio')} className="text-accent underline font-semibold">Clip Studio</button> to generate clips.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col -m-5 md:-m-6 overflow-hidden bg-canvas">
      {/* 1. TOP EDITOR TOOLBAR (40-44px) */}
      <div className="h-[42px] bg-white border-b border-border-subtle px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={currentClip.title}
            onChange={(e) => updateClip(currentClip.id, { title: e.target.value })}
            className="text-body-sm font-bold text-ink-primary bg-transparent hover:bg-surface-inset px-2 py-0.5 rounded border border-transparent hover:border-border-subtle focus:border-accent focus:bg-white transition-colors"
          />

          <div className="h-4 w-[1px] bg-border-subtle" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" title="Undo"><Undo2 className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" title="Redo"><Redo2 className="w-3.5 h-3.5" /></Button>
          </div>

          <div className="flex items-center gap-1.5 text-micro text-ink-muted font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block"></span>
            <span>LOCAL DRAFT STORAGE</span>
          </div>
        </div>

        {/* Aspect Ratio & Zoom Selector */}
        <div className="flex items-center gap-3">
          <select
            aria-label="Saved draft versions"
            defaultValue=""
            onChange={handleRestoreDraft}
            className="h-7 max-w-36 bg-white border border-border-subtle text-xs rounded-btn px-2"
          >
            <option value="">Draft history</option>
            {draftVersions.map((draft) => (
              <option key={draft.id} value={draft.version}>Version {draft.version}</option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={handleSaveDraft} isLoading={savingDraft}>
            Save Draft
          </Button>
          <div className="flex bg-surface-inset p-0.5 rounded-chip border border-border-subtle">
            {[
              { label: '9:16 Vertical', ratio: '9:16', icon: Smartphone },
              { label: '16:9 Landscape', ratio: '16:9', icon: Monitor },
              { label: '1:1 Square', ratio: '1:1', icon: Square }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = currentClip.aspectRatio === item.ratio;
              return (
                <button
                  key={item.ratio}
                  onClick={() => updateClip(currentClip.id, { aspectRatio: item.ratio })}
                  className={`h-[24px] px-2 rounded-chip text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    isSelected ? 'bg-accent text-white shadow-sm' : 'text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.ratio}</span>
                </button>
              );
            })}
          </div>
          <Button variant="secondary" size="sm" onClick={handleSaveToPlanner} icon={Calendar}>
            Save to Planner
          </Button>

          <Button variant="primary" size="sm" onClick={handleExportClip} isLoading={exporting} icon={Download}>
            Export Video (FFmpeg)
          </Button>
        </div>
      </div>
      {draftError && (
        <div role="alert" className="px-4 py-2 bg-rose-50 text-rose-700 text-xs border-b border-rose-200">
          {draftError}
        </div>
      )}

      {/* 2. MAIN WORKSPACE (Left Media, Center Preview, Right Inspector) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT PANEL: Media & Captions (280px) */}
        <div className="w-[280px] bg-white border-r border-border-subtle flex flex-col shrink-0">
          <div className="flex border-b border-border-subtle px-3 pt-2">
            {[
              { id: 'media', label: 'Media', icon: Film },
              { id: 'captions', label: 'Captions', icon: Type },
              { id: 'audio', label: 'Audio', icon: Music },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = leftTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setLeftTab(tab.id)}
                  className={`pb-2 text-xs font-semibold px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isActive ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {clips.map((clip) => {
              const isActive = clip.id === currentClip.id;
              return (
                <div
                  key={clip.id}
                  onClick={() => setActiveClip(clip.id)}
                  className={`p-2.5 rounded-panel border text-xs cursor-pointer transition-all space-y-1 ${
                    isActive ? 'border-accent bg-accent-soft/30 font-semibold' : 'border-border-subtle bg-white hover:border-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-primary truncate">{clip.title}</span>
                    <Badge variant="score" size="sm">{clip.potentialScore}%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span>{clip.duration}s • {clip.aspectRatio}</span>
                    <span className="text-accent">{clip.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER PREVIEW CANVAS */}
        <div className="flex-1 bg-backdrop flex flex-col items-center justify-center p-4 relative min-w-0">
          <div className="relative flex-1 max-h-[70%] aspect-video flex items-center justify-center">
            {/* Dynamic Aspect Ratio Canvas Box */}
            <div
              className={`transition-all duration-300 border border-border-strong relative flex items-center justify-center overflow-hidden bg-black shadow-2xl ${
                currentClip.aspectRatio === '9:16'
                  ? 'h-full aspect-[9/16]'
                  : currentClip.aspectRatio === '1:1'
                  ? 'h-full aspect-square'
                  : 'w-full h-full'
              }`}
            >
              {currentAsset && (
                <video
                  ref={videoRef}
                  src={videoSrc || currentAsset.url}
                  onLoadedMetadata={(e) => {
                    if (e.target.duration && currentAsset.duration !== Math.round(e.target.duration * 10) / 10) {
                      updateAssetDuration(currentAsset.id, e.target.duration);
                      if (currentClip.endTime > e.target.duration) {
                        updateClipTimestamps(currentClip.id, 0, Math.round(e.target.duration * 10) / 10);
                      }
                    }
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Subtitle Overlay Preview */}
              {currentClip.subtitles?.[0]?.text && (
                <div className="absolute bottom-6 left-2 right-2 text-center pointer-events-none">
                  <span className="bg-black/90 text-yellow-300 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-chip border border-yellow-500/40 shadow-xl backdrop-blur-sm inline-block max-w-[90%]">
                    {currentClip.subtitles[0].text}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Transport Bar */}
          <div className="h-[40px] bg-slate-900 border border-slate-800 rounded-panel px-4 flex items-center justify-between text-white text-xs gap-4 mt-3 w-full max-w-xl">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={togglePlay} className="text-white hover:bg-slate-800">
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white" />}
              </Button>
              <span className="font-mono text-mono-val font-semibold text-slate-200">
                {currentTime.toFixed(1)}s / {currentClip.endTime}s
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-mono-val text-slate-400">
              <span>Duration: {currentClip.duration}s</span>
              <Volume2 className="w-3.5 h-3.5" />
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR PANEL (300px) */}
        <div className="w-[300px] bg-white border-l border-border-subtle p-4 space-y-4 overflow-y-auto shrink-0">
          <div className="border-b border-border-subtle pb-3">
            <h3 className="text-micro text-ink-muted uppercase tracking-widest font-semibold">CLIP INSPECTOR & AI CONTENT</h3>
          </div>

          {/* Platform Selector */}
          <div>
            <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold mb-1">Target Format</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full h-[32px] bg-white border border-border-subtle text-xs text-ink-primary font-medium rounded-btn px-2 cursor-pointer"
            >
              <option value="instagram_reels">Instagram Reels</option>
              <option value="youtube_shorts">YouTube Shorts</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>

          <Button variant="soft" onClick={() => generateAiContentForClip(currentClip.id, selectedPlatform)} icon={Sparkles} className="w-full">
            Generate AI Hooks & Captions
          </Button>

          {/* AI Hooks */}
          <div className="space-y-2">
            <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold">AI Opening Hooks</label>
            <div className="space-y-1.5">
              {currentClip.hooks?.map((h, idx) => (
                <div
                  key={idx}
                  onClick={() => updateClip(currentClip.id, { selectedHookIndex: idx })}
                  className={`p-2 rounded-btn border text-xs cursor-pointer transition-colors ${
                    currentClip.selectedHookIndex === idx
                      ? 'border-accent bg-accent-soft text-accent-text font-semibold'
                      : 'border-border-subtle bg-white hover:border-border-strong text-ink-secondary'
                  }`}
                >
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Subtitles Overlay Lines */}
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold">Subtitles Overlay Lines</label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {currentClip.subtitles?.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-surface-inset p-1.5 rounded-btn border border-border-subtle text-xs">
                  <span className="font-mono text-mono-val text-ink-muted shrink-0">{sub.start}s</span>
                  <input
                    type="text"
                    value={sub.text}
                    onChange={(e) => {
                      const newSubs = [...currentClip.subtitles];
                      newSubs[idx].text = e.target.value;
                      updateClip(currentClip.id, { subtitles: newSubs });
                    }}
                    className="w-full bg-transparent text-xs text-ink-primary font-semibold focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Export Output Banner */}
          {exportResult && (
            <div className={`p-3 rounded-panel border text-xs space-y-2 ${
              exportResult.status === 'completed' ? 'bg-status-success-soft border-emerald-200 text-status-success' : 'bg-status-warning-soft border-amber-200 text-status-warning'
            }`}>
              <div className="font-bold flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {exportResult.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  <span>{exportResult.status === 'completed' ? 'FFmpeg Clip Exported!' : 'Export Notice'}</span>
                </div>
                {exportResult.file_size_bytes > 0 && (
                  <span className="font-mono text-[10px] text-ink-muted">
                    {(exportResult.file_size_bytes / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ink-secondary">{exportResult.error_message || exportResult.output_filename}</p>
              
              {exportResult.output_url && (
                <div className="pt-1">
                  <a
                    href={exportResult.output_url}
                    download={exportResult.output_filename || "trimmed_clip.mp4"}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full h-8 bg-accent text-white text-xs font-bold rounded-btn flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Trimmed Clip (.MP4)
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM TIMELINE (240px) */}
      <div className="h-[220px] bg-white border-t border-border-subtle p-3 flex flex-col shrink-0">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-micro text-ink-muted uppercase tracking-widest font-semibold">MULTI-TRACK TIMELINE</span>
            <span className="font-mono text-mono-val font-semibold text-accent">
              Trim Range: {currentClip.startTime}s – {currentClip.endTime}s ({currentClip.duration}s)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[11px] text-ink-muted font-semibold">Zoom:</label>
            <input
              type="range"
              min="50"
              max="200"
              value={timelineZoom}
              onChange={(e) => setTimelineZoom(Number(e.target.value))}
              className="w-24 accent-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {/* Video Track */}
          <div className="flex items-center gap-2">
            <div className="w-24 text-[11px] font-semibold text-ink-secondary flex items-center gap-1 shrink-0">
              <Film className="w-3.5 h-3.5 text-accent" /> Video 1
            </div>
            <div className="flex-1 h-10 bg-surface-inset rounded-btn border border-border-subtle relative overflow-hidden flex items-center px-3">
              <div
                style={{ left: `${(currentClip.startTime / (currentAsset?.duration || 160.0)) * 100}%`, width: `${(currentClip.duration / (currentAsset?.duration || 160.0)) * 100}%` }}
                className="absolute h-8 bg-accent/20 border-2 border-accent rounded-btn flex items-center justify-between px-2 font-mono text-mono-val text-accent font-bold"
              >
                <span>{currentClip.startTime}s</span>
                <span className="truncate mx-2">{currentClip.title}</span>
                <span>{currentClip.endTime}s</span>
              </div>
            </div>
          </div>

          {/* Subtitles Track */}
          <div className="flex items-center gap-2">
            <div className="w-24 text-[11px] font-semibold text-ink-secondary flex items-center gap-1 shrink-0">
              <Type className="w-3.5 h-3.5 text-amber-500" /> Captions
            </div>
            <div className="flex-1 h-8 bg-surface-inset rounded-btn border border-border-subtle relative overflow-hidden flex items-center px-3">
              <div
                style={{ left: `${(currentClip.startTime / (currentAsset?.duration || 160.0)) * 100}%`, width: `${(currentClip.duration / (currentAsset?.duration || 160.0)) * 100}%` }}
                className="absolute h-6 bg-amber-500/20 border border-amber-500 rounded-btn flex items-center px-2 font-mono text-[10px] text-amber-700 font-bold truncate"
              >
                AI Subtitles ({currentClip.subtitles?.length || 0} lines)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
