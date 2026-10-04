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
    draftVersions,
    editorUnsavedChanges,
    setEditorUnsavedChanges,
    setEditorSavingDraft,
    editorSavedClip,
    setEditorSavedClip,
    discardEditorChanges
  } = useStore();

  const projectClips = clips.filter((clip) => clip.projectId === activeProjectId);
  const currentClip = projectClips.find((clip) => clip.id === activeClipId) || projectClips[0];
  const currentAsset = assets.find((a) => a.id === currentClip?.assetId);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoSrc, setVideoSrc] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram_reels');
  const [previewError, setPreviewError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [draftHistoryLoading, setDraftHistoryLoading] = useState(false);
  const [draftHistoryError, setDraftHistoryError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [exportError, setExportError] = useState('');
  const [generatingContent, setGeneratingContent] = useState(false);
  const [contentError, setContentError] = useState('');
  const currentClipSnapshot = currentClip ? getDraftSnapshot(currentClip) : null;
  const savedClipSnapshot = editorSavedClip ? getDraftSnapshot(editorSavedClip) : null;

  useEffect(() => {
    if (!currentClip) return;
    if (!editorSavedClip || editorSavedClip.id !== currentClip.id) {
      setEditorSavedClip(currentClip);
      setEditorUnsavedChanges(false);
      return;
    }
    setEditorUnsavedChanges(savedClipSnapshot !== currentClipSnapshot);
  }, [currentClip?.id, currentClipSnapshot, editorSavedClip?.id, savedClipSnapshot, setEditorSavedClip, setEditorUnsavedChanges]);

  useEffect(() => {
    setVideoSrc(currentAsset?.url || null);
    setPreviewError('');
  }, [currentAsset?.url]);

  useEffect(() => {
    if (!currentClip) return undefined;
    let cancelled = false;
    setDraftHistoryLoading(true);
    setDraftHistoryError('');
    loadDraftVersions(currentClip.id)
      .catch((error) => {
        if (!cancelled) setDraftHistoryError(readableError(error, 'Draft history could not be loaded.'));
      })
      .finally(() => {
        if (!cancelled) setDraftHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentClip?.id]);

  const retryDraftHistory = () => {
    if (!currentClip || draftHistoryLoading) return;
    setDraftHistoryLoading(true);
    setDraftHistoryError('');
    loadDraftVersions(currentClip.id)
      .catch((error) => setDraftHistoryError(readableError(error, 'Draft history could not be loaded.')))
      .finally(() => setDraftHistoryLoading(false));
  };

  useEffect(() => {
    if (videoRef.current && currentClip) {
      videoRef.current.currentTime = currentClip.startTime;
      setCurrentTime(currentClip.startTime);
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
          setPreviewError('This video could not be played. Check that the source file is still available.');
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
    setEditorSavingDraft(true);
    setDraftSaved(false);
    setDraftError('');
    try {
      const draft = await saveDraft(currentClip.id);
      setEditorUnsavedChanges(getDraftSnapshot(draft.payload) !== getDraftSnapshot(useStore.getState().clips.find((clip) => clip.id === currentClip.id)));
      setDraftSaved(true);
    } catch (error) {
      setDraftError(readableError(error, 'Draft could not be saved.'));
    } finally {
      setSavingDraft(false);
      setEditorSavingDraft(false);
    }
  };

  const handleRestoreDraft = (event) => {
    const version = Number(event.target.value);
    const draft = draftVersions.find((item) => item.version === version);
    if (draft) restoreDraftVersion(draft);
  };

  const handleSelectClip = (clipId) => {
    if (savingDraft) return;
    if (clipId === currentClip.id) return;
    if (editorUnsavedChanges && !window.confirm('You have unsaved editor changes. Switch clips without saving them?')) return;
    if (editorUnsavedChanges) discardEditorChanges();
    setActiveClip(clipId);
  };

  const handleSaveToPlanner = async () => {
    if (!currentClip || savingStatus) return;
    setSavingStatus(true);
    setStatusError('');
    try {
      await moveClipStatus(currentClip.id, 'Ready for Review');
      navigate('/planner');
    } catch (error) {
      setStatusError(readableError(error, 'Could not mark this clip ready. Try again.'));
    } finally {
      setSavingStatus(false);
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
            aria-label="Draft title"
            type="text"
            value={currentClip.title}
            onChange={(e) => updateClip(currentClip.id, { title: e.target.value })}
            className="text-body-sm font-bold text-ink-primary bg-transparent hover:bg-surface-inset px-2 py-0.5 rounded border border-transparent hover:border-border-subtle focus:border-accent focus:bg-white transition-colors"
          />

          <div className="h-4 w-[1px] bg-border-subtle" />

          <div className="flex items-center gap-1">
          </div>

          <div className="flex items-center gap-1.5 text-micro text-ink-muted font-semibold" role="status" aria-live="polite">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${editorUnsavedChanges ? 'bg-amber-500' : 'bg-status-success'}`}></span>
            <span>{savingDraft ? "Saving draft…" : editorUnsavedChanges ? "Unsaved changes" : "Draft is up to date"}</span>
          </div>
        </div>

        {/* Aspect Ratio & Zoom Selector */}
        <div className="flex items-center gap-3">
          <select
            aria-label="Saved draft versions"
            defaultValue=""
            onChange={handleRestoreDraft}
            disabled={draftHistoryLoading || Boolean(draftHistoryError)}
            className="h-7 max-w-36 bg-white border border-border-subtle text-xs rounded-btn px-2"
          >
            <option value="">{draftHistoryLoading ? 'Loading drafts…' : draftHistoryError ? 'Draft history unavailable' : 'Draft history'}</option>
            {draftVersions.map((draft) => (
              <option key={draft.id} value={draft.version}>Version {draft.version}</option>
            ))}
          </select>
          {draftHistoryError && <button type="button" className="text-xs font-semibold text-accent underline" onClick={retryDraftHistory}>Retry</button>}
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
                  type="button"
                  aria-label={item.label}
                  aria-pressed={isSelected}
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
          <Button variant="secondary" size="sm" onClick={handleSaveToPlanner} isLoading={savingStatus} icon={Calendar}>
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
      {statusError && <div role="alert" className="px-4 py-2 bg-rose-50 text-rose-700 text-xs border-b border-rose-200">{statusError}</div>}
      {draftSaved && !editorUnsavedChanges && <div role="status" className="px-4 py-2 bg-emerald-50 text-emerald-800 text-xs border-b border-emerald-200">A draft version was saved to this project.</div>}
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
                <button
                  key={clip.id}
                  type="button"
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => handleSelectClip(clip.id)}
                  className={`w-full text-left p-2.5 rounded-panel border text-xs cursor-pointer transition-all space-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
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
                </button>
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
                  onError={() => setPreviewError('Preview unavailable. The source video may have moved or the format may not play in this browser.')}
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
              {!currentAsset && <p className="absolute px-4 text-center text-sm text-white">Source video is unavailable for this clip.</p>}
              {previewError && (
                <div className="absolute bottom-2 left-2 right-2 rounded bg-black/80 p-2 text-center text-xs text-white">
                  <p role="alert">{previewError}</p>
                  <button type="button" className="mt-1 font-semibold underline" onClick={() => { setPreviewError(''); videoRef.current?.load(); }}>Retry preview</button>
                </div>
              )}

            </div>
          </div>

          {/* Transport Bar */}
          <div className="h-[40px] bg-slate-900 border border-slate-800 rounded-panel px-4 flex items-center justify-between text-white text-xs gap-4 mt-3 w-full max-w-xl">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" aria-label={isPlaying ? 'Pause preview' : 'Play preview'} onClick={togglePlay} disabled={!currentAsset || Boolean(previewError)} className="text-white hover:bg-slate-800">
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
          {currentAsset && (
            <input
              type="range"
              aria-label="Seek within selected clip"
              min={currentClip.startTime}
              max={currentClip.endTime}
              step="0.1"
              value={Math.min(Math.max(currentTime, currentClip.startTime), currentClip.endTime)}
              onChange={(event) => {
                const nextTime = Number(event.target.value);
                if (videoRef.current) videoRef.current.currentTime = nextTime;
                setCurrentTime(nextTime);
              }}
              className="mt-2 w-full max-w-xl accent-accent"
            />
          )}
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

          <div className="space-y-1.5">
            <label htmlFor="post-caption" className="block text-micro text-ink-muted uppercase tracking-widest font-semibold">Post caption</label>
            <textarea
              id="post-caption"
              value={currentClip.caption || ''}
              onChange={(event) => updateClip(currentClip.id, { caption: event.target.value })}
              rows={4}
              placeholder="Add or edit the caption for your post."
              className="w-full rounded-btn border border-border-subtle bg-white p-2 text-xs text-ink-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="text-[11px] text-ink-muted">This caption is saved with the draft; it is not burned into the exported video.</p>
          </div>

          {/* AI Hooks */}
          <div className="space-y-2">
            <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold">AI Opening Hooks</label>
            <div className="space-y-1.5">
              {currentClip.hooks?.map((h, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-pressed={currentClip.selectedHookIndex === idx}
                  onClick={() => updateClip(currentClip.id, { selectedHookIndex: idx })}
                  className={`p-2 rounded-btn border text-xs cursor-pointer transition-colors ${
                    currentClip.selectedHookIndex === idx
                      ? 'border-accent bg-accent-soft text-accent-text font-semibold'
                      : 'border-border-subtle bg-white hover:border-border-strong text-ink-secondary'
                  }`}
                >
                  {h}
                </button>
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
      <div className="min-h-32 max-h-[220px] bg-white border-t border-border-subtle p-3 flex flex-col shrink-0">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-micro text-ink-muted uppercase tracking-widest font-semibold">CLIP RANGE</span>
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
                style={{ left: `${(currentClip.startTime / (currentAsset?.duration || currentClip.endTime)) * 100}%`, width: `${(currentClip.duration / (currentAsset?.duration || currentClip.endTime)) * 100}%` }}
                className="absolute h-8 bg-accent/20 border-2 border-accent rounded-btn flex items-center justify-between px-2 font-mono text-mono-val text-accent font-bold"
              >
                <span>{currentClip.startTime}s</span>
                <span className="truncate mx-2">{currentClip.title}</span>
                <span>{currentClip.endTime}s</span>
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

function getDraftSnapshot(clip) {
  if (!clip) return null;
  const draftFields = { ...clip };
  delete draftFields.status;
  delete draftFields.exportedUrl;
  delete draftFields.createdAt;
  delete draftFields.updatedAt;
  return JSON.stringify(draftFields);
}
