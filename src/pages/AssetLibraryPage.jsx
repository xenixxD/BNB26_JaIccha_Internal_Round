import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { UploadAssetModal } from '../components/common/UploadAssetModal';
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
  Sparkles,
  HardDrive,
  Filter
} from 'lucide-react';

export const AssetLibraryPage = () => {
  const navigate = useNavigate();
  const { assets, deleteAsset, projects } = useStore();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewAsset, setPreviewAsset] = useState(null);

  const filteredAssets = assets.filter((asset) => {
    const matchesType = filterType === 'All' || asset.fileType.toLowerCase() === filterType.toLowerCase();
    const matchesSearch = asset.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalBytes = assets.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Smart Asset Manager"
        metaChip={`IndexedDB & Server Storage`}
        breadcrumbs={[
          { label: 'CreatorAI', path: '/' },
          { label: 'Asset Library' }
        ]}
        actions={
          <Button variant="primary" onClick={() => setIsUploadOpen(true)} icon={Upload}>
            Upload Media Asset
          </Button>
        }
      />

      {/* Main Workspace Layout with Left Filter Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Filter Rail (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <Panel title="Asset Filters & Storage">
            <div className="space-y-4">
              <div>
                <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold mb-2">
                  Asset Category
                </label>
                <div className="space-y-1">
                  {['All', 'Video', 'Script', 'Audio', 'Image'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`w-full h-[30px] px-3 rounded-btn text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        filterType === t
                          ? 'bg-accent text-white shadow-sm'
                          : 'bg-white text-ink-secondary hover:bg-surface-inset border border-border-subtle'
                      }`}
                    >
                      <span>{t}</span>
                      <span className="font-mono text-[10px]">
                        {t === 'All' ? assets.length : assets.filter((a) => a.fileType.toLowerCase() === t.toLowerCase()).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage Usage Indicator */}
              <div className="p-3 bg-surface-inset rounded-panel border border-border-subtle space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-accent" /> Storage Used
                  </span>
                  <span className="font-mono text-mono-val font-bold text-ink-primary">
                    {(totalBytes / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[35%]" />
                </div>
                <span className="text-[10px] text-ink-muted block font-mono">IndexedDB + Server uploads/</span>
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Asset Table & Workspace (9 Cols) */}
        <div className="lg:col-span-9 space-y-4">
          <Panel
            title={`Media Assets (${filteredAssets.length})`}
            action={
              <div className="w-64">
                <Input
                  placeholder="Search filenames..."
                  icon={Search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            }
            bodyClassName="p-0"
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-inset text-micro text-ink-muted uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-4">Asset File</th>
                  <th className="py-2.5 px-4">Format</th>
                  <th className="py-2.5 px-4">Size</th>
                  <th className="py-2.5 px-4">Upload Date</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-ink-muted">
                      No assets found. Upload media to begin.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-surface-inset transition-colors">
                      <td className="py-2.5 px-4 font-bold text-ink-primary flex items-center gap-2.5">
                        {asset.fileType === 'video' ? <Video className="w-4 h-4 text-accent stroke-[1.75]" /> : <FileText className="w-4 h-4 text-status-warning stroke-[1.75]" />}
                        <span className="truncate max-w-xs">{asset.filename}</span>
                      </td>
                      <td className="py-2.5 px-4 uppercase font-mono text-mono-val font-semibold text-ink-secondary">{asset.fileType}</td>
                      <td className="py-2.5 px-4 font-mono text-mono-val">{asset.fileSize ? (asset.fileSize / 1024 / 1024).toFixed(1) + ' MB' : '4.2 KB'}</td>
                      <td className="py-2.5 px-4 text-ink-muted">{asset.uploadDate}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="success" size="sm">Ready</Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => setPreviewAsset(asset)} icon={Eye} title="Preview" />
                        {asset.fileType === 'video' && (
                          <Button variant="soft" size="sm" onClick={() => navigate('/clip-studio')} icon={Sparkles}>
                            Clip Studio
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteAsset(asset.id)} icon={Trash2} title="Delete" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>

      {/* Asset Preview Drawer / Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-border-subtle rounded-panel w-full max-w-xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
              <h3 className="font-bold text-title-panel text-ink-primary truncate">{previewAsset.filename}</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreviewAsset(null)}>✕</Button>
            </div>
            <div className="p-4 space-y-3">
              {previewAsset.fileType === 'video' ? (
                <div className="rounded-btn overflow-hidden bg-backdrop aspect-video flex items-center justify-center">
                  <video src={previewAsset.url} controls className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="bg-surface-inset p-4 rounded-btn border border-border-subtle font-mono text-xs text-ink-primary max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {previewAsset.content || 'Script text asset content loaded.'}
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="secondary" onClick={() => setPreviewAsset(null)}>Close Preview</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UploadAssetModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};
