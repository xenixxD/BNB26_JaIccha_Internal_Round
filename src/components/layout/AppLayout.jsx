import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NewProjectModal } from '../common/NewProjectModal';
import { UploadAssetModal } from '../common/UploadAssetModal';
import { Home, FolderKanban, FolderSearch, Sparkles, CalendarDays, Scissors, BarChart3, Settings } from 'lucide-react';

export const AppLayout = () => {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const mobileLinks = [
    { label: 'Home', to: '/', icon: Home, end: true },
    { label: 'Projects', to: '/projects', icon: FolderKanban },
    { label: 'Footage', to: '/assets', icon: FolderSearch },
    { label: 'Find clips', to: '/clip-studio', icon: Sparkles },
    { label: 'Planner', to: '/planner', icon: CalendarDays },
    { label: 'Editor', to: '/video-editor', icon: Scissors },
    { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    { label: 'Settings', to: '/settings', icon: Settings }
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink-primary font-sans antialiased">
      {/* Sidebar (Fixed 208px) */}
      <Sidebar onOpenNewProjectModal={() => setIsNewProjectOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-canvas overflow-hidden">
        <Header onOpenUploadModal={() => setIsUploadOpen(true)} />
        <nav aria-label="Main navigation" className="md:hidden flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border-subtle bg-white px-2 py-2">
          {mobileLinks.map(({ label, to, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-btn px-3 text-xs font-semibold ${isActive ? 'bg-accent-soft text-accent-text' : 'text-ink-secondary hover:bg-surface-inset'}`}>
              <Icon className="h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-canvas">
          <Outlet />
        </main>
      </div>

      {/* Shared Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
      />
      <UploadAssetModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};
