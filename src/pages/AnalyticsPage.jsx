import React from 'react';
import { INITIAL_ANALYTICS } from '../data/mockData';
import {
  BarChart3,
  TrendingUp,
  Eye,
  MessageSquare,
  Share2,
  Film
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const AnalyticsPage = () => {
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Performance Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics for generated vertical short-form clips across connected social channels.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          Last 30 Days (Demo Analytics Data)
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Views', value: INITIAL_ANALYTICS.totalViews, change: '+24.8%', icon: Eye, color: 'text-indigo-400' },
          { title: 'Avg Engagement Rate', value: INITIAL_ANALYTICS.avgEngagement, change: '+1.4%', icon: TrendingUp, color: 'text-emerald-400' },
          { title: 'Published Short Clips', value: INITIAL_ANALYTICS.publishedClips, change: '+5 this week', icon: Film, color: 'text-violet-400' },
          { title: 'Shares & Reposts', value: '12.4K', change: '+18.2%', icon: Share2, color: 'text-pink-400' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{item.title}</span>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="text-2xl font-bold text-slate-100">{item.value}</div>
              <span className="text-[10px] font-semibold text-emerald-400">{item.change} vs previous period</span>
            </div>
          );
        })}
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Views Trend Area Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Daily Views Growth Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={INITIAL_ANALYTICS.weeklyPerformance}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown Bar Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Platform Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INITIAL_ANALYTICS.platformBreakdown}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                  {INITIAL_ANALYTICS.platformBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
