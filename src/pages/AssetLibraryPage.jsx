import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  FolderSearch,
  Upload,
  Search,
  Video,
  FileText,
  Music,
  Image as ImageIcon,
  Trash2,
  Eye,
  FileVideo,
  X,
  Sparkles
} from 'lucide-react';
import { UploadAssetModal } from '../components/common/UploadAssetModal';
import { useNavigate } from 'react-router-dom';

export const AssetLibraryPage = () => {
  const navigate = useNavigate();
  const { assets, deleteAsset, projects, activeProjectId } = useStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAsset, setPreviewAsset] = useState(null);

  const filteredAssets = assets.filter((asset) => {
    const matchesType = filterType === 'All' || asset.fileType.toLowerCase() === filterType.toLowerCase();
    const matchesSearch = asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getProjectName = (projId) => {
    const p = projects.find((item) => item.id === projId);
    return p ? p.name : 'Default Workspace';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FolderSearch className="w-5 h-5 text-indigo-400" />
            Smart Asset Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload long-form MP4 videos, scripts, audio beats, and media stored via IndexedDB & FastAPI server.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Media Asset</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search filenames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Video', 'Script', 'Audio', 'Image'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === type
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Table / Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Asset File</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No assets found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700/80 flex items-center justify-center text-indigo-400 shrink-0">
                        {asset.fileType === 'video' ? (
                          <Video className="w-4 h-4 text-indigo-400" />
                        ) : asset.fileType === 'script' ? (
                          <FileText className="w-4 h-4 text-amber-400" />
                        ) : asset.fileType === 'audio' ? (
                          <Music className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <span className="truncate max-w-xs">{asset.filename}</span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-400">{asset.fileType}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {asset.fileSize ? (asset.fileSize / 1024 / 1024).toFixed(1) + ' MB' : '4.2 KB'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{getProjectName(asset.projectId)}</td>
                    <td className="py-3 px-4 text-slate-400">{asset.uploadDate}</td>
                    <td className="py-3 px-4">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold px-2 py-0.5 rounded text-[10px]">
                        Ready
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setPreviewAsset(asset)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Preview Asset"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {asset.fileType === 'video' && (
                        <button
                          onClick={() => navigate('/clip-studio')}
                          className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[11px] font-medium"
                          title="Analyze in Clip Studio"
                        >
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          Clip Studio
                        </button>
                      )}
                      <button
                        onClick={() => deleteAsset(asset.id)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-slate-100 text-sm truncate">{previewAsset.filename}</h3>
              <button onClick={() => setPreviewAsset(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {previewAsset.fileType === 'video' ? (
                <div className="rounded-lg overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                  <video src={previewAsset.url} controls className="w-full h-full object-contain" />
                </div>
              ) : previewAsset.fileType === 'script' ? (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {previewAsset.content || 'Script text content loaded...'}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  File preview ready. Download or process asset in Clip Studio.
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setPreviewAsset(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UploadAssetModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};
