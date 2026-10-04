import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { X, UploadCloud, FileVideo, Image as ImageIcon, Music, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export const UploadAssetModal = ({ isOpen, onClose, onSuccess }) => {
  const { activeProjectId, addAsset } = useStore();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [savingScript, setSavingScript] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [scriptText, setScriptText] = useState('');
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'script'

  const onDrop = async (acceptedFiles, fileRejections) => {
    setErrorMessage(null);
    if (!activeProjectId) {
      setErrorMessage('Create a project before uploading assets.');
      return;
    }
    if (fileRejections && fileRejections.length > 0) {
      const err = fileRejections[0].errors[0]?.message || 'Choose a supported media type. Files up to 500 MB are accepted.';
      setErrorMessage(`Some selected files were rejected. No files were uploaded. ${err}`);
      return;
    }

    if (!acceptedFiles || acceptedFiles.length === 0) return;
    setUploading(true);
    setProgress(0);
    setDuplicateCount(0);
    setCompletedCount(0);
    let uploadedCount = 0;
    let duplicates = 0;

    try {
      for (const file of acceptedFiles) {
        setProgress(0);
        let type = 'video';
        if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('image/')) type = 'image';

        const assetRes = await api.uploadAsset(
          file,
          activeProjectId,
          type,
          setProgress
        );
        assetRes.isDemo = false;

        await addAsset(assetRes, true);
        uploadedCount += 1;
        setCompletedCount(uploadedCount);
        if (assetRes.duplicate) duplicates += 1;
        setDuplicateCount(duplicates);
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
      const partialUploadMessage = uploadedCount
        ? `${uploadedCount} file${uploadedCount === 1 ? '' : 's'} completed before the next file failed. Retry only the files that are still missing. `
        : '';
      setErrorMessage(partialUploadMessage + readableUploadError(err));
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 524288000, // 500 MB
    disabled: uploading || savingScript,
    accept: {
      'video/*': ['.mp4', '.mov', '.webm', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
    }
  });

  const handleScriptSubmit = async (e) => {
    e.preventDefault();
    if (savingScript) return;
    if (!activeProjectId) {
      setErrorMessage('Create a project before adding a script.');
      return;
    }
    if (!scriptText.trim()) return;

    setSavingScript(true);
    try {
      await addAsset({
        projectId: activeProjectId,
        filename: `User_Script_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`,
        fileType: 'script',
        fileSize: new Blob([scriptText]).size,
        url: '',
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'ready',
        isDemo: false,
        content: scriptText
      });
      setScriptText('');
      onClose();
    } catch (err) {
      setErrorMessage(readableUploadError(err, 'Could not save the script to this project. Try again.'));
    } finally {
      setSavingScript(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="upload-dialog-title" className="bg-white border border-border-subtle rounded-panel w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between bg-surface-inset">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-accent stroke-[1.75]" />
            <h3 id="upload-dialog-title" className="font-bold text-title-panel text-ink-primary">Add footage or script</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={uploading || savingScript} icon={X} aria-label="Close upload dialog" />
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border-subtle px-5 pt-3 bg-white">
          <button
            type="button"
            disabled={uploading || savingScript}
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
            type="button"
            disabled={uploading || savingScript}
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
                      {uploadSuccess
                        ? duplicateCount === completedCount
                          ? 'These files are already in this project.'
                          : duplicateCount
                            ? `Upload complete. ${duplicateCount} duplicate file${duplicateCount === 1 ? ' was' : 's were'} skipped.`
                            : 'Files uploaded and saved.'
                        : `Uploading file... ${progress}%`}
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
                        Drag & drop supported video, audio, or image files here
                      </p>
                      <p className="text-body-sm text-ink-muted mt-1">
                        Video: MP4, MOV, WebM, MKV · Audio: MP3, WAV, M4A · Images: JPG, PNG, WebP (up to 500 MB)
                      </p>
                    </div>
                    <Button variant="primary" size="sm">
                      Browse files
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-around text-micro font-mono text-ink-muted bg-surface-inset p-2.5 rounded-btn border border-border-subtle">
                <span className="flex items-center gap-1.5"><FileVideo className="w-3.5 h-3.5 text-accent" /> MP4 / MOV / WebM / MKV</span>
                <span className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-status-success" /> MP3 / WAV / M4A</span>
                <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-status-warning" /> JPG / PNG / WebP</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleScriptSubmit} className="space-y-4">
              <div>
                <label htmlFor="script-content" className="block text-micro text-ink-muted uppercase tracking-widest font-semibold mb-1">
                  Script Content for AI Matching
                </label>
                <textarea
                  id="script-content"
                  rows={6}
                  required
                  placeholder="Paste script paragraphs here..."
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="w-full bg-surface-inset border border-border-subtle rounded-btn p-3 text-xs text-ink-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose} disabled={savingScript}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={savingScript}>Save Script Asset</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

function readableUploadError(error, fallback = 'The file could not be uploaded. Try again.') {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  const message = typeof detail === 'string' ? detail : detail?.message;
  if (status === 413) return 'This file is larger than the 500 MB upload limit.';
  if (status === 400 || status === 422) return message || 'This file is not a supported format. Choose one of the listed types.';
  if (!error.response) return 'CreatorAI could not reach the server. Check your connection and try again.';
  if (status >= 500) return 'CreatorAI could not finish this upload. Try again.';
  return message || fallback;
}
