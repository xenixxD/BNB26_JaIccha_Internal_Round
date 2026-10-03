import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { INITIAL_PROJECTS, INITIAL_ASSETS, INITIAL_TRANSCRIPT, INITIAL_CLIPS } from '../data/mockData';
import { api } from '../services/api';

export const useStore = create(
  persist(
    (set, get) => ({
      // System Health State
      systemHealth: {
        status: 'checking',
        ffmpeg_available: false,
        ffmpeg_path: null,
        gemini_configured: false,
        version: '1.0.0'
      },

      // User State
      user: {
        isAuthenticated: true,
        name: 'Sohan Das',
        email: 'sohan@creatorai.io',
        role: 'Pro Creator',
        avatar: 'SD'
      },

      // Active Navigation & Workspace
      activeProjectId: 'proj_1',
      activeClipId: 'clip_1',

      // Data Collections
      projects: INITIAL_PROJECTS,
      assets: INITIAL_ASSETS,
      transcript: INITIAL_TRANSCRIPT,
      clips: INITIAL_CLIPS,
      candidateMoments: [],
      scriptMatches: [],

      // Search & Filters
      searchQuery: '',

      // ----------------------------------
      // ACTIONS
      // ----------------------------------

      setSearchQuery: (query) => set({ searchQuery: query }),

      fetchSystemHealth: async () => {
        const health = await api.getSystemHealth();
        set({ systemHealth: health });
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      setActiveClip: (id) => set({ activeClipId: id }),

      createProject: (projectData) => {
        const newProj = {
          id: `proj_${Date.now().toString(36)}`,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'Active',
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          assetsCount: 0,
          clipsCount: 0,
          ...projectData
        };
        set((state) => ({
          projects: [newProj, ...state.projects],
          activeProjectId: newProj.id
        }));
        return newProj;
      },

      addAsset: (assetData) => {
        const newAsset = {
          id: assetData.id || `asset_${Date.now().toString(36)}`,
          projectId: assetData.projectId || get().activeProjectId,
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'ready',
          ...assetData
        };
        set((state) => ({
          assets: [newAsset, ...state.assets],
          projects: state.projects.map((p) =>
            p.id === newAsset.projectId ? { ...p, assetsCount: p.assetsCount + 1 } : p
          )
        }));
        return newAsset;
      },

      deleteAsset: (assetId) => {
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== assetId)
        }));
      },

      // AI Video Potential Analyzer
      runPotentialAnalyzer: async (assetId) => {
        const response = await api.analyzePotential(assetId);
        if (response && response.candidates) {
          set({ candidateMoments: response.candidates });
          return response.candidates;
        }

        // Deterministic Fallback if API offline
        const transcript = get().transcript;
        const candidates = [
          {
            id: 'cand_1',
            title: 'The #1 AI Creator Mistake',
            start_time: 12.5,
            end_time: 35.0,
            duration: 22.5,
            transcript_excerpt: transcript[1]?.text || 'Most creators make one huge mistake when starting with AI tools...',
            potential_score: 94.5,
            rating_label: 'High Potential',
            suggested_hook: 'Most creators make one huge mistake when starting with AI...',
            reasons: ['Strong curiosity hook in opening statement', 'Optimal short-form pacing (~145 WPM)', 'Self-contained narrative window (22.5s)']
          },
          {
            id: 'cand_2',
            title: '3-Second Hook Retention Secret',
            start_time: 95.0,
            end_time: 128.0,
            duration: 33.0,
            transcript_excerpt: transcript[4]?.text || 'If you master hook generation in the first 3 seconds...',
            potential_score: 89.2,
            rating_label: 'High Potential',
            suggested_hook: 'If you master hook generation in the first 3 seconds...',
            reasons: ['Direct takeaway resolution', 'High audience retention topic', 'Optimal duration for Reels/Shorts (33s)']
          },
          {
            id: 'cand_3',
            title: 'Step-by-Step AI Video Workflow',
            start_time: 62.0,
            end_time: 95.0,
            duration: 33.0,
            transcript_excerpt: transcript[3]?.text || 'Here is the exact step-by-step workflow...',
            potential_score: 82.0,
            rating_label: 'Moderate Potential',
            suggested_hook: 'Here is the exact step-by-step workflow for creators...',
            reasons: ['Structured list format', 'Clear educational value', 'Slightly dense pacing (~160 WPM)']
          }
        ];
        set({ candidateMoments: candidates });
        return candidates;
      },

      // AI Script-to-Video Matcher
      runScriptMatcher: async (assetId, scriptText) => {
        const response = await api.matchScript(assetId, scriptText);
        if (response && response.matches) {
          set({ scriptMatches: response.matches });
          return response.matches;
        }

        // Fallback
        const matches = [
          {
            id: 'match_1',
            script_section: 'Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.',
            matched_transcript_excerpt: 'Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.',
            start_time: 12.5,
            end_time: 35.0,
            confidence_score: 96.4,
            explanation: 'Exact subject alignment on creator mindset shift (Timestamp 12.5s - 35.0s)'
          },
          {
            id: 'match_2',
            script_section: 'If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram.',
            matched_transcript_excerpt: 'If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram.',
            start_time: 95.0,
            end_time: 128.0,
            confidence_score: 91.8,
            explanation: 'Strong semantic match on hook optimization and platform growth (Timestamp 95.0s - 128.0s)'
          }
        ];
        set({ scriptMatches: matches });
        return matches;
      },

      // Generate Clip from Candidate / Selection
      generateClip: (candidate) => {
        const newClip = {
          id: `clip_${Date.now().toString(36)}`,
          projectId: get().activeProjectId,
          assetId: candidate.assetId || 'asset_v1',
          title: candidate.title || 'Generated Clip',
          startTime: candidate.start_time || candidate.startTime || 0.0,
          endTime: candidate.end_time || candidate.endTime || 30.0,
          duration: round((candidate.end_time || 30.0) - (candidate.start_time || 0.0), 1),
          aspectRatio: '9:16',
          potentialScore: candidate.potential_score || 90.0,
          ratingLabel: candidate.rating_label || 'High Potential',
          suggestedHook: candidate.suggested_hook || 'Check out this highlight!',
          hooks: [
            `🔥 ${candidate.suggested_hook || 'Check out this key highlight!'}`,
            `💡 Here is the secret strategy to level up your workflow...`,
            `🚀 Step-by-step breakdown for creators in 2026.`
          ],
          selectedHookIndex: 0,
          caption: `Key highlight: "${candidate.transcript_excerpt || 'AI workflow secret...'}"\n\nFollow for more creator insights!`,
          hashtags: ['#CreatorAI', '#VideoEditing', '#Shorts', '#Reels'],
          subtitles: [
            { id: 1, start: 0.0, end: 4.0, text: candidate.suggested_hook || 'Key Highlight' }
          ],
          status: 'Draft',
          scheduledDate: null,
          platform: 'Instagram Reels',
          exportedUrl: null
        };

        set((state) => ({
          clips: [newClip, ...state.clips],
          activeClipId: newClip.id,
          projects: state.projects.map((p) =>
            p.id === newClip.projectId ? { ...p, clipsCount: p.clipsCount + 1 } : p
          )
        }));

        return newClip;
      },

      updateClip: (clipId, updates) => {
        set((state) => ({
          clips: state.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c))
        }));
      },

      updateClipTimestamps: (clipId, startTime, endTime) => {
        const start = Math.max(0, Number(startTime));
        const end = Math.max(start + 1.0, Number(endTime));
        const duration = round(end - start, 1);
        set((state) => ({
          clips: state.clips.map((c) =>
            c.id === clipId ? { ...c, startTime: start, endTime: end, duration: duration } : c
          )
        }));
      },

      moveClipStatus: (clipId, newStatus) => {
        set((state) => ({
          clips: state.clips.map((c) => (c.id === clipId ? { ...c, status: newStatus } : c))
        }));
      },

      generateAiContentForClip: async (clipId, platform = 'instagram_reels') => {
        const clip = get().clips.find((c) => c.id === clipId);
        if (!clip) return;

        const res = await api.generateContent(clipId, clip.caption || 'Sample segment', platform);

        if (res) {
          set((state) => ({
            clips: state.clips.map((c) =>
              c.id === clipId
                ? {
                    ...c,
                    hooks: res.hooks,
                    caption: res.caption,
                    hashtags: res.hashtags,
                    subtitles: res.subtitles,
                    platform: platform === 'instagram_reels' ? 'Instagram Reels' : platform === 'youtube_shorts' ? 'YouTube Shorts' : platform === 'tiktok' ? 'TikTok' : 'LinkedIn'
                  }
                : c
            )
          }));
        }
      },

      exportClip: async (clipId) => {
        const clip = get().clips.find((c) => c.id === clipId);
        const asset = get().assets.find((a) => a.id === clip?.assetId);
        if (!clip) return { status: 'failed', error_message: 'Clip not found' };

        const res = await api.trimClip(
          clip.assetId,
          asset?.url || clip.videoUrl,
          clip.startTime,
          clip.endTime,
          clip.aspectRatio
        );

        if (res && res.status === 'completed') {
          set((state) => ({
            clips: state.clips.map((c) =>
              c.id === clipId ? { ...c, exportedUrl: res.output_url, status: 'Ready for Review' } : c
            )
          }));
        }
        return res;
      }
    }),
    {
      name: 'creator_ai_storage_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        assets: state.assets.map((a) => ({ ...a, blob: undefined })), // Do NOT store large blobs in localStorage!
        clips: state.clips,
        activeProjectId: state.activeProjectId,
        activeClipId: state.activeClipId,
        user: state.user
      })
    }
  )
);

function round(val, decimals) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}
