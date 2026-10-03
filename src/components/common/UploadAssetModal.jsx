import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { storageService } from '../../services/storage';
import { X, UploadCloud, FileVideo, FileText, Music, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react';

export const UploadAssetModal = ({ isOpen, onClose }) => {
  const { activeProjectId, addAsset } = useStore();
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [scriptText, setScriptText] = useState('');
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'script'

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    setUploading(true);

    try {
      for (const file of acceptedFiles) {
        let type = 'video';
        if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('image/')) type = 'image';
        else if (file.name.endsWith('.txt') || file.name.endsWith('.script')) type = 'script';

        // 1. Send to FastAPI backend upload endpoint
        const assetRes = await api.uploadAsset(file, activeProjectId, type);

        // 2. Save Blob in client IndexedDB (for large video offline access)
        await storageService.saveBlob(assetRes.id, file);

        // 3. Add to Zustand state
        addAsset(assetRes);
      }
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setUploading(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
      filename: `Script_Upload_${new Date().toLocaleTimeString().replace(/:/g, '')}.txt`,
      fileType: 'script',
      fileSize: scriptText.length,
      url: '#',
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'ready',
      content: scriptText
    });

    setScriptText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Smart Asset Uploader</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 px-5 pt-3">
          <button
            onClick={() => setActiveTab('media')}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors ${
              activeTab === 'media'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Video / Audio / Images
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2 text-xs font-semibold px-3 border-b-2 transition-colors ${
              activeTab === 'script'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Enter / Paste Script Text
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'media' ? (
            <div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
                    : 'border-slate-700/80 hover:border-slate-500 bg-slate-950/40'
                }`}
              >
                <input {...getInputProps()} />

                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    {uploadSuccess ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                    ) : (
                      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                    )}
                    <span className="text-xs font-semibold text-slate-200">
                      {uploadSuccess ? 'Asset Uploaded Successfully!' : 'Processing & saving asset to IndexedDB...'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-md">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        Drag & drop video, audio, or image files here
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Supports MP4, MOV, WEBM, MP3, WAV, TXT (Max 500MB)
                      </p>
                    </div>
                    <span className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-around text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                <span className="flex items-center gap-1.5"><FileVideo className="w-3.5 h-3.5 text-indigo-400" /> MP4 Video</span>
                <span className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5 text-emerald-400" /> MP3 Audio</span>
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-400" /> TXT Script</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleScriptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Script Content for AI Matching
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste script paragraphs here to match with timestamped video transcript..."
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg shadow-md"
                >
                  Save Script Asset
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
