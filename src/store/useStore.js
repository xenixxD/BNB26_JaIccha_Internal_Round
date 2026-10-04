import { create } from 'zustand';
import { api } from '../services/api';

let projectLoadRequestId = 0;
let draftLoadRequestId = 0;

export const useStore = create((set, get) => ({
      workspaceReady: false,
      workspaceLoadFailed: false,
      workspaceError: null,
      projectStateLoadingId: null,
      projectStateLoadFailed: false,
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
        isAuthenticated: false,
        name: 'Local workspace',
        email: '',
        role: 'On this device',
        avatar: 'W'
      },

      activeProjectId: null,
      activeClipId: null,
      editorUnsavedChanges: false,
      setEditorUnsavedChanges: (editorUnsavedChanges) => set({ editorUnsavedChanges }),
      editorSavingDraft: false,
      setEditorSavingDraft: (editorSavingDraft) => set({ editorSavingDraft }),
      editorSavedClip: null,
      setEditorSavedClip: (editorSavedClip) => set({ editorSavedClip }),
      discardEditorChanges: () => {
        const savedClip = get().editorSavedClip;
        if (savedClip) {
          set((state) => ({
            clips: state.clips.map((clip) => clip.id === savedClip.id
              ? { ...savedClip, status: clip.status, exportedUrl: clip.exportedUrl, createdAt: clip.createdAt, updatedAt: clip.updatedAt }
              : clip),
            editorUnsavedChanges: false
          }));
        } else {
          set({ editorUnsavedChanges: false });
        }
      },

      projects: [],
      assets: [],
      transcript: [],
      clips: [],
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
        const requestId = ++projectLoadRequestId;
        try {
          const workspace = await api.getWorkspace();
          // Older frontend versions wrote a high-scoring draft when a source video
          // was uploaded. Keep those rows in storage, but don't present them as real clips.
          const visibleClips = workspace.clips.filter((clip) => !isUploadPlaceholderClip(clip));
          const visibleProjects = workspace.projects.map((project) => ({
            ...project,
            clipsCount: visibleClips.filter((clip) => clip.projectId === project.id).length
          }));
          if (requestId !== projectLoadRequestId) return;
          const activeProjectId = workspace.projects.some((project) => project.id === get().activeProjectId)
            ? get().activeProjectId
            : visibleProjects[0]?.id || null;
          const activeClipId = visibleClips.some((clip) => clip.id === get().activeClipId && clip.projectId === activeProjectId)
            ? get().activeClipId
            : visibleClips.find((clip) => clip.projectId === activeProjectId)?.id || null;
          const [savedState, outputs] = activeProjectId
            ? await Promise.all([api.getProjectState(activeProjectId), api.getProjectOutputs(activeProjectId)])
            : [{}, []];
          if (requestId !== projectLoadRequestId) return;
          set({
            projects: visibleProjects,
            assets: workspace.assets,
            clips: visibleClips,
            activeProjectId,
            activeClipId,
            transcript: savedState.transcript?.data || [],
            candidateMoments: (savedState.candidateMoments?.data || []).filter((candidate) => !isUploadFallbackCandidate(candidate)),
            scriptMatches: savedState.scriptMatches?.data || [],
            retentionAnalysis: savedState.retentionAnalysis?.data || null,
            abHookVariations: savedState.abHookVariations?.data || [],
            outputs,
            workspaceReady: true,
            workspaceLoadFailed: false,
            workspaceError: null
          });
        } catch (error) {
          if (requestId !== projectLoadRequestId) return;
          set({
            workspaceReady: true,
            workspaceLoadFailed: true,
            workspaceError: 'Could not load the saved workspace. Check the server connection and try again.'
          });
        }
      },

      loadProjectState: async (projectId) => {
        const requestId = ++projectLoadRequestId;
        set({ projectStateLoadingId: projectId, projectStateLoadFailed: false, workspaceError: null });
        try {
          const [savedState, outputs] = await Promise.all([
            api.getProjectState(projectId),
            api.getProjectOutputs(projectId)
          ]);
          if (requestId !== projectLoadRequestId || get().activeProjectId !== projectId) return;
          set({
            transcript: savedState.transcript?.data || [],
            candidateMoments: (savedState.candidateMoments?.data || []).filter((candidate) => !isUploadFallbackCandidate(candidate)),
            scriptMatches: savedState.scriptMatches?.data || [],
            retentionAnalysis: savedState.retentionAnalysis?.data || null,
            abHookVariations: savedState.abHookVariations?.data || [],
            outputs,
            projectStateLoadingId: null,
            projectStateLoadFailed: false,
            workspaceError: null
          });
        } catch (error) {
          if (requestId !== projectLoadRequestId || get().activeProjectId !== projectId) return;
          set({ projectStateLoadFailed: true, workspaceError: 'Could not load this project’s saved data. Try loading it again.' });
        } finally {
          if (requestId === projectLoadRequestId) set({ projectStateLoadingId: null });
        }
      },

      persistProjectState: async (stateKey, data, projectIdOverride) => {
        const projectId = projectIdOverride || get().activeProjectId;
        if (!projectId) throw new Error('Select a project before saving project data.');
        try {
          await api.saveProjectState(projectId, stateKey, data);
          set({ workspaceError: null });
        } catch (error) {
          set({ workspaceError: `Could not save ${stateKey}. Check the server connection and try again.` });
          throw error;
        }
      },

      fetchSystemHealth: async () => {
        const health = await api.getSystemHealth();
        set({ systemHealth: health });
      },

      setActiveProject: (id) => {
        ++projectLoadRequestId;
        const nextClipId = get().clips.find((clip) => clip.projectId === id)?.id || null;
        set({ activeProjectId: id, activeClipId: nextClipId, editorUnsavedChanges: false, editorSavedClip: null, projectStateLoadingId: id || null, projectStateLoadFailed: false,
          draftVersions: [], transcript: [], candidateMoments: [], scriptMatches: [], retentionAnalysis: null, abHookVariations: [], outputs: [] });
        if (id) get().loadProjectState(id);
        else set({ projectStateLoadingId: null });
      },
      setActiveClip: (id) => set({ activeClipId: id, draftVersions: [] }),

      createProject: async (projectData) => {
        try {
          const newProject = await api.createProject(projectData);
          ++projectLoadRequestId;
          get().discardEditorChanges();
          set((state) => ({
            projects: [newProject, ...state.projects.filter((project) => project.id !== newProject.id)],
            activeProjectId: newProject.id,
            activeClipId: null,
            editorUnsavedChanges: false,
            editorSavedClip: null,
            projectStateLoadingId: null,
            projectStateLoadFailed: false,
            draftVersions: [],
            transcript: [],
            candidateMoments: [],
            scriptMatches: [],
            retentionAnalysis: null,
            abHookVariations: [],
            outputs: [],
            workspaceError: null
          }));
          return newProject;
        } catch (error) {
          set({ workspaceError: readableStoreError(error, 'Could not create this project. Try again.') });
          throw error;
        }
      },

      deleteProject: async (projectId) => {
        try {
          const deleted = await api.deleteProject(projectId);
          const deletingActiveProject = get().activeProjectId === projectId;
          const remainingProjects = get().projects.filter(
            (project) => project.id !== projectId
          );
          const nextProjectId = deletingActiveProject
            ? remainingProjects[0]?.id || null
            : get().activeProjectId;
          const remainingAssets = get().assets.filter(
            (asset) => asset.projectId !== projectId && asset.project_id !== projectId
          );
          const remainingClips = get().clips.filter(
            (clip) => clip.projectId !== projectId
          );
          const nextActiveClipId = remainingClips.some(
            (clip) => clip.id === get().activeClipId
          )
            ? get().activeClipId
            : remainingClips.find((clip) => clip.projectId === nextProjectId)?.id || null;

          set({
            projects: remainingProjects,
            assets: remainingAssets,
            clips: remainingClips,
            activeProjectId: nextProjectId,
            activeClipId: nextActiveClipId,
            draftVersions: get().draftVersions.filter(
              (draft) => draft.project_id !== projectId
            ),
            outputs: get().outputs.filter(
              (output) => output.project_id !== projectId
            ),
            workspaceError: deleted.warnings.length
              ? deleted.warnings.join(' ')
              : null
          });

          if (!deletingActiveProject) return deleted;
          if (nextProjectId) {
            await get().loadProjectState(nextProjectId);
          } else {
            set({
              transcript: [],
              candidateMoments: [],
              scriptMatches: [],
              retentionAnalysis: null,
              abHookVariations: [],
              outputs: []
            });
          }
          return deleted;
        } catch (error) {
          set({ workspaceError: readableStoreError(error, 'Could not delete this project. Try again.') });
          throw error;
        }
      },

      addAsset: async (assetData, alreadyPersisted = false) => {
        const fileType = assetData.fileType || assetData.file_type || 'video';
        const projectId = assetData.projectId || assetData.project_id || get().activeProjectId;
        if (!projectId) {
          throw new Error('Create a project before adding assets.');
        }
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
                ? { ...project, assetsCount: (project.assetsCount || 0) + (newAsset.duplicate ? 0 : 1) }
                : project
            ),
            workspaceError: null
          }));

          return newAsset;
        } catch (error) {
          set({ workspaceError: readableStoreError(error, 'Could not save this asset. Try again.') });
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
            workspaceError: readableStoreError(error, 'Could not save the video duration.')
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
          set({ workspaceError: readableStoreError(error, 'Could not delete this asset. Try again.') });
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
        const projectId = get().assets.find((asset) => asset.id === assetId)?.projectId || get().activeProjectId;
        const priorCandidates = get().activeProjectId === projectId ? get().candidateMoments : [];
        const response = await api.analyzePotential(assetId, get().aiProvider);
        const candidates = (response?.candidates || []).map((candidate) => ({
          ...candidate,
          assetId: candidate.assetId || assetId
        }));
        const allCandidates = [
          ...priorCandidates.filter((candidate) => candidate.assetId !== assetId),
          ...candidates
        ];
        if (get().activeProjectId === projectId) set({ candidateMoments: allCandidates });
        await get().persistProjectState('candidateMoments', allCandidates, projectId);
        return candidates;
      },

      runRetentionAnalyzer: async (assetId) => {
        const projectId = get().assets.find((asset) => asset.id === assetId)?.projectId || get().activeProjectId;
        const response = await api.analyzeRetention(assetId, get().aiProvider);
        if (get().activeProjectId === projectId) set({ retentionAnalysis: response });
        await get().persistProjectState('retentionAnalysis', response, projectId);
        return response;
      },

      runAbHookGenerator: async (clipId, segmentText) => {
        const projectId = get().clips.find((clip) => clip.id === clipId)?.projectId || get().activeProjectId;
        const response = await api.generateAbHooks(clipId, segmentText, 'curious', 'Creators & Engineers', get().aiProvider);
        const variations = response?.variations || [];
        if (get().activeProjectId === projectId) set({ abHookVariations: variations });
        await get().persistProjectState('abHookVariations', variations, projectId);
        return variations;
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
      runScriptMatcher: async (assetId, scriptText, scriptTitle = 'Script') => {
        const projectId = get().assets.find((asset) => asset.id === assetId)?.projectId || get().activeProjectId;
        const priorMatches = get().activeProjectId === projectId ? get().scriptMatches : [];
        try {
          const response = await api.matchScript(
            assetId,
            scriptText,
            scriptTitle
          );
          const matches = response.matches.map((match) => ({
            ...match,
            assetId,
            projectId,
            scriptId: response.script_id,
            scriptVersionId: response.script_version_id,
            transcriptId: response.transcript_id
          }));
          const projectMatches = [
            ...priorMatches.filter((match) => match.assetId !== assetId),
            ...matches
          ];
          if (get().activeProjectId === projectId) set({ scriptMatches: projectMatches });
          await get().persistProjectState('scriptMatches', projectMatches, projectId);
          return {
            matches,
            scriptId: response.script_id,
            scriptVersionId: response.script_version_id,
            transcriptId: response.transcript_id
          };
        } catch (error) {
          if (get().activeProjectId === projectId) set({ workspaceError: readableStoreError(error, 'Could not match this script to the selected footage.') });
          throw error;
        }
      },

      generateClip: async (candidate) => {
        const startTime = candidate.start_time ?? candidate.startTime ?? 0.0;
        const endTime = candidate.end_time ?? candidate.endTime ?? startTime + 30.0;
        const clipData = {
          projectId: get().activeProjectId,
          assetId: candidate.assetId || null,
          title: candidate.title || 'Generated Clip',
          startTime,
          endTime,
          duration: round(endTime - startTime, 1),
          aspectRatio: '9:16',
          potentialScore: candidate.potential_score ?? candidate.potentialScore ?? null,
          ratingLabel: candidate.rating_label || 'Script match',
          suggestedHook: candidate.suggested_hook || null,
          hooks: candidate.suggested_hook ? [candidate.suggested_hook] : [],
          selectedHookIndex: 0,
          caption: candidate.transcript_excerpt || '',
          hashtags: [],
          subtitles: [],
          status: 'Draft',
          scheduledDate: null,
          platform: 'Instagram Reels',
          exportedUrl: null,
          metadata: candidate.scriptVersionId
            ? {
                sourceCandidateId: candidate.id,
                scriptId: candidate.scriptId,
                scriptVersionId: candidate.scriptVersionId,
                transcriptId: candidate.transcriptId,
                rankScore: candidate.confidence_score,
                matchReasons: candidate.reasons
              }
            : {}
        };
        try {
          const newClip = await api.createClip(clipData);
          set((state) => ({
            clips: [newClip, ...state.clips],
            activeClipId: state.activeProjectId === newClip.projectId ? newClip.id : state.activeClipId,
            projects: state.projects.map((project) =>
              project.id === newClip.projectId
                ? { ...project, clipsCount: (project.clipsCount || 0) + 1 }
                : project
            ),
            workspaceError: null
          }));
          return newClip;
        } catch (error) {
          set({ workspaceError: readableStoreError(error, 'Could not create this clip. Try again.') });
          throw error;
        }
      },

      updateClip: (clipId, updates) => {
        set((state) => ({
          clips: state.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c))
        }));
      },

      updateClipTimestamps: (clipId, startTime, endTime) => {
        const sourceDuration = get().assets.find((asset) => asset.id === get().clips.find((clip) => clip.id === clipId)?.assetId)?.duration;
        const maxTime = Number.isFinite(Number(sourceDuration)) && Number(sourceDuration) > 1 ? Number(sourceDuration) : Number.POSITIVE_INFINITY;
        const requestedStart = Number(startTime);
        const start = Math.max(0, Math.min(Number.isFinite(requestedStart) ? requestedStart : 0, maxTime - 1));
        const requestedEnd = Number(endTime);
        const end = Math.min(maxTime, Math.max(start + 1.0, Number.isFinite(requestedEnd) ? requestedEnd : start + 1));
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
            workspaceError: readableStoreError(error, 'Could not update this clip. Try again.')
          }));
          throw error;
        }
      },

      saveDraft: async (clipId) => {
        const clip = get().clips.find((item) => item.id === clipId);
        if (!clip) throw new Error('Clip not found');
        try {
          const draft = await api.saveClipDraft(clipId, clip);
          let unchangedWhileSaving = false;
          set((state) => {
            const latestClip = state.clips.find((item) => item.id === clipId);
            unchangedWhileSaving = JSON.stringify(latestClip) === JSON.stringify(clip);
            return {
            clips: state.clips.map((item) => item.id === clipId && unchangedWhileSaving ? draft.payload : item),
            draftVersions: [...state.draftVersions, draft],
            workspaceError: null
          }; });
          get().setEditorSavedClip(draft.payload);
          return draft;
        } catch (error) {
          set({ workspaceError: readableStoreError(error, 'Could not save this draft. Try again.') });
          throw error;
        }
      },

      loadDraftVersions: async (clipId) => {
        const requestId = ++draftLoadRequestId;
        try {
          const draftVersions = await api.getClipDrafts(clipId);
          if (requestId === draftLoadRequestId && get().activeClipId === clipId) set({ draftVersions });
          return draftVersions;
        } catch (error) {
          throw error;
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

        const res = await api.generateContent(clipId, clip.caption || '', platform, 'curious', 'AI Creator Workflow', get().aiProvider);

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
        return res?.items || res?.cards || [];
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
            const outputs = await api.getProjectOutputs(clip.projectId);
            if (get().activeProjectId === clip.projectId) set({ outputs, workspaceError: null });
          } catch (error) {
            set({ workspaceError: 'The video exported, but CreatorAI could not reload the output list. Reopen this project to refresh it.' });
          }
        }
        return res;
      }
    }));

