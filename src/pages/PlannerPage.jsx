import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  CalendarDays,
  Kanban,
  List,
  Plus,
  Video,
  Clock,
  CheckCircle2,
  Calendar,
  MoveRight,
  ExternalLink,
  Scissors
} from 'lucide-react';

export const PlannerPage = () => {
  const navigate = useNavigate();
  const { clips, moveClipStatus, updateClip, setActiveClip } = useStore();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'calendar' | 'list'
  const [filterPlatform, setFilterPlatform] = useState('All');

  const columns = [
    { title: 'Draft', status: 'Draft', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
    { title: 'Ready for Review', status: 'Ready for Review', color: 'border-amber-500/30 bg-amber-500/5 text-amber-300' },
    { title: 'Scheduled', status: 'Scheduled', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' },
    { title: 'Published', status: 'Published', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' },
  ];

  const filteredClips = clips.filter((c) => filterPlatform === 'All' || c.platform === filterPlatform);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-400" />
            Content Planner & Publisher
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage clips from initial creation to scheduled publication across social platforms.
          </p>
        </div>

        {/* View Switches & Filters */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', 'Instagram Reels', 'YouTube Shorts', 'TikTok', 'LinkedIn'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPlatform(p)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filterPlatform === p
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colClips = filteredClips.filter((c) => c.status === col.status);
            return (
              <div key={col.status} className={`border rounded-2xl p-4 ${col.color} space-y-4 min-h-[500px] flex flex-col justify-between`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider">{col.title}</h3>
                    <span className="bg-slate-950 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-800">
                      {colClips.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colClips.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-8">No clips in stage.</p>
                    ) : (
                      colClips.map((clip) => (
                        <div
                          key={clip.id}
                          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-3.5 rounded-xl space-y-3 transition-all shadow-sm group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-xs text-slate-100 group-hover:text-indigo-400 transition-colors leading-snug">
                              {clip.title}
                            </h4>
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                              9:16
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                            "{clip.suggestedHook || clip.caption}"
                          </p>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-indigo-300">{clip.platform}</span>
                            <span>{clip.duration}s</span>
                          </div>

                          {/* Move Workflow Stage Controls */}
                          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1">
                            <button
                              onClick={() => {
                                setActiveClip(clip.id);
                                navigate('/video-editor');
                              }}
                              className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                            >
                              <Scissors className="w-3 h-3 text-indigo-400" /> Edit
                            </button>

                            <select
                              value={clip.status}
                              onChange={(e) => moveClipStatus(clip.id, e.target.value)}
                              className="bg-slate-950 text-slate-300 text-[10px] font-medium rounded px-1.5 py-0.5 border border-slate-800 focus:outline-none"
                            >
                              <option value="Draft">Draft</option>
                              <option value="Ready for Review">Ready</option>
                              <option value="Scheduled">Scheduled</option>
                              <option value="Published">Published</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 text-center">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Workflow Stage</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            Scheduled Content Calendar (October 2026)
          </h3>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
            <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
          </div>

          <div className="grid grid-cols-7 gap-2 min-h-[400px]">
            {Array.from({ length: 28 }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayClips = filteredClips.filter((c) => c.status === 'Scheduled' || c.status === 'Ready for Review');
              const hasClip = idx === 4 || idx === 12;

              return (
                <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2 min-h-[90px] space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block">{dayNum}</span>
                  {hasClip && dayClips[0] && (
                    <div
                      onClick={() => {
                        setActiveClip(dayClips[0].id);
                        navigate('/video-editor');
                      }}
                      className="bg-indigo-600/20 border border-indigo-500/40 p-1.5 rounded text-[10px] text-indigo-300 font-semibold cursor-pointer truncate"
                    >
                      {dayClips[0].title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Clip Title</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredClips.map((clip) => (
                <tr key={clip.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-200">{clip.title}</td>
                  <td className="py-3 px-4 text-indigo-300 font-medium">{clip.platform}</td>
                  <td className="py-3 px-4 text-slate-400">{clip.duration}s</td>
                  <td className="py-3 px-4 font-semibold text-emerald-400">{clip.potentialScore}%</td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                      {clip.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setActiveClip(clip.id);
                        navigate('/video-editor');
                      }}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      Open Editor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
