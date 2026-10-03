# Repository Audit Summary

## Current state
- Frontend: React + Vite app with Zustand and local storage persistence
- Client binary storage: IndexedDB through idb-keyval
- Backend: Python FastAPI app with Pydantic schemas
- Media processing: FFmpeg wrapper for video trimming and export
- AI/demo layer: heuristic transcript scoring and script matching fallback

## Existing gaps vs. required implementation
- No Firestore or database layer yet
- No provider-neutral storage abstraction yet
- No Google Cloud or Gemini integration yet
- No transcription pipeline or provider adapter yet
- No typed domain models for persistent project data
- No tests for database/storage/AI modules

## Strategy
- Build new implementation modules in dedicated new directories
- Keep legacy files untouched until the new layers are validated
- Preserve current frontend/backend boundary compatibility