function round(val, decimals) {
  return Number(Math.round(val + 'e' + decimals) + 'e-' + decimals);
}

function isUploadPlaceholderClip(clip) {
  return clip.title?.startsWith('Clip: ') &&
    clip.caption?.startsWith('Uploaded footage segment:') &&
    Number(clip.potentialScore) === 94;
}

function isUploadFallbackCandidate(candidate) {
  const fallbackReasons = Array.isArray(candidate.reasons) &&
    candidate.reasons.includes('Optimal short-form pacing') &&
    candidate.reasons.includes('Strong topic resonance') &&
    candidate.reasons.some((reason) => typeof reason === 'string' && reason.startsWith('Self-contained '));
  return candidate.id === 'cand_1' || candidate.id === 'cand_2' || candidate.id?.startsWith('cand_user_') || fallbackReasons;
}

function readableStoreError(error, fallback) {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;
  const message = typeof detail === 'string' ? detail : detail?.message;
  if (message) return message;
  if (!error.response && (error.isAxiosError || /network error|timeout/i.test(error.message || ''))) return 'CreatorAI could not reach the server. Check your connection and try again.';
  if (/request failed with status code/i.test(error.message || '')) return fallback;
  if (status === 404) return 'This item could not be found. Refresh the workspace and try again.';
  if (status === 401 || status === 403) return 'You do not have permission to perform this action.';
  if (status === 413) return 'This file is larger than the upload limit.';
  if (status === 400 || status === 422) return fallback;
  if (status >= 500) return 'CreatorAI could not complete this request. Try again.';
  return error.message || fallback;
}
