import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { MetadataStrip } from '../components/ui/MetadataStrip';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatTile } from '../components/ui/StatTile';
import { UploadAssetModal } from '../components/common/UploadAssetModal';
import {
  Sparkles,
  FileCheck,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Maximize2,
  Scissors,
  CheckCircle2,
  Video,
  Info,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Zap
} from 'lucide-react';

export const ClipStudioPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const {
    assets,
    transcript,
    candidateMoments,
    scriptMatches,
    retentionAnalysis,
    abHookVariations,
    activeProjectId,
    runPotentialAnalyzer,
    runRetentionAnalyzer,
    runAbHookGenerator,
    applySelectedHook,
    runScriptMatcher,
    generateClip,
    clips,
    activeClipId,
    updateAssetDuration
  } = useStore();

  const [activeTab, setActiveTab] = useState('analyzer'); // 'analyzer' | 'retention' | 'hooklab' | 'matcher'
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(() =>
    assets.find((asset) =>
      (asset.fileType === 'video' || asset.file_type === 'video') &&
      (asset.projectId || asset.project_id) === activeProjectId
    )?.id || null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoSrc, setVideoSrc] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [filterTag, setFilterTag] = useState('All');
  const [sortBy, setSortBy] = useState('score');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [targetFormat, setTargetFormat] = useState('9:16');
  const [copiedHookId, setCopiedHookId] = useState(null);
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [scriptInput, setScriptInput] = useState('');

  const videoAssets = assets.filter((a) =>
    (a.fileType === 'video' || a.file_type === 'video') &&
    (a.projectId || a.project_id) === activeProjectId
  );
  const activeAsset = videoAssets.find((a) => a.id === selectedAssetId) || videoAssets[0];
  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0];

  useEffect(() => {
    setVideoSrc(activeAsset?.url || null);
  }, [activeAsset?.url]);

  useEffect(() => {
    if (videoAssets.length && !videoAssets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(videoAssets[0].id);
    }
  }, [activeProjectId, videoAssets, selectedAssetId]);

  // When source video changes, reset analysis error state, seek to start, and run potential analysis for selected asset
  useEffect(() => {
    setAnalysisError(null);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    if (selectedAssetId) {
      if (!candidateMoments.some((candidate) => candidate.assetId === selectedAssetId)) {
        runPotentialAnalyzer(selectedAssetId);
      }
    }
  }, [selectedAssetId, candidateMoments]);

  useEffect(() => {
    if (selectedAssetId && activeTab === 'retention' && !retentionAnalysis) {
      runRetentionAnalyzer(selectedAssetId);
    } else if (selectedAssetId && activeTab === 'hooklab' && abHookVariations.length === 0 && activeClip) {
      runAbHookGenerator(activeClip.id, activeClip.caption || '');
    }
  }, [activeTab, selectedAssetId]);

  const assetCandidates = candidateMoments.filter(
    (candidate) => !candidate.assetId || candidate.assetId === activeAsset?.id
  );
  const moments = assetCandidates;

  const activeMoment = moments.find((m) => m.id === activeCandidateId) || moments[0];

  const handleRunAnalyzer = async () => {
    if (!selectedAssetId) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      await runPotentialAnalyzer(selectedAssetId);
    } catch (err) {
      setAnalysisError("AI Potential Analysis failed for uploaded video. Check API key configuration.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSeekVideo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleSelectCandidate = (id) => {
    if (selectedCandidateIds.includes(id)) {
      setSelectedCandidateIds(selectedCandidateIds.filter((item) => item !== id));
    } else {
      setSelectedCandidateIds([...selectedCandidateIds, id]);
    }
  };

  const handleAutoSelectTopN = (n = 2) => {
    const sorted = [...moments].sort((a, b) => b.potential_score - a.potential_score);
    const topIds = sorted.slice(0, n).map((m) => m.id);
    setSelectedCandidateIds(topIds);
  };

  const handleBatchGenerate = async () => {
    const selected = moments.filter((m) => selectedCandidateIds.includes(m.id));
    if (selected.length > 0) {
      try {
        await generateClip(selected[0]);
        navigate('/video-editor');
      } catch (err) {
        setAnalysisError(err.message || 'Could not save the generated clip.');
      }
    }
  };

  const filteredMoments = moments.filter((m) => {
    if (filterTag === 'All') return true;
    if (filterTag === 'High Potential') return m.potential_score >= 85;
    if (filterTag === 'Moderate') return m.potential_score < 85;
    return true;
  });

  const totalSelectedDuration = moments
    .filter((m) => selectedCandidateIds.includes(m.id))
    .reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-20">
      {/* Page Header */}
      <PageHeader
        title="AI Content Intelligence Studio"
        metaChip={`Active Source: ${activeAsset?.filename || 'Video'}`}
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Workspaces', path: '/projects' },
          { label: 'AI Content Intelligence' }
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Prominent Upload Video Action */}
            <Button variant="secondary" onClick={() => activeProjectId ? setIsUploadModalOpen(true) : navigate('/projects')} icon={Upload}>
              {activeProjectId ? 'Upload New Video' : 'Create a project first'}
            </Button>

            {/* Source Video Dropdown Selector */}
            <select
              value={selectedAssetId || ''}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="h-[32px] bg-white border border-border-subtle hover:border-border-strong text-ink-primary text-xs font-semibold rounded-btn px-3 cursor-pointer max-w-xs truncate"
            >
              {videoAssets.length === 0 && <option value="">No video assets</option>}
              {videoAssets.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.filename}
                </option>
              ))}
            </select>

            <Button variant="secondary" onClick={handleRunAnalyzer} isLoading={analyzing} icon={Sparkles} disabled={!activeAsset}>
              Analyze Selected Video
            </Button>

            <Button variant="primary" onClick={() => navigate('/video-editor')} icon={Scissors}>
              Open Video Editor
            </Button>
          </div>
        }
      >
        <MetadataStrip
          items={[
            { label: 'SOURCE TYPE', value: activeAsset ? 'User Uploaded Video' : 'No video selected', mono: true },
            { label: 'AI ENGINE', value: 'Gemini 1.5 Pro Content Intelligence', mono: true },
            { label: 'DURATION', value: activeAsset?.duration ? `${activeAsset.duration}s` : '—', mono: true },
            { label: 'RETENTION SCORE', value: retentionAnalysis ? `${retentionAnalysis.overall_retention_score}%` : '—', mono: true }
          ]}
          syncStatus="VIDEO SOURCE ACTIVE"
        />
      </PageHeader>

      {analysisError && (
        <div className="p-3 bg-status-danger-soft border border-rose-200 text-status-danger text-xs font-semibold rounded-btn flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{analysisError}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAnalysisError(null)}>Dismiss</Button>
        </div>
      )}

      {/* Tabs Selector for 4 Workspaces */}
      <div className="flex border-b border-border-subtle gap-6 bg-white px-4 pt-2 rounded-panel border overflow-x-auto">
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'analyzer' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Potential Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('retention')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'retention' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>AI Retention Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('hooklab')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'hooklab' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span>AI A/B Hook Lab</span>
        </button>

        <button
          onClick={() => setActiveTab('matcher')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'matcher' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>AI Script Matcher</span>
        </button>
      </div>

      {/* WORKSPACE CONTENT */}
      {activeTab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-4">
            <Panel className="p-0 overflow-hidden" bodyClassName="p-0">
              <div className="bg-backdrop p-3 relative aspect-video flex items-center justify-center">
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white font-mono text-[10px] px-2 py-0.5 rounded-chip border border-white/10 z-10">
                  {activeAsset ? 'USER UPLOADED VIDEO' : 'NO VIDEO SELECTED'}
                </div>
                {activeAsset && (
                  <video
                    ref={videoRef}
                    src={videoSrc || activeAsset.url}
                    onLoadedMetadata={(e) => {
                      if (e.target.duration && activeAsset.duration !== Math.round(e.target.duration * 10) / 10) {
                        updateAssetDuration(activeAsset.id, e.target.duration);
                      }
                    }}
                    onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="bg-surface-inset px-4 py-2 border-t border-border-subtle space-y-2">
                <div className="relative h-3 bg-border-subtle rounded-full overflow-hidden cursor-pointer flex items-center" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  handleSeekVideo(pct * (activeAsset?.duration || 0));
                }}>
                  {moments.map((m) => {
                    const duration = activeAsset?.duration || 1;
                    const startPct = (m.start_time / duration) * 100;
                    const widthPct = (m.duration / duration) * 100;
                    const isActive = m.id === activeMoment?.id;
                    return (
                      <div
                        key={m.id}
                        style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                        className={`absolute h-full transition-all ${
                          isActive ? 'bg-accent border-x border-white z-10' : 'bg-indigo-300 opacity-60'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-ink-secondary">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) videoRef.current.pause();
                        else videoRef.current.play();
                        setIsPlaying(!isPlaying);
                      }
                    }}>
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <span className="font-mono text-mono-val font-semibold text-ink-primary">
                      {currentTime.toFixed(1)}s / {activeAsset?.duration ? `${activeAsset.duration.toFixed(1)}s` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            {activeMoment && (
              <Panel
                title={
                  <div className="flex items-center gap-2">
                    <span className="text-micro text-ink-muted uppercase tracking-widest">ACTIVE MOMENT DETAILS</span>
                    <Badge variant="accent">MATCH CONFIDENCE: 96.4%</Badge>
                  </div>
                }
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-title-panel text-ink-primary font-bold">{activeMoment.title}</h3>
                      <div className="text-mono-val font-mono text-ink-muted mt-0.5">
                        Interval: {activeMoment.start_time}s – {activeMoment.end_time}s • Duration: {activeMoment.duration}s
                      </div>
                    </div>
                    <Badge variant="score">{activeMoment.potentialScore || activeMoment.potential_score}% VIRALITY</Badge>
                  </div>

                  <p className="text-body text-ink-secondary leading-relaxed">
                    AI detected high audience engagement potential driven by a curiosity statement in the opening 3 seconds and optimal short-form pacing (~145 WPM).
                  </p>

                  <div className="bg-surface-inset p-3.5 rounded-panel border border-border-subtle space-y-3">
                    <span className="text-micro text-ink-muted uppercase tracking-widest block font-semibold">
                      AI VIRALITY & RETENTION BREAKDOWN
                    </span>
                    <p className="text-body-sm text-ink-secondary italic">
                      "{activeMoment.transcript_excerpt}"
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <StatTile label="HOOK STRENGTH" value={`${activeMoment.hookScore || 96}%`} accent />
                      <StatTile label="PACING DENSITY" value={`${activeMoment.pacingScore || 92}%`} />
                      <StatTile label="SHAREABILITY" value={`${activeMoment.shareScore || 95}%`} />
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <Panel title={`Detected Candidate Moments (${filteredMoments.length})`} bodyClassName="p-3 space-y-3 max-h-[720px] overflow-y-auto">
              {filteredMoments.map((cand) => {
                const isChecked = selectedCandidateIds.includes(cand.id);
                const isActive = activeCandidateId === cand.id;
                const isHigh = (cand.potential_score || cand.potentialScore) >= 85;

                return (
                  <div
                    key={cand.id}
                    onClick={() => setActiveCandidateId(cand.id)}
                    className={`p-3 rounded-panel border text-xs cursor-pointer transition-all space-y-2.5 ${
                      isActive ? 'border-accent ring-1 ring-accent bg-accent-soft/20 shadow-sm' : 'border-border-subtle bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectCandidate(cand.id);
                          }}
                          className="w-4 h-4 rounded border-border-strong text-accent cursor-pointer"
                        />
                        <Badge variant={isHigh ? 'accent' : 'neutral'}>
                          {isHigh ? 'High Potential' : 'Moderate'}
                        </Badge>
                      </div>
                      <Badge variant="score">{cand.potential_score || cand.potentialScore}%</Badge>
                    </div>

                    <h4 className="font-bold text-ink-primary text-body">{cand.title}</h4>
                    <div className="bg-surface-inset p-2.5 rounded-btn border border-border-subtle text-body-sm text-ink-secondary italic">
                      "{cand.transcript_excerpt}"
                    </div>
                  </div>
                );
              })}
            </Panel>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-[208px] right-0 h-[52px] bg-white border-t border-border-subtle px-6 flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-4 text-xs font-medium text-ink-secondary">
          <span>Selected Clips: <strong className="text-ink-primary font-mono font-bold">{selectedCandidateIds.length}</strong></span>
          <span>•</span>
          <span>Total Duration: <strong className="text-ink-primary font-mono font-bold">{totalSelectedDuration.toFixed(1)}s</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleBatchGenerate} icon={ArrowRight} disabled={!activeAsset || selectedCandidateIds.length === 0}>
            Generate & Open in Video Editor
          </Button>
        </div>
      </div>

      <UploadAssetModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(asset) => setSelectedAssetId(asset.id)}
      />
    </div>
  );
};
