import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Play,
  Pause,
  Download,
  Calendar,
  Smartphone,
  Monitor,
  Square,
  Sparkles,
  Type,
  Film,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const VideoEditorPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const {
    clips,
    activeProjectId,
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

  const projectClips = clips.filter((clip) => clip.projectId === activeProjectId);
  const currentClip = projectClips.find((clip) => clip.id === activeClipId) || projectClips[0];
  const currentAsset = assets.find((a) => a.id === currentClip?.assetId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoSrc, setVideoSrc] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram_reels');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [exportError, setExportError] = useState('');
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentError, setContentError] = useState('');

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

  const togglePlay = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        try {
          await videoRef.current.play();
        } catch {
          setExportError('This video could not be played. Check that the source file is still available.');
        }
      }
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

    setExportError('');
    try {
      const result = await exportClip(currentClip.id);
      setExportResult(result);
      if (result.status !== 'completed') setExportError(result.error_message || 'Export did not finish. Check the server and try again.');
    } catch (error) {
      setExportError(readableError(error, 'Export failed. Check the server and try again.'));
    } finally {
      setExporting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentClip || savingDraft) return;
    setSavingDraft(true);
    setDraftSaved(false);
    setDraftError('');
    try {
      await saveDraft(currentClip.id);
      setDraftSaved(true);
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

  const generateContent = async () => {
    setGeneratingContent(true);
    setContentError('');
    try {
      await generateAiContentForClip(currentClip.id, selectedPlatform);
    } catch (error) {
      setContentError(readableError(error, 'AI suggestions could not be generated. Try again.'));
    } finally {
      setGeneratingContent(false);
    }
  };

  if (!currentClip) {
    return (
      <div className="p-8 text-center text-ink-muted">
        No active clip selected. Go to <button onClick={() => navigate('/clip-studio')} className="text-accent underline font-semibold">Clip Studio</button> to generate clips.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-112px)] md:h-[calc(100vh-56px)] flex flex-col -m-4 md:-m-6 overflow-hidden bg-canvas">
      {/* 1. TOP EDITOR TOOLBAR (40-44px) */}
      <div className="min-h-[42px] bg-white border-b border-border-subtle px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 z-20">
        <div className="flex items-center gap-2 overflow-x-auto max-w-full">
          <input
            type="text"
            value={currentClip.title}
            onChange={(e) => updateClip(currentClip.id, { title: e.target.value })}
            className="text-body-sm font-bold text-ink-primary bg-transparent hover:bg-surface-inset px-2 py-0.5 rounded border border-transparent hover:border-border-subtle focus:border-accent focus:bg-white transition-colors"
          />

          <div className="h-4 w-[1px] bg-border-subtle" />

          <div className="flex items-center gap-1">
          </div>

          <div className="flex items-center gap-1.5 text-micro text-ink-muted font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block"></span>
            <span>Save changes with “Save draft”</span>
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
            Mark ready
          </Button>

          <Button variant="primary" size="sm" onClick={handleExportClip} isLoading={exporting} icon={Download} disabled={!currentAsset || !currentClip.assetId}>
            Export video
          </Button>
        </div>
      </div>
      {draftError && (
        <div role="alert" className="px-4 py-2 bg-rose-50 text-rose-700 text-xs border-b border-rose-200">
          {draftError}
        </div>
      )}
      {draftSaved && <div role="status" className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs border-b border-emerald-200">A draft version was saved to this project.</div>}
      {exportError && <div role="alert" className="px-4 py-2 bg-rose-50 text-rose-700 text-xs border-b border-rose-200">{exportError}</div>}

      {/* 2. MAIN WORKSPACE (Left Media, Center Preview, Right Inspector) */}
      <div className="flex-1 flex min-h-0 overflow-y-auto md:overflow-hidden flex-col md:flex-row">
        {/* LEFT PANEL: Media & Captions (280px) */}
        <div className="w-full md:w-[280px] max-h-36 md:max-h-none bg-white border-b md:border-b-0 md:border-r border-border-subtle flex flex-col shrink-0">
          <div className="border-b border-border-subtle px-4 py-3 text-xs font-semibold text-ink-primary">Draft clips</div>
          <div className="p-3 overflow-y-auto flex-1 space-y-2">
            {projectClips.map((clip) => {
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
                    {clip.potentialScore > 0 && <Badge variant="score" size="sm">{clip.potentialScore}%</Badge>}
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
        <div className="flex-1 min-h-[320px] bg-backdrop flex flex-col items-center justify-center p-4 relative min-w-0">
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
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
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
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR PANEL (300px) */}
        <div className="w-full md:w-[300px] max-h-[360px] md:max-h-none bg-white border-t md:border-t-0 md:border-l border-border-subtle p-4 space-y-4 overflow-y-auto shrink-0">
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

          <Button variant="soft" onClick={generateContent} isLoading={generatingContent} icon={Sparkles} className="w-full">
            Generate hooks and captions
          </Button>
          {contentError && <p role="alert" className="text-xs text-rose-700">{contentError}</p>}

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
            <label className="flex items-center gap-1 text-[11px] text-ink-muted font-semibold">
              Start
              <input aria-label="Clip start time in seconds" type="number" min="0" max={Math.max(0, (currentAsset?.duration || currentClip.endTime) - 1)} step="0.1" value={currentClip.startTime} onChange={(event) => updateClipTimestamps(currentClip.id, event.target.value, currentClip.endTime)} className="w-20 rounded border border-border-subtle px-1.5 py-1 font-mono text-ink-primary" />
            </label>
            <label className="flex items-center gap-1 text-[11px] text-ink-muted font-semibold">
              End
              <input aria-label="Clip end time in seconds" type="number" min={currentClip.startTime + 1} max={currentAsset?.duration || currentClip.endTime} step="0.1" value={currentClip.endTime} onChange={(event) => updateClipTimestamps(currentClip.id, currentClip.startTime, event.target.value)} className="w-20 rounded border border-border-subtle px-1.5 py-1 font-mono text-ink-primary" />
            </label>
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

function readableError(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return error.message || fallback;
}
