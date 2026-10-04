import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AssetLibraryPage } from './pages/AssetLibraryPage';
import { ClipStudioPage } from './pages/ClipStudioPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { PlannerPage } from './pages/PlannerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

export function App() {
  const workspaceReady = useStore((state) => state.workspaceReady);
  const workspaceLoadFailed = useStore((state) => state.workspaceLoadFailed);
  const workspaceError = useStore((state) => state.workspaceError);
  const hydrateWorkspace = useStore((state) => state.hydrateWorkspace);
  const fetchSystemHealth = useStore((state) => state.fetchSystemHealth);

  useEffect(() => {
    hydrateWorkspace();
    fetchSystemHealth();
  }, [hydrateWorkspace, fetchSystemHealth]);

  if (!workspaceReady) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading your workspace…</div>;
  }

  if (workspaceLoadFailed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert" className="max-w-lg text-sm text-rose-700">
          {workspaceError}
        </p>
        <button className="rounded bg-indigo-600 px-4 py-2 text-sm text-white" onClick={hydrateWorkspace}>
          Try connecting again
        </button>
      </main>
    );
  }

  return (
    <>
      {workspaceError && (
        <div role="alert" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[100] max-w-xl rounded-lg bg-rose-700 px-4 py-3 text-xs text-white shadow-lg">
          {workspaceError}
        </div>
      )}
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="assets" element={<AssetLibraryPage />} />
          <Route path="clip-studio" element={<ClipStudioPage />} />
          <Route path="video-editor" element={<VideoEditorPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}
export default App;
