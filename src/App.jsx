import React, { useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { AssetLibraryPage } from './pages/AssetLibraryPage';
import { ClipStudioPage } from './pages/ClipStudioPage';
import { VideoEditorPage } from './pages/VideoEditorPage';
import { PlannerPage } from './pages/PlannerPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const editorUnsavedChanges = useStore((state) => state.editorUnsavedChanges);
  const editorSavingDraft = useStore((state) => state.editorSavingDraft);
  const discardEditorChanges = useStore((state) => state.discardEditorChanges);
  const previousPath = useRef(location.pathname);
  const workspaceReady = useStore((state) => state.workspaceReady);
  const workspaceLoadFailed = useStore((state) => state.workspaceLoadFailed);
  const workspaceError = useStore((state) => state.workspaceError);
  const projectStateLoadFailed = useStore((state) => state.projectStateLoadFailed);
  const activeProjectId = useStore((state) => state.activeProjectId);
  const loadProjectState = useStore((state) => state.loadProjectState);
  const hydrateWorkspace = useStore((state) => state.hydrateWorkspace);
  const fetchSystemHealth = useStore((state) => state.fetchSystemHealth);

  useEffect(() => {
    hydrateWorkspace();
    fetchSystemHealth();
  }, [hydrateWorkspace, fetchSystemHealth]);

  useEffect(() => {
    const previous = previousPath.current;
    if (previous === '/video-editor' && location.pathname !== '/video-editor' && (editorUnsavedChanges || editorSavingDraft)) {
      if (editorSavingDraft) {
        navigate(previous, { replace: true });
        return;
      }
      if (!window.confirm('You have unsaved editor changes. Leave without saving them?')) {
        navigate(previous, { replace: true });
        return;
      }
      discardEditorChanges();
    }
    previousPath.current = location.pathname;
  }, [location.pathname, editorUnsavedChanges, editorSavingDraft, navigate, discardEditorChanges]);

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
        <div role="alert" className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[100] flex max-w-xl items-center gap-3 rounded-lg bg-rose-700 px-4 py-3 text-xs text-white shadow-lg">
          {workspaceError}
          {projectStateLoadFailed && activeProjectId && <button type="button" className="shrink-0 font-semibold underline" onClick={() => loadProjectState(activeProjectId)}>Retry project load</button>}
        </div>
      )}
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<main className="min-h-screen grid place-items-center p-6 text-center"><div><h1 className="text-xl font-semibold text-ink-primary">Page not found</h1><p className="mt-2 text-sm text-ink-muted">That CreatorAI page does not exist.</p><Link className="mt-4 inline-flex text-sm font-semibold text-accent underline" to="/">Return to your workspace</Link></div></main>} />
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="assets" element={<AssetLibraryPage />} />
          <Route path="clip-studio" element={<ClipStudioPage />} />
          <Route path="video-editor" element={<VideoEditorPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}
export default App;
