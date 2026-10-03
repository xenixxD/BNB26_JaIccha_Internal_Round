import axios from 'axios';

const API_BASE = '/api';

export const api = {
  async getWorkspace() {
    const [projects, assets, clips] = await Promise.all([
      axios.get(`${API_BASE}/projects`),
      axios.get(`${API_BASE}/assets`),
      axios.get(`${API_BASE}/clips`)
    ]);
    return {
      projects: projects.data,
      assets: assets.data,
      clips: clips.data
    };
  },

  async createProject(project) {
    const res = await axios.post(`${API_BASE}/projects`, project);
    return res.data;
  },

  async deleteProject(projectId) {
    const res = await axios.delete(`${API_BASE}/projects/${encodeURIComponent(projectId)}`);
    return res.data;
  },

  async createAsset(asset) {
    const res = await axios.post(`${API_BASE}/assets`, asset);
    return res.data;
  },

  async updateAsset(assetId, updates) {
    const res = await axios.put(`${API_BASE}/assets/${encodeURIComponent(assetId)}`, updates);
    return res.data;
  },

  async deleteAsset(assetId) {
    const res = await axios.delete(`${API_BASE}/assets/${encodeURIComponent(assetId)}`);
    return res.data;
  },

  async createClip(clip) {
    const res = await axios.post(`${API_BASE}/clips`, clip);
    return res.data;
  },

  async updateClip(clipId, updates) {
    const res = await axios.put(`${API_BASE}/clips/${encodeURIComponent(clipId)}`, updates);
    return res.data;
  },

  async saveClipDraft(clipId, clip) {
    const res = await axios.post(`${API_BASE}/clips/${encodeURIComponent(clipId)}/drafts`, clip);
    return res.data;
  },

  async getClipDrafts(clipId) {
    const res = await axios.get(`${API_BASE}/clips/${encodeURIComponent(clipId)}/drafts`);
    return res.data;
  },

  async getProjectState(projectId) {
    const res = await axios.get(`${API_BASE}/projects/${encodeURIComponent(projectId)}/state`);
    return res.data;
  },

  async getProjectOutputs(projectId) {
    const res = await axios.get(`${API_BASE}/projects/${encodeURIComponent(projectId)}/outputs`);
    return res.data;
  },

  async saveProjectState(projectId, stateKey, data) {
    const res = await axios.put(
      `${API_BASE}/projects/${encodeURIComponent(projectId)}/state/${encodeURIComponent(stateKey)}`,
      { data }
    );
    return res.data;
  },

  async getSystemHealth() {
    try {
      const res = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      return res.data;
    } catch (err) {
      return {
        status: "demo_fallback",
        ffmpeg_available: false,
        ffmpeg_path: null,
        gemini_configured: false,
        groq_configured: false,
        whisper_available: false,
        version: "1.2.0 (Offline Demo Mode)"
      };
    }
  },

  async uploadAsset(file, projectId, fileType = 'video', onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId);
    formData.append('file_type', fileType);

    const res = await axios.post(`${API_BASE}/assets/upload`, formData, {
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      }
    });
    return res.data;
  },

  async analyzePotential(assetId, provider = 'auto') {
    try {
      const res = await axios.post(`${API_BASE}/ai/analyze-potential`, {
        asset_id: assetId,
        provider: provider
      }, { timeout: 15000 });
      return res.data;
    } catch (err) {
      console.warn('Using client AI potential fallback:', err);
      return null;
    }
  },

  async analyzeRetention(assetId, provider = 'auto') {
    try {
      const res = await axios.post(`${API_BASE}/ai/analyze-retention`, {
        asset_id: assetId,
        provider: provider
      }, { timeout: 15000 });
      return res.data;
    } catch (err) {
      console.warn('Using client retention analysis fallback:', err);
      return null;
    }
  },

  async generateAbHooks(clipId, segmentText, tone = 'curious', audience = 'Creators & Engineers', provider = 'auto') {
    try {
      const res = await axios.post(`${API_BASE}/ai/ab-hooks`, {
        clip_id: clipId,
        segment_text: segmentText,
        tone: tone,
        audience: audience,
        provider: provider
      }, { timeout: 15000 });
      return res.data;
    } catch (err) {
      console.warn('Using client A/B hook lab fallback:', err);
      return null;
    }
  },

  async generatePlannerIdeas(topic, niche = 'Tech & AI', days = 7, provider = 'auto') {
    try {
      const res = await axios.post(`${API_BASE}/ai/planner-generate`, {
        topic: topic,
        niche: niche,
        days: days,
        provider: provider
      }, { timeout: 15000 });
      return res.data;
    } catch (err) {
      console.warn('Using client planner fallback:', err);
      return null;
    }
  },

  async matchScript(assetId, scriptText, scriptTitle = 'Script') {
    try {
      const res = await axios.post(`${API_BASE}/ai/script-match`, {
        asset_id: assetId,
        script_text: scriptText,
        script_title: scriptTitle
      }, { timeout: 180000 });
      return res.data;
    } catch (err) {
      const detail = err.response?.data?.detail;
      throw new Error(
        (typeof detail === 'string' ? detail : detail?.message) || err.message || 'Script matching failed'
      );
    }
  },

  async getProjectScripts(projectId, sourceAssetId) {
    const res = await axios.get(`${API_BASE}/projects/${encodeURIComponent(projectId)}/scripts`, {
      params: sourceAssetId ? { source_asset_id: sourceAssetId } : undefined
    });
    return res.data;
  },

  async getProjectClipCandidates(projectId, sourceAssetId, scriptVersionId) {
    const params = {};
    if (sourceAssetId) params.source_asset_id = sourceAssetId;
    if (scriptVersionId) params.script_version_id = scriptVersionId;
    const res = await axios.get(`${API_BASE}/projects/${encodeURIComponent(projectId)}/clip-candidates`, {
      params
    });
    return res.data;
  },

  async getProjectRenderJobs(projectId) {
    const res = await axios.get(`${API_BASE}/projects/${encodeURIComponent(projectId)}/render-jobs`);
    return res.data;
  },

  async generateContent(clipId, transcriptSegment, platform = 'instagram_reels', tone = 'curious', topic = 'AI Creator Workflow', provider = 'auto') {
    try {
      const res = await axios.post(`${API_BASE}/ai/generate-content`, {
        clip_id: clipId,
        transcript_segment: transcriptSegment,
        platform: platform,
        tone: tone,
        topic: topic,
        provider: provider
      }, { timeout: 15000 });
      return res.data;
    } catch (err) {
      console.warn('Using client AI content gen fallback:', err);
      return null;
    }
  },

  async transcribeMedia(assetId) {
    const res = await axios.post(
      `${API_BASE}/assets/${encodeURIComponent(assetId)}/transcript`,
      {},
      { timeout: 120000 }
    );
    return res.data;
  },

  async trimClip(assetId, videoUrl, startTime, endTime, aspectRatio = '9:16', clipId) {
    try {
      const res = await axios.post(`${API_BASE}/clips/trim`, {
        asset_id: assetId,
        clip_id: clipId,
        video_url: videoUrl,
        start_time: startTime,
        end_time: endTime,
        aspect_ratio: aspectRatio
      }, { timeout: 120000 });
      return res.data;
    } catch (err) {
      console.warn('Using client video export fallback:', err);
      return {
        task_id: `demo_${Date.now()}`,
        clip_id: `clip_${Date.now()}`,
        status: 'failed',
        progress: 0.0,
        output_filename: null,
        output_url: null,
        file_size_bytes: 0,
        duration_seconds: round(endTime - startTime, 2),
        error_message: 'FFmpeg server endpoint offline. Export disabled (Preview Mode Active).',
        ffmpeg_used: false
      };
    }
  }
};

function round(val, decimals) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}
