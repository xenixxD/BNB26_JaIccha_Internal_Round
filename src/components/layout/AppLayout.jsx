import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NewProjectModal } from '../common/NewProjectModal';
import { UploadAssetModal } from '../common/UploadAssetModal';

export const AppLayout = () => {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-ink-primary font-sans antialiased">
      {/* Sidebar (Fixed 208px) */}
      <Sidebar onOpenNewProjectModal={() => setIsNewProjectOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-canvas overflow-hidden">
        <Header onOpenUploadModal={() => setIsUploadOpen(true)} />
        <main className="flex-1 overflow-y-auto p-5 md:p-6 bg-canvas">
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
