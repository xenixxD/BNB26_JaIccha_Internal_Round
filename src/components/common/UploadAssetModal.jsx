import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { storageService } from '../../services/storage';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X, UploadCloud, FileVideo, FileText, Music, Image as ImageIcon, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const UploadAssetModal = ({ isOpen, onClose, onSuccess }) => {
  const { activeProjectId, addAsset } = useStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [scriptText, setScriptText] = useState('');
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'script'

  const onDrop = async (acceptedFiles, fileRejections) => {
    setErrorMessage(null);
    if (fileRejections && fileRejections.length > 0) {
      const err = fileRejections[0].errors[0]?.message || 'Invalid file format or size exceeded. MP4, MOV, WEBM (Up to 500 MB) supported.';
      setErrorMessage(err);
      return;
    }

    if (!acceptedFiles || acceptedFiles.length === 0) return;
    setUploading(true);
    setProgress(10);

    try {
      for (const file of acceptedFiles) {
        let type = 'video';
        if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('image/')) type = 'image';
        else if (file.name.endsWith('.txt') || file.name.endsWith('.script')) type = 'script';

        let assetRes;
        try {
          // 1. Attempt upload to FastAPI backend endpoint with real-time progress
          assetRes = await api.uploadAsset(file, activeProjectId, type, (pct) => setProgress(Math.min(90, pct)));
          assetRes.isDemo = false;
        } catch (apiErr) {
          console.warn('Backend upload endpoint offline, storing in local IndexedDB:', apiErr);
          assetRes = {
            id: `asset_${Date.now().toString(36)}`,
            projectId: activeProjectId,
            project_id: activeProjectId,
            filename: file.name,
            fileType: type,
            file_type: type,
            fileSize: file.size,
            file_size: file.size,
            url: URL.createObjectURL(file),
            uploadDate: new Date().toISOString().split('T')[0],
            duration: 160.0,
            status: 'ready',
            isDemo: false
          };
        }

        setProgress(95);
        // 2. Persist binary Blob in IndexedDB (ensures video survives browser refreshes)
        await storageService.saveBlob(assetRes.id, file);

        // 3. Register asset in Zustand store
        addAsset(assetRes);
        if (onSuccess) {
          onSuccess(assetRes);
        }
      }

      setProgress(100);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploading(false);
        setProgress(0);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Upload processing error:', err);
      setErrorMessage(err.message || 'File upload failed. Please verify video file integrity.');
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 524288000, // 500 MB
    accept: {
      'video/*': ['.mp4', '.mov', '.webm', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'image/*': ['.jpg', '.png', '.webp'],
      'text/plain': ['.txt']
    }
  });

  const handleScriptSubmit = (e) => {
    e.preventDefault();
    if (!scriptText.trim()) return;

    addAsset({
      id: `asset_script_${Date.now().toString(36)}`,
      projectId: activeProjectId,
      filename: `User_Script_${new Date().toLocaleTimeString().replace(/:/g, '')}.txt`,
      fileType: 'script',
      fileSize: scriptText.length,
      url: '#',
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'ready',
      isDemo: false,
      content: scriptText
    });

    setScriptText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-border-subtle rounded-panel w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-inset">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-accent stroke-[1.75]" />
            <h3 className="font-bold text-title-panel text-ink-primary">Upload Video / Asset</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} icon={X} />
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border-subtle px-5 pt-3 bg-white">
          <button
            onClick={() => setActiveTab('media')}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'media'
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }`}
          >
            Video / Media Files
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'script'
                ? 'border-accent text-accent'
                : 'border-transparent text-ink-muted hover:text-ink-primary'
            }`}
          >
            Script Text Input
          </button>
        </div>

        <div className="p-5">
          {errorMessage && (
            <div className="mb-4 p-3 bg-status-danger-soft border border-rose-200 text-status-danger text-xs font-semibold rounded-btn flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'media' ? (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-panel p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-accent bg-accent-soft/30 scale-[0.99]'
                    : 'border-border-strong hover:border-accent bg-surface-inset'
                }`}
              >
                <input {...getInputProps()} />

                {uploading ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    {uploadSuccess ? (
                      <CheckCircle2 className="w-10 h-10 text-status-success animate-bounce" />
                    ) : (
                      <Loader2 className="w-10 h-10 text-accent animate-spin" />
                    )}
                    <span className="text-xs font-bold text-ink-primary">
                      {uploadSuccess ? 'Video Uploaded & Saved to IndexedDB!' : `Uploading file... ${progress}%`}
                    </span>
                    <div className="w-48 h-1.5 bg-border-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-accent-soft border border-indigo-200 flex items-center justify-center text-accent shadow-sm">
                      <UploadCloud className="w-6 h-6 stroke-[1.75]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink-primary">
                        Drag & drop MP4, MOV, or WebM video files here
                      </p>
                      <p className="text-body-sm text-ink-muted mt-1">
                        Supports MP4, MOV, WEBM, MP3, TXT (Up to 500 MB)
                      </p>
                    </div>
                    <Button variant="primary" size="sm">
                      Browse Video Files
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-around text-micro font-mono text-ink-muted bg-surface-inset p-2.5 rounded-btn border border-border-subtle">
                <span className="flex items-center gap-1.5"><FileVideo className="w-3.5 h-3.5 text-accent" /> MP4 / MOV Video</span>
                <span className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-status-success" /> Audio Beat</span>
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-status-warning" /> TXT Script</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleScriptSubmit} className="space-y-4">
              <div>
                <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold mb-1">
                  Script Content for AI Matching
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste script paragraphs here..."
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="w-full bg-surface-inset border border-border-subtle rounded-btn p-3 text-xs text-ink-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="primary">Save Script Asset</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
