import React from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { StatTile } from '../components/ui/StatTile';
import { Panel } from '../components/ui/Panel';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Share2,
  Film
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export const AnalyticsPage = () => {
  const COLORS = ['#2F5FE3', '#4C7DF0', '#8B5CF6', '#3B82F6'];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      <PageHeader
        title="Performance Analytics"
        metaChip="Analytics data unavailable"
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Analytics' }
        ]}
      />

      {/* Row of Stat Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="TOTAL VIEWS" value="—" subtext="No analytics data available" icon={Eye} accent />
        <StatTile label="AVG ENGAGEMENT RATE" value="—" subtext="No analytics data available" icon={TrendingUp} />
        <StatTile label="PUBLISHED CLIPS" value="—" subtext="No analytics data available" icon={Film} />
        <StatTile label="SHARES & REPOSTS" value="—" subtext="No analytics data available" icon={Share2} />
      </div>

      {/* 2-Column Chart Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Daily Views Trend (8 Cols) */}
        <div className="lg:col-span-8">
          <Panel title="Daily Views Growth Trend" subtitle="Clean line performance metric">
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[]}>
                  <XAxis dataKey="day" stroke="#7A8499" fontSize={11} />
                  <YAxis stroke="#7A8499" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E7EF', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="views" stroke="#2F5FE3" strokeWidth={2} dot={{ r: 3, fill: '#2F5FE3' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Platform Breakdown (4 Cols) */}
        <div className="lg:col-span-4">
          <Panel title="Platform Breakdown" subtitle="Distribution by views">
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[]}>
                  <XAxis dataKey="name" stroke="#7A8499" fontSize={9} />
                  <YAxis stroke="#7A8499" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E3E7EF', borderRadius: '6px', fontSize: '12px' }}
                  />
                  <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
