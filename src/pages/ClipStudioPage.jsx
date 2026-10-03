import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { MetadataStrip } from '../components/ui/MetadataStrip';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { StatTile } from '../components/ui/StatTile';
import { Select } from '../components/ui/Select';
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
  SlidersHorizontal,
  ChevronRight,
  Video,
  Info,
  Check,
  ArrowRight
} from 'lucide-react';

export const ClipStudioPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const {
    assets,
    transcript,
    candidateMoments,
    scriptMatches,
    runPotentialAnalyzer,
    runScriptMatcher,
    generateClip,
    activeProjectId
  } = useStore();

  const [activeTab, setActiveTab] = useState('analyzer'); // 'analyzer' | 'matcher'
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('asset_v1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [filterTag, setFilterTag] = useState('All');
  const [sortBy, setSortBy] = useState('score');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(['cand_1']);
  const [activeCandidateId, setActiveCandidateId] = useState('cand_1');
  const [targetFormat, setTargetFormat] = useState('9:16');
  const [scriptInput, setScriptInput] = useState(
    "Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.\n\n" +
    "If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram."
  );

  const videoAssets = assets.filter((a) => a.fileType === 'video');
  const activeAsset = videoAssets.find((a) => a.id === selectedAssetId) || videoAssets[0];

  // Raw or fallback candidate moments
  const moments = candidateMoments.length > 0 ? candidateMoments : [
    {
      id: 'cand_1',
      title: 'The #1 AI Creator Mistake',
      start_time: 12.5,
      end_time: 35.0,
      duration: 22.5,
      transcript_excerpt: 'Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.',
      potential_score: 94.5,
      rating_label: 'High Potential',
      suggested_hook: 'Most creators make one huge mistake when starting with AI...',
      reasons: ['Strong curiosity hook', 'Optimal pacing (145 WPM)', 'Self-contained 22.5s window'],
      hookScore: 96,
      pacingScore: 92,
      shareScore: 95
    },
    {
      id: 'cand_2',
      title: '3-Second Hook Retention Secret',
      start_time: 95.0,
      end_time: 128.0,
      duration: 33.0,
      transcript_excerpt: 'If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram.',
      potential_score: 89.2,
      rating_label: 'High Potential',
      suggested_hook: 'If you master hook generation in the first 3 seconds...',
      reasons: ['Direct takeaway', 'High retention topic', 'Optimal 33s duration'],
      hookScore: 90,
      pacingScore: 88,
      shareScore: 89
    },
    {
      id: 'cand_3',
      title: 'Step-by-Step AI Video Workflow',
      start_time: 62.0,
      end_time: 95.0,
      duration: 33.0,
      transcript_excerpt: 'Here is the exact step-by-step workflow: first analyze long-form video transcript, identify key emotional peaks, and cut vertical 9:16 clips.',
      potential_score: 82.0,
      rating_label: 'Moderate Potential',
      suggested_hook: 'Here is the exact step-by-step workflow for creators...',
      reasons: ['Structured list format', 'High utility', 'Pacing ~160 WPM'],
      hookScore: 80,
      pacingScore: 84,
      shareScore: 82
    }
  ];

  const activeMoment = moments.find((m) => m.id === activeCandidateId) || moments[0];

  const handleRunAnalyzer = async () => {
    setAnalyzing(true);
    await runPotentialAnalyzer(selectedAssetId);
    setAnalyzing(false);
  };

  const handleRunMatcher = async () => {
    setAnalyzing(true);
    await runScriptMatcher(selectedAssetId, scriptInput);
    setAnalyzing(false);
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

  const handleBatchGenerate = () => {
    const selected = moments.filter((m) => selectedCandidateIds.includes(m.id));
    if (selected.length > 0) {
      const clip = generateClip(selected[0]);
      navigate('/video-editor');
    }
  };

  // Filter moments
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
        title="AI Potential Analyzer & Script Studio"
        metaChip={`Source: ${activeAsset?.filename || 'Kolkata_Tech_Talk.mp4'}`}
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Workspaces', path: '/projects' },
          { label: 'AI Potential Analyzer' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="h-[32px] bg-white border border-border-subtle hover:border-border-strong text-ink-primary text-xs font-semibold rounded-btn px-3 cursor-pointer"
            >
              {videoAssets.map((v) => (
                <option key={v.id} value={v.id}>
                  Source: {v.filename}
                </option>
              ))}
            </select>

            <Button variant="secondary" onClick={handleRunAnalyzer} isLoading={analyzing} icon={Sparkles}>
              Re-run Analysis
            </Button>

            <Button variant="primary" onClick={handleBatchGenerate} icon={Scissors}>
              Generate Selected Clips ({selectedCandidateIds.length})
            </Button>
          </div>
        }
      >
        <MetadataStrip
          items={[
            { label: 'MODEL', value: 'Gemini 1.5 Pro (NLP Engine)', mono: true },
            { label: 'DURATION', value: `${activeAsset?.duration || 160.0}s`, mono: true },
            { label: 'DETECTIONS', value: `${moments.length} Moments Detected`, mono: true },
            { label: 'ESTIMATED ACCURACY', value: 'High Confidence (94.5%)', mono: true }
          ]}
          syncStatus="ANALYZED & SYNCED"
        />
      </PageHeader>

      {/* Tabs Selector for Analyzer vs Script Matcher */}
      <div className="flex border-b border-border-subtle gap-6 bg-white px-4 pt-2 rounded-panel border">
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'analyzer' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Potential Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('matcher')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'matcher' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>AI Script-to-Video Matcher</span>
        </button>
      </div>

      {activeTab === 'analyzer' ? (
        /* ======================================================== */
        /* TWO COLUMN WORKSPACE (62% Left / 38% Right)             */
        /* ======================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* LEFT COLUMN (62% -> 7 Cols in 12-grid) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Video Player Panel */}
            <Panel className="p-0 overflow-hidden" bodyClassName="p-0">
              <div className="bg-backdrop p-3 relative aspect-video flex items-center justify-center">
                {/* Mono Overlay Labels */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white font-mono text-[10px] px-2 py-0.5 rounded-chip border border-white/10 z-10">
                  SCENE: {activeMoment?.title || 'Segment #1'}
                </div>
                <div className="absolute top-3 right-3 bg-accent text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-chip z-10">
                  CANVAS: {targetFormat}
                </div>

                <video
                  ref={videoRef}
                  src={activeAsset?.url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                  onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Scrubber & Moment Highlights Bar */}
              <div className="bg-surface-inset px-4 py-2 border-t border-border-subtle space-y-2">
                <div className="relative h-3 bg-border-subtle rounded-full overflow-hidden cursor-pointer flex items-center" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  handleSeekVideo(pct * (activeAsset?.duration || 160.0));
                }}>
                  {/* Highlight Detected Moments on Scrubber Track */}
                  {moments.map((m) => {
                    const startPct = (m.start_time / (activeAsset?.duration || 160.0)) * 100;
                    const widthPct = (m.duration / (activeAsset?.duration || 160.0)) * 100;
                    const isActive = m.id === activeMoment?.id;
                    return (
                      <div
                        key={m.id}
                        style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                        className={`absolute h-full transition-all ${
                          isActive ? 'bg-accent border-x border-white z-10' : 'bg-indigo-300 opacity-60'
                        }`}
                        title={`${m.title} (${m.start_time}s - ${m.end_time}s)`}
                      />
                    );
                  })}
                </div>

                {/* Video Transport Controls */}
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

                    <Button variant="ghost" size="sm" onClick={() => handleSeekVideo(Math.max(0, currentTime - 5))}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>

                    <span className="font-mono text-mono-val font-semibold text-ink-primary">
                      {currentTime.toFixed(1)}s / {(activeAsset?.duration || 160.0).toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-mono-val">
                    <span className="bg-white px-2 py-0.5 rounded border border-border-subtle text-ink-muted">1.0x Speed</span>
                    <Volume2 className="w-3.5 h-3.5 text-ink-muted" />
                    <Maximize2 className="w-3.5 h-3.5 text-ink-muted" />
                  </div>
                </div>
              </div>
            </Panel>

            {/* 2. Active Moment Panel */}
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

                  {/* Virality Breakdown Inset Box */}
                  <div className="bg-surface-inset p-3.5 rounded-panel border border-border-subtle space-y-3">
                    <span className="text-micro text-ink-muted uppercase tracking-widest block font-semibold">
                      AI VIRALITY & RETENTION BREAKDOWN
                    </span>
                    <p className="text-body-sm text-ink-secondary italic">
                      "{activeMoment.transcript_excerpt}"
                    </p>

                    {/* 3 Equal Stat Tiles */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <StatTile label="HOOK STRENGTH" value={`${activeMoment.hookScore || 96}%`} accent />
                      <StatTile label="PACING DENSITY" value={`${activeMoment.pacingScore || 92}%`} />
                      <StatTile label="SHAREABILITY" value={`${activeMoment.shareScore || 95}%`} />
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {/* 3. Detection Filter Panel */}
            <Panel
              title={
                <div className="flex items-center justify-between w-full">
                  <span className="text-micro text-ink-muted uppercase tracking-widest">DETECTION FILTER & PRESETS</span>
                  <span className="text-mono-val font-mono text-ink-muted">PRESET: SHORT-FORM VIRALITY (15-60S)</span>
                </div>
              }
            >
              <div className="flex items-center gap-2 flex-wrap">
                {['All', 'High Potential', 'Moderate', 'Curiosity Hooks', 'Takeaway Peaks'].map((tag) => {
                  const isSelected = filterTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={`h-[24px] px-3 rounded-chip text-[11px] font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-white text-ink-secondary border border-border-subtle hover:border-border-strong'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* RIGHT COLUMN (38% -> 5 Cols in 12-grid) */}
          <div className="lg:col-span-5 space-y-4">
            <Panel
              title={`Detected Candidate Moments (${filteredMoments.length})`}
              action={
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-[28px] bg-white border border-border-subtle text-ink-secondary text-[11px] font-medium rounded-btn px-2 cursor-pointer"
                  >
                    <option value="score">Sort by: Score</option>
                    <option value="duration">Sort by: Duration</option>
                  </select>
                  <Button variant="secondary" size="sm" onClick={() => handleAutoSelectTopN(2)}>
                    Auto-select Top 2
                  </Button>
                </div>
              }
              bodyClassName="p-3 space-y-3 max-h-[720px] overflow-y-auto"
            >
              {filteredMoments.map((cand) => {
                const isChecked = selectedCandidateIds.includes(cand.id);
                const isActive = activeCandidateId === cand.id;
                const isHigh = (cand.potential_score || cand.potentialScore) >= 85;

                return (
                  <div
                    key={cand.id}
                    onClick={() => setActiveCandidateId(cand.id)}
                    className={`p-3 rounded-panel border text-xs cursor-pointer transition-all space-y-2.5 ${
                      isActive
                        ? 'border-accent ring-1 ring-accent bg-accent-soft/20 shadow-sm'
                        : isChecked
                        ? 'border-indigo-300 bg-white'
                        : 'border-border-subtle hover:border-border-strong bg-white'
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
                          className="w-4 h-4 rounded border-border-strong text-accent focus:ring-accent cursor-pointer"
                        />
                        <Badge variant={isHigh ? 'accent' : 'neutral'}>
                          {isHigh ? 'High Potential' : 'Moderate'}
                        </Badge>
                        <span className="font-mono text-mono-val text-ink-muted">
                          {cand.start_time}s – {cand.end_time}s ({cand.duration}s)
                        </span>
                      </div>

                      <Badge variant="score">
                        {cand.potential_score || cand.potentialScore}%
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-ink-primary text-body leading-snug">{cand.title}</h4>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleSeekVideo(cand.start_time);
                      }}>
                        <Play className="w-3.5 h-3.5 text-accent" />
                      </Button>
                    </div>

                    <div className="bg-surface-inset p-2.5 rounded-btn border border-border-subtle text-body-sm text-ink-secondary italic">
                      "{cand.transcript_excerpt}"
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {cand.reasons.map((r, idx) => (
                          <span key={idx} className="text-[10px] text-ink-muted bg-white px-1.5 py-0.5 rounded border border-border-subtle">
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono font-semibold text-status-success shrink-0">
                        Virality: High
                      </span>
                    </div>
                  </div>
                );
              })}
            </Panel>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* SCRIPT MATCHER WORKSPACE                                 */
        /* ======================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <Panel title="Target Script Paragraphs" subtitle="Paste script text to align with video transcript">
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={scriptInput}
                  onChange={(e) => setScriptInput(e.target.value)}
                  className="w-full bg-surface-inset border border-border-subtle rounded-btn p-3 text-xs text-ink-primary font-mono focus:outline-none focus:border-accent"
                />
                <Button variant="primary" onClick={handleRunMatcher} isLoading={analyzing} icon={Sparkles} className="w-full">
                  Match Script Paragraphs
                </Button>
              </div>
            </Panel>
          </div>

          <div className="lg:col-span-6">
            <Panel title="Matched Script & Video Segments">
              <div className="space-y-3">
                {scriptMatches.map((match) => (
                  <div key={match.id} className="p-3.5 rounded-panel border border-border-subtle bg-white space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-mono-val font-bold text-accent">
                        Timestamp: {match.start_time}s – {match.end_time}s
                      </span>
                      <Badge variant="success">{match.confidence_score}% Match</Badge>
                    </div>

                    <p className="text-ink-secondary">{match.script_section}</p>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                      <Button variant="secondary" size="sm" onClick={() => handleSeekVideo(match.start_time)} icon={Play}>
                        Seek Player
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => {
                        generateClip({
                          title: match.script_section.slice(0, 30) + '...',
                          start_time: match.start_time,
                          end_time: match.end_time,
                          potential_score: match.confidence_score
                        });
                        navigate('/video-editor');
                      }}>
                        Edit Clip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-[208px] right-0 h-[52px] bg-white border-t border-border-subtle px-6 flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-4 text-xs font-medium text-ink-secondary">
          <span>
            Selected Clips: <strong className="text-ink-primary font-mono font-bold">{selectedCandidateIds.length}</strong>
          </span>
          <span>•</span>
          <span>
            Total Duration: <strong className="text-ink-primary font-mono font-bold">{totalSelectedDuration.toFixed(1)}s</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-ink-muted">Format:</span>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="h-[28px] bg-surface-inset border border-border-subtle text-ink-primary text-xs font-semibold rounded-btn px-2 cursor-pointer"
            >
              <option value="9:16">9:16 Vertical (Reels / Shorts)</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="1:1">1:1 Square</option>
            </select>
          </div>

          <Button variant="primary" onClick={handleBatchGenerate} icon={ArrowRight}>
            Generate & Open in Video Editor
          </Button>
        </div>
      </div>
    </div>
  );
};
