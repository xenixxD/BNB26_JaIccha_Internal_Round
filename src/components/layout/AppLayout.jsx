import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SystemHealthBanner } from '../common/SystemHealthBanner';
import { NewProjectModal } from '../common/NewProjectModal';
import { UploadAssetModal } from '../common/UploadAssetModal';

export const AppLayout = () => {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Top System Health Bar */}
      <SystemHealthBanner />

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar onOpenNewProjectModal={() => setIsNewProjectOpen(true)} />

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden">
          <Header onOpenUploadModal={() => setIsUploadOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-slate-950/60 p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Global Modals */}
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
