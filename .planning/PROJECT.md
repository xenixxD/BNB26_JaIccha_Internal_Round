# CreatorAI — Project Initialization

## Product
CreatorAI is a creator-focused AI production workspace that understands raw footage, aligns it with script intent, generates editable clip candidates, and supports export-ready edit plans.

## Scope
This tracked workflow covers the implementation branch for:
- Database foundation
- Storage abstraction and media handling
- AI provider interfaces and adapters
- Transcript and semantic matching logic
- EditPlan support and validation

## Constraints
- Do not modify existing production files until the new implementation layer is ready.
- Prefer creating new files under dedicated directories for database, storage, and AI modules.
- Preserve the existing frontend/backend integration boundary unless a new compatibility layer is required.
- Keep provider-specific logic isolated behind adapters.

## Repository baseline
- Frontend: React + Vite + Zustand
- Backend: FastAPI + Pydantic
- Local media handling: uploads/exports on disk
- Current implementation: demo and heuristic-oriented, not yet a real database/storage/AI implementation

## Canonical lifecycle
Upload -> Validate -> Transcribe -> Match -> Candidates -> EditPlan -> Creator Edit -> Render -> Export
