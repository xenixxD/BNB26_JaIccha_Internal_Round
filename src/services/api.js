import axios from 'axios';

const API_BASE = '/api';

export const api = {
  async getSystemHealth() {
    try {
      const res = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
      return res.data;
    } catch (err) {
      return {
        status: "demo_fallback",
        ffmpeg_available: false,
        ffmpeg_path: null,
        gemini_configured: false,
        version: "1.1.0 (Offline Demo Mode)"
      };
    }
  },

  async uploadAsset(file, projectId = 'proj_1', fileType = 'video', onProgress) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', projectId);
      formData.append('file_type', fileType);

      const res = await axios.post(`${API_BASE}/assets/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(pct);
          }
        }
      });
      return res.data;
    } catch (err) {
      console.warn('Backend upload server error:', err);
      throw err;
    }
  },

  async analyzePotential(assetId) {
    try {
      const res = await axios.post(`${API_BASE}/ai/analyze-potential`, { asset_id: assetId }, { timeout: 5000 });
      return res.data;
    } catch (err) {
      console.warn('Using client AI potential fallback:', err);
      return null;
    }
  },

  async analyzeRetention(assetId) {
    try {
      const res = await axios.post(`${API_BASE}/ai/analyze-retention`, { asset_id: assetId }, { timeout: 5000 });
      return res.data;
    } catch (err) {
      console.warn('Using client retention analysis fallback:', err);
      return null;
    }
  },

  async generateAbHooks(clipId, segmentText) {
    try {
      const res = await axios.post(`${API_BASE}/ai/ab-hooks`, { clip_id: clipId, segment_text: segmentText }, { timeout: 5000 });
      return res.data;
    } catch (err) {
      console.warn('Using client A/B hook lab fallback:', err);
      return null;
    }
  },

  async matchScript(assetId, scriptText) {
    try {
      const res = await axios.post(`${API_BASE}/ai/script-match`, { asset_id: assetId, script_text: scriptText }, { timeout: 5000 });
      return res.data;
    } catch (err) {
      console.warn('Using client script match fallback:', err);
      return null;
    }
  },

  async generateContent(clipId, transcriptSegment, platform = 'instagram_reels') {
    try {
      const res = await axios.post(`${API_BASE}/ai/generate-content`, {
        clip_id: clipId,
        transcript_segment: transcriptSegment,
        platform: platform
      }, { timeout: 5000 });
      return res.data;
    } catch (err) {
      console.warn('Using client AI content gen fallback:', err);
      return null;
    }
  },

  async trimClip(assetId, videoUrl, startTime, endTime, aspectRatio = '9:16') {
    try {
      const res = await axios.post(`${API_BASE}/clips/trim`, {
        asset_id: assetId,
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
