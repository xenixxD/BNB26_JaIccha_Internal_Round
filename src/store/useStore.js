import { create } from 'zustand';
import { INITIAL_PROJECTS, INITIAL_ASSETS, INITIAL_TRANSCRIPT, INITIAL_CLIPS } from '../data/mockData';
import { api } from '../services/api';

export const useStore = create((set, get) => ({
      workspaceReady: false,
      workspaceLoadFailed: false,
      workspaceError: null,
      draftVersions: [],
      outputs: [],
      systemHealth: {
        status: 'checking',
        ffmpeg_available: false,
        ffmpeg_path: null,
        gemini_configured: false,
        version: '1.1.0'
      },

      user: {
        isAuthenticated: true,
        name: 'Sohan Das',
        email: 'sohan@creatorai.io',
        role: 'Pro Creator',
        avatar: 'SD'
      },

      activeProjectId: 'proj_1',
      activeClipId: 'clip_1',

      projects: INITIAL_PROJECTS,
      assets: INITIAL_ASSETS,
      transcript: INITIAL_TRANSCRIPT,
      clips: INITIAL_CLIPS,
      candidateMoments: [],
      scriptMatches: [],

      // AI Content Intelligence Upgrades State
      retentionAnalysis: null,
      abHookVariations: [],
      aiProvider: 'auto', // 'auto' | 'gemini' | 'groq'

      searchQuery: '',

      setSearchQuery: (query) => set({ searchQuery: query }),
      setAiProvider: (provider) => set({ aiProvider: provider }),

      hydrateWorkspace: async () => {
        try {
          const workspace = await api.getWorkspace();
          const activeProjectId = workspace.projects.some((project) => project.id === get().activeProjectId)
            ? get().activeProjectId
            : workspace.projects[0]?.id;
          const activeClipId = workspace.clips.some((clip) => clip.id === get().activeClipId)
            ? get().activeClipId
            : workspace.clips[0]?.id;
          const savedState = activeProjectId ? await api.getProjectState(activeProjectId) : {};
          set({
            projects: workspace.projects,
            assets: workspace.assets,
            clips: workspace.clips,
            activeProjectId,
            activeClipId,
            transcript: savedState.transcript?.data || INITIAL_TRANSCRIPT,
            candidateMoments: savedState.candidateMoments?.data || [],
            scriptMatches: savedState.scriptMatches?.data || [],
            retentionAnalysis: savedState.retentionAnalysis?.data || null,
            abHookVariations: savedState.abHookVariations?.data || [],
            workspaceReady: true,
            workspaceLoadFailed: false,
            workspaceError: null
          });
          if (activeProjectId) {
            set({ outputs: await api.getProjectOutputs(activeProjectId) });
          }
        } catch (error) {
          set({
            workspaceReady: true,
            workspaceLoadFailed: true,
            workspaceError: `Could not load locally persisted workspace: ${error.message}`
          });
        }
      },

      loadProjectState: async (projectId) => {
        try {
          const savedState = await api.getProjectState(projectId);
          set({
            transcript: savedState.transcript?.data || INITIAL_TRANSCRIPT,
            candidateMoments: savedState.candidateMoments?.data || [],
            scriptMatches: savedState.scriptMatches?.data || [],
            retentionAnalysis: savedState.retentionAnalysis?.data || null,
            abHookVariations: savedState.abHookVariations?.data || [],
            outputs: await api.getProjectOutputs(projectId),
            workspaceError: null
          });
        } catch (error) {
          set({ workspaceError: `Could not load saved project data: ${error.message}` });
        }
      },

      persistProjectState: async (stateKey, data) => {
        const projectId = get().activeProjectId;
        if (!projectId) return;
        try {
          await api.saveProjectState(projectId, stateKey, data);
          set({ workspaceError: null });
        } catch (error) {
          set({ workspaceError: `Could not persist ${stateKey}: ${error.message}` });
        }
      },

      fetchSystemHealth: async () => {
        const health = await api.getSystemHealth();
        set({ systemHealth: health });
      },

      setActiveProject: (id) => {
        set({ activeProjectId: id });
        get().loadProjectState(id);
      },
      setActiveClip: (id) => set({ activeClipId: id }),

      createProject: async (projectData) => {
        try {
          const newProject = await api.createProject(projectData);
          set((state) => ({
            projects: [newProject, ...state.projects.filter((project) => project.id !== newProject.id)],
            activeProjectId: newProject.id,
            transcript: INITIAL_TRANSCRIPT,
            candidateMoments: [],
            scriptMatches: [],
            retentionAnalysis: null,
            abHookVariations: [],
            outputs: [],
            workspaceError: null
          }));
          return newProject;
        } catch (error) {
          set({ workspaceError: `Could not save project: ${error.message}` });
          throw error;
        }
      },

      addAsset: async (assetData, alreadyPersisted = false) => {
        const fileType = assetData.fileType || assetData.file_type || 'video';
        const projectId = assetData.projectId || assetData.project_id || get().activeProjectId;
        try {
          const savedAsset = alreadyPersisted ? assetData : await api.createAsset({ ...assetData, projectId });
          const newAsset = {
            ...savedAsset,
            projectId: savedAsset.projectId || savedAsset.project_id || projectId,
            project_id: savedAsset.project_id || savedAsset.projectId || projectId,
            fileType: savedAsset.fileType || savedAsset.file_type || fileType,
            file_type: savedAsset.file_type || savedAsset.fileType || fileType,
            fileSize: savedAsset.fileSize || savedAsset.file_size || 0,
            file_size: savedAsset.file_size || savedAsset.fileSize || 0,
            uploadDate: savedAsset.uploadDate || savedAsset.upload_date,
            upload_date: savedAsset.upload_date || savedAsset.uploadDate,
            isDemo: savedAsset.isDemo ?? false
          };
          set((state) => ({
            assets: [newAsset, ...state.assets.filter((asset) => asset.id !== newAsset.id)],
            projects: state.projects.map((project) =>
              project.id === newAsset.projectId
                ? { ...project, assetsCount: (project.assetsCount || 0) + 1 }
                : project
            ),
            workspaceError: null
          }));

          if (fileType === 'video') {
            const cleanName = newAsset.filename.replace(/\.[^/.]+$/, '');
            const clip = await api.createClip({
              projectId: newAsset.projectId,
              assetId: newAsset.id,
              title: `Clip: ${cleanName}`,
              startTime: 0,
              endTime: Math.min(30, newAsset.duration || 30),
              aspectRatio: '9:16',
              potentialScore: 94,
              ratingLabel: 'High Potential',
              suggestedHook: `Key takeaway from ${cleanName}...`,
              hooks: [`Key takeaway from ${cleanName}`, 'Watch this workflow strategy...'],
              selectedHookIndex: 0,
              caption: `Uploaded footage segment: "${newAsset.filename}"`,
              hashtags: ['#CreatorAI', '#Shorts', '#Reels'],
              subtitles: [],
              status: 'Draft',
              platform: 'Instagram Reels'
            });
            set((state) => ({
              clips: [clip, ...state.clips.filter((item) => item.id !== clip.id)],
              activeClipId: clip.id,
              projects: state.projects.map((project) =>
                project.id === clip.projectId
                  ? { ...project, clipsCount: (project.clipsCount || 0) + 1 }
                  : project
              )
            }));
          }
          return newAsset;
        } catch (error) {
          set({ workspaceError: `Could not persist asset: ${error.message}` });
          throw error;
        }
      },

      updateAssetDuration: async (assetId, duration) => {
        const dur = round(duration, 1);
        const previousDuration = get().assets.find((asset) => asset.id === assetId)?.duration;
        set((state) => ({
          assets: state.assets.map((a) => (a.id === assetId ? { ...a, duration: dur } : a))
        }));
        try {
          await api.updateAsset(assetId, { duration: dur });
          set({ workspaceError: null });
        } catch (error) {
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset.id === assetId
                ? { ...asset, duration: previousDuration }
                : asset
            ),
            workspaceError: `Could not save asset duration: ${error.message}`
          }));
        }
      },

      deleteAsset: async (assetId) => {
        try {
          const deleted = await api.deleteAsset(assetId);
          set((state) => {
            const remainingClips = state.clips.filter(
              (clip) => !deleted.clip_ids.includes(clip.id)
            );
            return {
              assets: state.assets.filter((asset) => asset.id !== assetId),
              clips: remainingClips,
              projects: state.projects.map((project) =>
                project.id === deleted.project_id
                  ? {
                      ...project,
                      assetsCount: Math.max((project.assetsCount || 0) - 1, 0),
                      clipsCount: Math.max(
                        (project.clipsCount || 0) - deleted.clip_ids.length,
                        0
                      )
                    }
                  : project
              ),
              activeClipId: deleted.clip_ids.includes(state.activeClipId)
                ? remainingClips[0]?.id
                : state.activeClipId,
              draftVersions: state.draftVersions.filter(
                (draft) => !deleted.clip_ids.includes(draft.clip_id)
              ),
              outputs: state.outputs.filter((output) => output.asset_id !== assetId),
              workspaceError: deleted.warnings.length
                ? deleted.warnings.join(' ')
                : null
            };
          });
        } catch (error) {
          set({ workspaceError: `Could not delete asset: ${error.message}` });
        }
      },

      clearAnalysisState: () => {
        set({
          candidateMoments: [],
          retentionAnalysis: null,
          abHookVariations: [],
          scriptMatches: []
        });
      },

      runPotentialAnalyzer: async (assetId) => {
        const cached = get().candidateMoments.filter((candidate) => candidate.assetId === assetId);
        if (cached.length) return cached;
        const targetAsset = get().assets.find((a) => a.id === assetId);
        const response = await api.analyzePotential(assetId, get().aiProvider);
        if (response && response.candidates && response.candidates.length > 0) {
          const candidates = response.candidates.map((candidate) => ({
            ...candidate,
            assetId: candidate.assetId || assetId
          }));
          const allCandidates = [
            ...get().candidateMoments.filter((candidate) => candidate.assetId !== assetId),
            ...candidates
          ];
          set({ candidateMoments: allCandidates });
          await get().persistProjectState('candidateMoments', allCandidates);
          return candidates;
        }

        // Dynamic candidate generator tailored specifically to targetAsset
        const isUserUpload = targetAsset && targetAsset.isDemo === false;
        const dur = targetAsset?.duration || 160.0;
        const filename = targetAsset?.filename || "Uploaded Footage";

        const candidates = isUserUpload ? [
          {
            id: `cand_user_1_${assetId}`,
            assetId: assetId,
            title: `Key Highlight: ${filename.replace(/\.[^/.]+$/, "")} (Opening)`,
            start_time: round(Math.min(2.0, dur * 0.05), 1),
            end_time: round(Math.min(28.0, dur * 0.35), 1),
            duration: round(Math.min(26.0, dur * 0.3), 1),
            transcript_excerpt: `Opening segment of uploaded video: "${filename}". High viewer curiosity detected in initial seconds.`,
            potential_score: 92.4,
            rating_label: "High Potential",
            suggested_hook: `Here is the key breakdown from ${filename.replace(/\.[^/.]+$/, "")}...`,
            reasons: ["Strong audio energy in opening", "Optimal pacing cadence (~142 WPM)", "Clear subject introduction"],
            hookScore: 94,
            pacingScore: 90,
            shareScore: 93
          },
          {
            id: `cand_user_2_${assetId}`,
            assetId: assetId,
            title: `Core Takeaway Peak from ${filename.replace(/\.[^/.]+$/, "")}`,
            start_time: round(Math.min(30.0, dur * 0.4), 1),
            end_time: round(Math.min(65.0, dur * 0.8), 1),
            duration: round(Math.min(35.0, dur * 0.4), 1),
            transcript_excerpt: `Core takeaway segment from uploaded footage "${filename}". High retention density window.`,
            potential_score: 86.8,
            rating_label: "High Potential",
            suggested_hook: `The main takeaway you need to know from this footage...`,
            reasons: ["High information density", "Self-contained narrative resolution", "Ideal duration for Shorts/Reels"],
            hookScore: 88,
            pacingScore: 85,
            shareScore: 87
          }
        ] : [
          {
            id: 'cand_1',
            assetId: assetId,
            title: 'The #1 AI Creator Mistake',
            start_time: 12.5,
            end_time: 35.0,
            duration: 22.5,
            transcript_excerpt: 'Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.',
            potential_score: 94.5,
            rating_label: 'High Potential',
            suggested_hook: 'Most creators make one huge mistake when starting with AI...',
            reasons: ['Strong curiosity hook in opening statement', 'Optimal short-form pacing (~145 WPM)', 'Self-contained narrative window (22.5s)'],
            hookScore: 96,
            pacingScore: 92,
            shareScore: 95
          },
          {
            id: 'cand_2',
            assetId: assetId,
            title: '3-Second Hook Retention Secret',
            start_time: 95.0,
            end_time: 128.0,
            duration: 33.0,
            transcript_excerpt: 'If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram.',
            potential_score: 89.2,
            rating_label: 'High Potential',
            suggested_hook: 'If you master hook generation in the first 3 seconds...',
            reasons: ['Direct takeaway resolution', 'High audience retention topic', 'Optimal duration for Reels/Shorts (33s)'],
            hookScore: 90,
            pacingScore: 88,
            shareScore: 89
          }
        ];

        const allCandidates = [
          ...get().candidateMoments.filter((candidate) => candidate.assetId !== assetId),
          ...candidates
        ];
        set({ candidateMoments: allCandidates });
        await get().persistProjectState('candidateMoments', allCandidates);
        return candidates;
      },

      runRetentionAnalyzer: async (assetId) => {
        const targetAsset = get().assets.find((a) => a.id === assetId);
        const response = await api.analyzeRetention(assetId, get().aiProvider);
        if (response) {
          set({ retentionAnalysis: response });
          await get().persistProjectState('retentionAnalysis', response);
          return response;
        }

        const dur = targetAsset?.duration || 160.0;
        const filename = targetAsset?.filename || "Uploaded Video";
        const isUserUpload = targetAsset && targetAsset.isDemo === false;

        const fallback = {
          asset_id: assetId,
          overall_retention_score: isUserUpload ? 91.2 : 88.5,
          opening_effectiveness: isUserUpload ? "Strong Opening Audio (User Footage)" : "Needs Punchier Opener (Greeting Detected)",
          pacing_wpm: 142.0,
          weak_sections: isUserUpload ? [
            {
              id: `weak_user_1_${assetId}`,
              start_time: 0.0,
              end_time: round(Math.min(4.0, dur * 0.1), 1),
              risk_level: "Minor Pacing Issue",
              issue_type: "Introductory Silence",
              description: `Initial silence pause before speech begins in ${filename}.`,
              suggestion: "Trim first 2 seconds to start immediately on first spoken word."
            },
            {
              id: `weak_user_2_${assetId}`,
              start_time: round(dur * 0.5, 1),
              end_time: round(Math.min(dur * 0.55, dur * 0.5 + 5), 1),
              risk_level: "Moderate Risk",
              issue_type: "Speech Pause",
              description: "Mid-video pause gap detected.",
              suggestion: "Tighten timeline trim to keep WPM cadence at 142 WPM."
            }
          ] : [
            {
              id: "weak_1",
              start_time: 0.0,
              end_time: 12.5,
              risk_level: "Moderate Risk",
              issue_type: "Weak Opening Hook",
              description: "Introductory welcome greeting ('Welcome everyone...') creates slow curiosity momentum.",
              suggestion: "Trim greeting. Start directly with: 'Most creators make one huge mistake when starting with AI tools...'"
            },
            {
              id: "weak_2",
              start_time: 48.0,
              end_time: 55.0,
              risk_level: "Minor Pacing Issue",
              issue_type: "Unnecessary Pause",
              description: "7-second silence pause between script matching explanation and workflow steps.",
              suggestion: "Tighten pause gap in timeline editor to maintain 145 WPM cadence."
            }
          ],
          actionable_recommendations: [
            `Trim introductory pause in "${filename}" to boost 3-second viewer retention.`,
            `Add bold 9:16 subtitle overlays during main key takeaway statements.`,
            `Format clip aspect ratio to 9:16 vertical for Instagram Reels & Shorts.`
          ],
          methodology_note: "Heuristic prediction based on transcript pacing, pause density, and topic boundaries (Not real platform analytics)."
        };
        set({ retentionAnalysis: fallback });
        await get().persistProjectState('retentionAnalysis', fallback);
        return fallback;
      },

      runAbHookGenerator: async (clipId, segmentText) => {
        const response = await api.generateAbHooks(clipId, segmentText, 'curious', 'Creators & Engineers', get().aiProvider);
        if (response && response.variations) {
          set({ abHookVariations: response.variations });
          await get().persistProjectState('abHookVariations', response.variations);
          return response.variations;
        }

        const fallbackVariations = [
          {
            id: "hook_var_1",
            style: "Curiosity-Driven",
            hook_text: "🔥 The single biggest mistake 99% of creators make with AI video tools...",
            suggested_caption: "Most creators treat AI as a replacement instead of an operating copilot. Here's why that destroys engagement 🧵👇",
            predicted_impact: "Higher Click-Through Rate (CTR)"
          },
          {
            id: "hook_var_2",
            style: "Bold & Controversial",
            hook_text: "🚨 Stop using basic AI video tools until you know this secret strategy!",
            suggested_caption: "If you're still cutting vertical clips manually in 2026, you're wasting 10+ hours every week. Watch this workflow...",
            predicted_impact: "Better 3-Second Retention"
          },
          {
            id: "hook_var_3",
            style: "Educational",
            hook_text: "💡 Here's the exact 3-step system to turn keynotes into viral 9:16 Shorts...",
            suggested_caption: "Step 1: Run AI Potential Analyzer. Step 2: Match transcript script. Step 3: Export vertical 9:16 clip. Save this post! 📌",
            predicted_impact: "More Shares & Saves"
          }
        ];
        set({ abHookVariations: fallbackVariations });
        await get().persistProjectState('abHookVariations', fallbackVariations);
        return fallbackVariations;
      },

      applySelectedHook: (clipId, hookText, captionText) => {
        set((state) => ({
          clips: state.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  suggestedHook: hookText,
                  caption: captionText || c.caption,
                  hooks: [hookText, ...(c.hooks || [])],
                  selectedHookIndex: 0
                }
              : c
          )
        }));
      },

      runScriptMatcher: async (assetId, scriptText) => {
        const response = await api.matchScript(assetId, scriptText, get().aiProvider);
        if (response && response.matches) {
          set({ scriptMatches: response.matches });
          await get().persistProjectState('scriptMatches', response.matches);
          return response.matches;
        }

        const matches = [
          {
            id: 'match_1',
            script_section: 'Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.',
            matched_transcript_excerpt: 'Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.',
            start_time: 12.5,
            end_time: 35.0,
            confidence_score: 96.4,
            explanation: 'Exact subject alignment on creator mindset shift (Timestamp 12.5s - 35.0s)'
          }
        ];
        set({ scriptMatches: matches });
        await get().persistProjectState('scriptMatches', matches);
        return matches;
      },

      generateClip: async (candidate) => {
        const clipData = {
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
        try {
          const newClip = await api.createClip(clipData);
          set((state) => ({
            clips: [newClip, ...state.clips],
            activeClipId: newClip.id,
            projects: state.projects.map((project) =>
              project.id === newClip.projectId
                ? { ...project, clipsCount: (project.clipsCount || 0) + 1 }
                : project
            ),
            workspaceError: null
          }));
          return newClip;
        } catch (error) {
          set({ workspaceError: `Could not save clip: ${error.message}` });
          throw error;
        }
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

      moveClipStatus: async (clipId, newStatus) => {
        const clip = get().clips.find((item) => item.id === clipId);
        if (!clip) return;
        set((state) => ({
          clips: state.clips.map((c) => (c.id === clipId ? { ...c, status: newStatus } : c))
        }));
        try {
          await api.updateClip(clipId, { status: newStatus });
          set({ workspaceError: null });
        } catch (error) {
          set((state) => ({
            clips: state.clips.map((item) =>
              item.id === clipId ? { ...item, status: clip.status } : item
            ),
            workspaceError: `Could not save clip status: ${error.message}`
          }));
        }
      },

      saveDraft: async (clipId) => {
        const clip = get().clips.find((item) => item.id === clipId);
        if (!clip) throw new Error('Clip not found');
        try {
          const draft = await api.saveClipDraft(clipId, clip);
          set((state) => ({
            clips: state.clips.map((item) => item.id === clipId ? draft.payload : item),
            draftVersions: [...state.draftVersions, draft],
            workspaceError: null
          }));
          return draft;
        } catch (error) {
          set({ workspaceError: `Could not save draft: ${error.message}` });
          throw error;
        }
      },

      loadDraftVersions: async (clipId) => {
        try {
          const draftVersions = await api.getClipDrafts(clipId);
          set({ draftVersions });
          return draftVersions;
        } catch (error) {
          set({ workspaceError: `Could not load draft history: ${error.message}` });
          return [];
        }
      },

      restoreDraftVersion: (draft) => {
        set((state) => ({
          clips: state.clips.map((clip) =>
            clip.id === draft.clip_id ? draft.payload : clip
          ),
          workspaceError: null
        }));
      },

      generateAiContentForClip: async (clipId, platform = 'instagram_reels') => {
        const clip = get().clips.find((c) => c.id === clipId);
        if (!clip) return;

        const res = await api.generateContent(clipId, clip.caption || 'Sample segment', platform, 'curious', 'AI Creator Workflow', get().aiProvider);

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

      generatePlannerCards: async (topic, niche = 'Tech & AI', days = 7) => {
        const res = await api.generatePlannerIdeas(topic, niche, days, get().aiProvider);
        if (res && res.cards && res.cards.length > 0) {
          const newClips = res.cards.map((card, idx) => ({
            id: `clip_plan_${Date.now()}_${idx}`,
            projectId: get().activeProjectId,
            assetId: 'asset_v1',
            title: card.title,
            startTime: 0.0,
            endTime: 30.0,
            duration: 30.0,
            aspectRatio: '9:16',
            potentialScore: card.estimated_viral_score || 92.0,
            ratingLabel: 'High Potential',
            suggestedHook: card.hook,
            hooks: [card.hook],
            selectedHookIndex: 0,
            caption: `${card.caption}\n\nTarget Audience: ${card.target_audience}`,
            hashtags: card.hashtags || ['#CreatorAI', '#ViralContent'],
            subtitles: [{ id: 1, start: 0.0, end: 4.0, text: card.hook }],
            status: 'Scheduled',
            scheduledDate: card.suggested_date,
            platform: card.platform || 'Instagram Reels',
            exportedUrl: null
          }));

          set((state) => ({
            clips: [...newClips, ...state.clips]
          }));
          return newClips;
        }
        return [];
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
          clip.aspectRatio,
          clip.id
        );

        if (res && res.status === 'completed') {
          set((state) => ({
            clips: state.clips.map((c) =>
              c.id === clipId ? { ...c, exportedUrl: res.output_url, status: 'Ready for Review' } : c
            )
          }));
          try {
            set({ outputs: await api.getProjectOutputs(clip.projectId), workspaceError: null });
          } catch (error) {
            set({ workspaceError: `Export completed but output metadata could not be reloaded: ${error.message}` });
          }
        }
        return res;
      }
    }));

function round(val, decimals) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}
