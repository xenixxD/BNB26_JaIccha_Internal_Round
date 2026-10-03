import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
  return (
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
  );
}
export default App;
