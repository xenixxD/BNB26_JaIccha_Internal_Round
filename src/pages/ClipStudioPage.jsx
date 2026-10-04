import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { MetadataStrip } from '../components/ui/MetadataStrip';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { UploadAssetModal } from '../components/common/UploadAssetModal';
import {
  Sparkles,
  FileCheck,
  Play,
  Pause,
  Scissors,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Upload,
  Zap,
  Trash2
} from 'lucide-react';

export const ClipStudioPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const {
    assets,
    candidateMoments,
    scriptMatches,
    retentionAnalysis,
    abHookVariations,
    activeProjectId,
    projects,
    deleteProject,
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
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [hooksLoading, setHooksLoading] = useState(false);
  const [hooksForClipId, setHooksForClipId] = useState(null);
  const [scriptInput, setScriptInput] = useState('');
  const [scriptTitle, setScriptTitle] = useState('Script');
  const [scriptLibrary, setScriptLibrary] = useState([]);
  const [selectedScriptVersionId, setSelectedScriptVersionId] = useState('');
  const [scriptLibraryError, setScriptLibraryError] = useState('');
  const [scriptMatching, setScriptMatching] = useState(false);
  const [creatingClipForMatch, setCreatingClipForMatch] = useState(null);
  const [scriptMatchError, setScriptMatchError] = useState('');
  const [deletingProject, setDeletingProject] = useState(false);
  const [creatingClips, setCreatingClips] = useState(false);
  const [projectActionError, setProjectActionError] = useState('');

  const videoAssets = assets.filter((a) =>
    (a.fileType === 'video' || a.file_type === 'video') &&
    (a.projectId || a.project_id) === activeProjectId
  );
  const activeAsset = videoAssets.find((a) => a.id === selectedAssetId) || videoAssets[0];
  const projectClips = clips.filter((clip) => clip.projectId === activeProjectId);
  const activeClip = projectClips.find((clip) => clip.id === activeClipId) || projectClips[0];

  useEffect(() => {
    setVideoSrc(activeAsset?.url || null);
  }, [activeAsset?.url]);

  useEffect(() => {
    if (!activeProjectId || !selectedAssetId) {
      setScriptLibrary([]);
      setSelectedScriptVersionId('');
      setScriptLibraryError('');
      return undefined;
    }
    let cancelled = false;
    api.getProjectScripts(activeProjectId, selectedAssetId)
      .then((scripts) => {
        if (!cancelled) {
          setScriptLibrary(scripts);
          setScriptLibraryError('');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setScriptLibraryError(error.message || 'Could not load saved script versions.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeProjectId, selectedAssetId]);

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
        setAnalyzing(true);
        runPotentialAnalyzer(selectedAssetId)
          .catch((error) => setAnalysisError(readableError(error, 'Could not analyze this footage. Try again.')))
          .finally(() => setAnalyzing(false));
      }
    }
  }, [selectedAssetId, candidateMoments]);

  const handleRetentionAnalysis = async () => {
    if (!selectedAssetId || retentionLoading) return;
    setRetentionLoading(true);
    setAnalysisError(null);
    try {
      await runRetentionAnalyzer(selectedAssetId);
    } catch (error) {
      setAnalysisError(readableError(error, 'Could not estimate pacing. Try again.'));
    } finally {
      setRetentionLoading(false);
    }
  };

  const handleGenerateHooks = async () => {
    if (!activeClip || hooksLoading) return;
    setHooksLoading(true);
    setHooksForClipId(null);
    setAnalysisError(null);
    try {
      await runAbHookGenerator(activeClip.id, activeClip.caption || activeClip.suggestedHook || '');
      setHooksForClipId(activeClip.id);
    } catch (error) {
      setAnalysisError(readableError(error, 'Could not generate hook ideas. Try again.'));
    } finally {
      setHooksLoading(false);
    }
  };

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
      setAnalysisError(readableError(err, 'Could not analyze this footage. Check the server and try again.'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunScriptMatcher = async () => {
    if (!selectedAssetId || !scriptInput.trim()) return;
    setScriptMatching(true);
    setScriptMatchError('');
    try {
      const result = await runScriptMatcher(
        selectedAssetId,
        scriptInput.trim(),
        scriptTitle.trim()
      );
      setSelectedScriptVersionId(result.scriptVersionId);
      setScriptLibrary(await api.getProjectScripts(activeProjectId, selectedAssetId));
    } catch (error) {
      setScriptMatchError(error.message || 'Could not match this script to the selected footage.');
    } finally {
      setScriptMatching(false);
    }
  };

  const handleCreateClipFromMatch = async (match) => {
    setCreatingClipForMatch(match.id);
    setScriptMatchError('');
    try {
      await generateClip({
        ...match,
        assetId: selectedAssetId,
        title: `Script match - section ${match.script_section_index + 1}`,
        transcript_excerpt: match.matched_transcript_excerpt,
      });
      navigate('/video-editor');
    } catch (error) {
      setScriptMatchError(error.message || 'Could not create a clip from this script match.');
    } finally {
      setCreatingClipForMatch(null);
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

  const handleBatchGenerate = async () => {
    const selected = moments.filter((m) => selectedCandidateIds.includes(m.id));
    if (selected.length > 0 && !creatingClips) {
      setCreatingClips(true);
      try {
        for (const candidate of selected) await generateClip(candidate);
        navigate('/video-editor');
      } catch (err) {
        setAnalysisError(err.message || 'Could not save the generated clip.');
      } finally {
        setCreatingClips(false);
      }
    }
  };

  const handleDeleteCurrentProject = async () => {
    const project = projects.find((item) => item.id === activeProjectId);
    if (!project || deletingProject) return;

    const confirmed = window.confirm(
      `Delete project "${project.name}" and all of its assets, clips, saved drafts, analysis results, and generated exports? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingProject(true);
    setProjectActionError('');
    try {
      await deleteProject(project.id);
      if (projects.length <= 1) navigate('/projects');
    } catch (error) {
      setProjectActionError(error.message || 'Could not delete the current project.');
    } finally {
      setDeletingProject(false);
    }
  };

  const filteredMoments = moments;

  const totalSelectedDuration = moments
    .filter((m) => selectedCandidateIds.includes(m.id))
    .reduce((acc, curr) => acc + curr.duration, 0);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-20">
      {/* Page Header */}
      <PageHeader
        title="Find useful moments"
        metaChip={`Active Source: ${activeAsset?.filename || 'Video'}`}
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Workspaces', path: '/projects' },
          { label: 'Find moments' }
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
              Find moments in this video
            </Button>

            <Button variant="primary" onClick={() => navigate('/video-editor')} icon={Scissors}>
              Open drafts
            </Button>

            <Button
              variant="danger"
              onClick={handleDeleteCurrentProject}
              isLoading={deletingProject}
              disabled={!activeProjectId}
              icon={Trash2}
            >
              Delete Current Project
            </Button>
          </div>
        }
      >
        <MetadataStrip
          items={[
            { label: 'SOURCE FOOTAGE', value: activeAsset?.filename || 'No video selected' },
            { label: 'DURATION', value: activeAsset?.duration ? `${activeAsset.duration}s` : 'Not available', mono: true }
          ]}
          syncStatus={activeAsset ? 'SOURCE READY' : 'ADD FOOTAGE'}
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
      {projectActionError && (
        <div role="alert" className="p-3 bg-status-danger-soft border border-rose-200 text-status-danger text-xs font-semibold rounded-btn">
          {projectActionError}
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
          <span>Find moments</span>
        </button>

        <button
          onClick={() => setActiveTab('retention')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'retention' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Review pacing</span>
        </button>

        <button
          onClick={() => setActiveTab('hooklab')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'hooklab' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span>Try openings</span>
        </button>

        <button
          onClick={() => setActiveTab('matcher')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'matcher' ? 'border-accent text-accent' : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Match a script</span>
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
                title="Selected suggestion"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-title-panel text-ink-primary font-bold">{activeMoment.title}</h3>
                      <div className="text-mono-val font-mono text-ink-muted mt-0.5">
                        Interval: {activeMoment.start_time}s – {activeMoment.end_time}s • Duration: {activeMoment.duration}s
                      </div>
                    </div>
                    {(activeMoment.potentialScore ?? activeMoment.potential_score) != null && <Badge variant="score">{activeMoment.potentialScore ?? activeMoment.potential_score}% potential</Badge>}
                  </div>

                  <div className="bg-surface-inset p-3.5 rounded-panel border border-border-subtle space-y-3">
                    <span className="text-micro text-ink-muted uppercase tracking-widest block font-semibold">From your footage</span>
                    <p className="text-body-sm text-ink-secondary italic">
                      {activeMoment.transcript_excerpt || activeMoment.transcript_text || 'No transcript excerpt was returned for this suggestion.'}
                    </p>
                    {activeMoment.reasons?.length > 0 && <ul className="list-disc space-y-1 pl-5 text-xs text-ink-secondary">{activeMoment.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>}
                  </div>
                </div>
              </Panel>
            )}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <Panel title={`Clip suggestions (${filteredMoments.length})`} bodyClassName="p-3 space-y-3 max-h-[720px] overflow-y-auto">
              {filteredMoments.length === 0 && <p className="py-6 text-center text-sm text-ink-muted">{analyzing ? 'Listening to your footage and finding useful moments…' : 'No suggestions yet. Run analysis after adding a video with clear speech.'}</p>}
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
                      {(cand.potential_score ?? cand.potentialScore) != null && <Badge variant="score">{cand.potential_score ?? cand.potentialScore}%</Badge>}
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

      {activeTab === 'retention' && (
        <Panel title="Pacing review" subtitle="This is a content-based estimate from the transcript, not real audience or platform analytics.">
          {retentionAnalysis?.asset_id === activeAsset?.id ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div><p className="text-xs text-ink-muted">Estimated pacing score</p><p className="text-3xl font-semibold text-ink-primary">{retentionAnalysis.overall_retention_score}%</p></div>
                <div className="pb-1"><p className="text-sm font-medium text-ink-primary">{retentionAnalysis.opening_effectiveness}</p><p className="text-xs text-ink-muted">Approx. {retentionAnalysis.pacing_wpm} words per minute</p></div>
              </div>
              {retentionAnalysis.weak_sections?.length > 0 && <div className="space-y-2"><h3 className="text-sm font-semibold text-ink-primary">Moments to review</h3>{retentionAnalysis.weak_sections.map((section) => <article key={section.id} className="rounded-btn border border-border-subtle bg-surface-inset p-3"><p className="text-sm font-medium text-ink-primary">{section.issue_type} · {section.start_time}s–{section.end_time}s</p><p className="mt-1 text-xs text-ink-secondary">{section.suggestion}</p></article>)}</div>}
              {retentionAnalysis.actionable_recommendations?.length > 0 && <div><h3 className="text-sm font-semibold text-ink-primary">Suggestions</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-secondary">{retentionAnalysis.actionable_recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
            </div>
          ) : (
            <div className="py-4"><p className="text-sm text-ink-muted">Choose a video and run a pacing review to see transcript-based suggestions.</p><Button className="mt-3" variant="primary" onClick={handleRetentionAnalysis} isLoading={retentionLoading} disabled={!activeAsset}>Review pacing</Button></div>
          )}
        </Panel>
      )}

      {activeTab === 'hooklab' && (
        <Panel title="Opening hook ideas" subtitle="Try a few different ways to begin your clip. Suggestions are drafts for you to edit.">
          {!activeClip ? (
            <div className="py-4"><p className="text-sm text-ink-muted">Create a draft from a suggestion first. Then you can generate alternate opening lines.</p><Button className="mt-3" variant="secondary" onClick={() => setActiveTab('analyzer')}>Find a clip suggestion</Button></div>
          ) : (
            <>
              <p className="mb-3 text-xs text-ink-muted">For: {activeClip.title}</p>
              <Button variant="primary" onClick={handleGenerateHooks} isLoading={hooksLoading}>Generate opening ideas</Button>
              {hooksForClipId === activeClip.id && abHookVariations.length > 0 && <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">{abHookVariations.map((variation) => <article key={variation.id} className="rounded-panel border border-border-subtle bg-white p-4"><p className="text-xs font-semibold text-accent">{variation.style}</p><p className="mt-2 text-sm font-medium text-ink-primary">{variation.hook_text}</p>{variation.suggested_caption && <p className="mt-2 text-xs text-ink-muted">{variation.suggested_caption}</p>}<Button className="mt-3" size="sm" variant="secondary" onClick={() => applySelectedHook(activeClip.id, variation.hook_text, variation.suggested_caption)}>Use this opening</Button></article>)}</div>}
            </>
          )}
        </Panel>
      )}

      {activeTab === 'matcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Match your script to footage" className="space-y-4">
            <p className="text-body-sm text-ink-secondary">
              Paste a script and CreatorAI will find the closest spoken moments in your video.
              Transcripts and immutable script versions are saved with the project.
            </p>
            <label className="block space-y-1 text-body-sm font-medium text-ink-primary">
              Script title
              <input
                value={scriptTitle}
                onChange={(event) => {
                  setScriptTitle(event.target.value);
                  setSelectedScriptVersionId('');
                }}
                aria-label="Script title"
                maxLength={120}
                className="w-full rounded-panel border border-border-subtle bg-white p-2.5 text-body-sm outline-none focus:border-accent"
              />
            </label>
            <label className="block space-y-1 text-body-sm font-medium text-ink-primary">
              Saved script versions
              <select
                value={selectedScriptVersionId}
                onChange={(event) => {
                  const version = scriptLibrary
                    .flatMap((script) => script.versions.map((item) => ({
                      ...item,
                      scriptTitle: script.title
                    })))
                    .find((item) => item.id === event.target.value);
                  setSelectedScriptVersionId(event.target.value);
                  if (version) {
                    setScriptTitle(version.scriptTitle);
                    setScriptInput(version.text);
                  }
                }}
                aria-label="Saved script versions"
                className="w-full rounded-panel border border-border-subtle bg-white p-2.5 text-body-sm outline-none focus:border-accent"
              >
                <option value="">New script or current text</option>
                {scriptLibrary.flatMap((script) => script.versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {script.title} · v{version.version}
                  </option>
                )))}
              </select>
            </label>
            {scriptLibraryError && (
              <p role="alert" className="text-xs text-status-danger">{scriptLibraryError}</p>
            )}
            <textarea
              value={scriptInput}
              onChange={(event) => {
                setScriptInput(event.target.value);
                setSelectedScriptVersionId('');
              }}
              aria-label="Script text"
              placeholder="Paste or type your script. Separate sections with a blank line for clearer matches."
              maxLength={20000}
              rows={12}
              className="w-full rounded-panel border border-border-subtle bg-white p-3 text-body-sm text-ink-primary outline-none focus:border-accent"
            />
            {scriptMatchError && (
              <div role="alert" className="rounded-btn border border-rose-200 bg-status-danger-soft p-3 text-xs text-status-danger">
                {scriptMatchError}
              </div>
            )}
            {!activeAsset && (
              <p className="text-xs text-status-danger">Upload or select a video in this project before matching.</p>
            )}
            <Button
              variant="primary"
              onClick={handleRunScriptMatcher}
              disabled={!selectedAssetId || !scriptInput.trim() || scriptMatching}
              icon={FileCheck}
            >
              {scriptMatching ? 'Transcribing and matching…' : 'Transcribe & Find Matches'}
            </Button>
          </Panel>

          <Panel title={`Footage matches (${scriptMatches.filter((match) => match.assetId === selectedAssetId).length})`} className="space-y-3">
            {scriptMatches.filter((match) => match.assetId === selectedAssetId).length === 0 ? (
              <p className="text-body-sm text-ink-muted">
                No close script sections found yet. Try another script or select different footage.
              </p>
            ) : scriptMatches
                .filter((match) => match.assetId === selectedAssetId)
                .map((match) => (
                  <article key={match.id} className="rounded-panel border border-border-subtle bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-ink-primary">
                        {match.start_time.toFixed(1)}s–{match.end_time.toFixed(1)}s
                      </span>
                      <Badge variant="score">{match.confidence_score.toFixed(1)}% rank score</Badge>
                    </div>
                    <p className="text-body-sm text-ink-secondary">{match.matched_transcript_excerpt}</p>
                    <p className="text-xs text-ink-muted">{match.explanation}</p>
                    <p className="text-[10px] text-ink-muted">Match score: {match.confidence_score.toFixed(1)}%</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Zap}
                      onClick={() => handleCreateClipFromMatch(match)}
                      disabled={creatingClipForMatch !== null}
                      isLoading={creatingClipForMatch === match.id}
                    >
                      Create clip from match
                    </Button>
                  </article>
                ))}
          </Panel>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 md:left-[208px] right-0 min-h-[52px] bg-white border-t border-border-subtle px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 z-30 shadow-md">
        <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium text-ink-secondary">
          <span>Selected Clips: <strong className="text-ink-primary font-mono font-bold">{selectedCandidateIds.length}</strong></span>
          <span>•</span>
          <span>Total Duration: <strong className="text-ink-primary font-mono font-bold">{totalSelectedDuration.toFixed(1)}s</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleBatchGenerate} icon={ArrowRight} isLoading={creatingClips} disabled={!activeAsset || selectedCandidateIds.length === 0}>
            Create {selectedCandidateIds.length || ''} draft{selectedCandidateIds.length === 1 ? '' : 's'}
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

function readableError(error, fallback) {
  const detail = error.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return error.message || fallback;
}
