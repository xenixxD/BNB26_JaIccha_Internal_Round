import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  Sparkles,
  FileCheck,
  Play,
  Scissors,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Video,
  ArrowRight,
  Layers,
  Info
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
  const [scriptInput, setScriptInput] = useState(
    "Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.\n\n" +
    "If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram."
  );
  const [selectedAssetId, setSelectedAssetId] = useState('asset_v1');
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const videoAssets = assets.filter((a) => a.fileType === 'video');
  const activeAsset = videoAssets.find((a) => a.id === selectedAssetId) || videoAssets[0];

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
    }
  };

  const handleGenerateSelectedClip = (candidate) => {
    const clip = generateClip(candidate);
    navigate('/video-editor');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold mb-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>AI Studio Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">AI Clip Studio</h1>
          <p className="text-xs text-slate-400 mt-1">
            Extract viral short moments and match uploaded scripts directly to timestamped video transcripts.
          </p>
        </div>

        {/* Source Video Dropdown Selector */}
        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
          <Video className="w-4 h-4 text-indigo-400" />
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer pr-4"
          >
            {videoAssets.map((v) => (
              <option key={v.id} value={v.id} className="bg-slate-900">
                {v.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 bg-slate-900 p-1.5 rounded-xl border">
        <button
          onClick={() => setActiveTab('analyzer')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'analyzer'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Video Potential Analyzer</span>
        </button>

        <button
          onClick={() => setActiveTab('matcher')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === 'matcher'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>AI Script-to-Video Matcher</span>
        </button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Video & Transcript Player (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Source Preview</span>
              <span className="text-[10px] text-indigo-400">{activeAsset?.filename}</span>
            </h3>

            <div className="rounded-lg overflow-hidden bg-black border border-slate-800 aspect-video relative">
              <video
                ref={videoRef}
                src={activeAsset?.url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Timestamped Transcript Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Timestamped Transcript</span>
              <span className="text-[10px] text-slate-400">{transcript.length} Segments</span>
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {transcript.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSeekVideo(t.start)}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 text-xs cursor-pointer transition-all flex items-start gap-2.5 group"
                >
                  <button className="bg-indigo-500/10 text-indigo-400 font-mono text-[10px] px-1.5 py-0.5 rounded border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                    {t.start}s - {t.end}s
                  </button>
                  <p className="text-slate-300 group-hover:text-slate-100 transition-colors leading-relaxed">
                    {t.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis / Matching Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === 'analyzer' ? (
            /* ==================================== */
            /* TAB 1: AI VIDEO POTENTIAL ANALYZER  */
            /* ==================================== */
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Video Potential Analysis Engine
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ranks moments by hook strength, WPM pacing density (130-170 WPM), and narrative completeness.
                  </p>
                </div>

                <button
                  onClick={handleRunAnalyzer}
                  disabled={analyzing}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-md flex items-center gap-1.5 self-start shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{analyzing ? 'Analyzing Video...' : 'Run Potential Analysis'}</span>
                </button>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Scores represent <strong>Estimated Clip Potential</strong> derived from transcript NLP heuristics.</span>
              </div>

              {/* Candidate Moments List */}
              <div className="space-y-4">
                {(candidateMoments.length > 0 ? candidateMoments : [
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
                    reasons: ['Strong curiosity hook in opening statement', 'Optimal short-form pacing (~145 WPM)', 'Self-contained narrative window (22.5s)']
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
                    reasons: ['Direct takeaway resolution', 'High audience retention topic', 'Optimal duration for Reels/Shorts (33s)']
                  }
                ]).map((cand) => (
                  <div
                    key={cand.id}
                    className="bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 space-y-3 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            {cand.rating_label}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {cand.start_time}s – {cand.end_time}s ({cand.duration}s)
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-100 text-sm">{cand.title}</h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl font-bold text-emerald-400">{cand.potential_score}%</div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-semibold">Estimated Potential</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono italic">
                      "{cand.transcript_excerpt}"
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {cand.reasons.map((r, idx) => (
                        <span key={idx} className="bg-slate-900 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-800">
                          ✓ {r}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => handleSeekVideo(cand.start_time)}
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 text-indigo-400" />
                        Preview Segment
                      </button>

                      <button
                        onClick={() => handleGenerateSelectedClip(cand)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 shadow"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Select & Edit 9:16 Clip</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ===================================== */
            /* TAB 2: AI SCRIPT-TO-VIDEO MATCHER     */
            /* ===================================== */
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  Script Paragraph Matcher
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Paste script text to align paragraphs with exact timestamped video transcript segments.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Script Paragraphs
                </label>
                <textarea
                  rows={4}
                  value={scriptInput}
                  onChange={(e) => setScriptInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="Paste script paragraphs..."
                />
              </div>

              <button
                onClick={handleRunMatcher}
                disabled={analyzing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{analyzing ? 'Matching Script to Video Transcript...' : 'Match Script Sections'}</span>
              </button>

              {/* Match Results List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matching Results</h4>

                {(scriptMatches.length > 0 ? scriptMatches : [
                  {
                    id: 'match_1',
                    script_section: 'Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.',
                    matched_transcript_excerpt: 'Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.',
                    start_time: 12.5,
                    end_time: 35.0,
                    confidence_score: 96.4,
                    explanation: 'Exact subject alignment on creator mindset shift (Timestamp 12.5s - 35.0s)'
                  }
                ]).map((match) => (
                  <div key={match.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
                        Timestamp: {match.start_time}s – {match.end_time}s
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {match.confidence_score}% Match Confidence
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">SCRIPT SECTION</span>
                        <p className="text-slate-300">{match.script_section}</p>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-semibold text-indigo-400 block mb-1">MATCHED TRANSCRIPT</span>
                        <p className="text-slate-300">{match.matched_transcript_excerpt}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => handleSeekVideo(match.start_time)}
                        className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Seek Video Player
                      </button>

                      <button
                        onClick={() => handleGenerateSelectedClip({
                          title: match.script_section.slice(0, 30) + '...',
                          start_time: match.start_time,
                          end_time: match.end_time,
                          potential_score: match.confidence_score,
                          transcript_excerpt: match.matched_transcript_excerpt
                        })}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold py-1 px-3 rounded"
                      >
                        Edit Clip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
