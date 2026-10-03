# CreatorAI

CreatorAI is a creator-workflow prototype for organizing long-form media and preparing short-form social clips. The app combines a React dashboard with a FastAPI service, local SQLite metadata persistence, local file uploads, FFmpeg-based trimming, and AI-assisted content tools.

> **Current status:** usable as a guided demo and development prototype. It is not a production-ready multi-user service. Some interface state and AI results are demo-oriented or heuristic, and media/database storage is local to the server machine.

## Contents

- [What the project does](#what-the-project-does)
- [Current implementation status](#current-implementation-status)
- [Technology stack](#technology-stack)
- [Repository layout](#repository-layout)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [Using the application](#using-the-application)
- [Backend API](#backend-api)
- [Data and media storage](#data-and-media-storage)
- [AI behavior](#ai-behavior)
- [Validation](#validation)
- [Known limitations and demo guidance](#known-limitations-and-demo-guidance)
- [Next steps toward a production MVP](#next-steps-toward-a-production-mvp)
- [Project attribution](#project-attribution)

## What the project does

The product concept is an AI-assisted workspace for turning long-form recordings into short-form content. The interface is organized around projects, uploaded assets, candidate clip moments, editing/export, planning, and analytics.

The current codebase provides:

- A React single-page application with dashboard, projects, assets, clip studio, video editor, planner, analytics, settings, and auth screens.
- A FastAPI backend for health reporting, basic project/asset/clip records, uploads, AI endpoints, and clip trimming.
- A SQLite database that persists project, asset, and clip metadata on the backend.
- Local disk storage for uploaded files and generated exports.
- FFmpeg processing to trim a local uploaded video and convert it to a requested aspect ratio.
- Gemini integration hooks, with heuristic/demo behavior when the provider is unavailable or unconfigured.
- Browser-side Zustand state persistence, which keeps much of the demo workspace state in the browser.

## Current implementation status

| Area | Current state | Important context |
|---|---|---|
| Frontend | React/Vite application builds | Several workflows still rely on seeded or browser-persisted demo state. |
| Backend | FastAPI service with health endpoint and API routes | Suitable for local development and guided demonstrations, not hardened for public exposure. |
| Database | SQLite persists projects, assets, and clips | Local file database; no migrations, user ownership, or production database configuration. |
| Uploads/exports | Local filesystem under `server/uploads` and `server/exports` | Not replicated, backed up, or stored in a cloud bucket. |
| Video processing | FFmpeg trim/export pipeline | Processing runs synchronously in the API request; long tasks can block a worker/request. |
| AI | Gemini client can be initialized from an environment key | Without a working key, the AI module uses heuristic/default transcript behavior. |
| Authentication | Auth screen and demo user state exist | No verified account system, sessions, or API authorization is implemented. |
| Deployment | Local development setup | No production deployment, monitoring, or multi-instance storage configuration is included. |

## Technology stack

### Frontend

- React 18
- Vite
- React Router
- Zustand with persistence middleware
- Axios
- Tailwind CSS
- Recharts
- Lucide React

### Backend

- Python 3
- FastAPI and Uvicorn
- Pydantic
- SQLite (`sqlite3`, included with Python)
- FFmpeg via `imageio-ffmpeg` or a system FFmpeg installation
- Optional Google Gemini SDK (`google-genai`)

## Repository layout

```text
.
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── App.jsx                 # Client-side routes
│   ├── components/             # Layout, common, and reusable UI components
│   ├── data/mockData.js        # Seed/demo frontend records
│   ├── pages/                  # Dashboard and workflow screens
│   ├── services/
│   │   ├── api.js              # HTTP API calls and client-side fallbacks
│   │   └── storage.js          # Browser storage helpers
│   └── store/useStore.js       # Zustand application state
└── server/
    ├── main.py                 # FastAPI application and endpoints
    ├── database.py             # SQLite schema, seed data, and CRUD helpers
    ├── schemas.py              # Request and response models
    ├── ai_engine.py            # Gemini integration and heuristic fallbacks
    ├── ffmpeg_service.py       # Media trim/export and task status
    ├── requirements.txt
    ├── uploads/                # Created at runtime; local uploaded media
    ├── exports/                # Created at runtime; generated media
    └── creatorai.db            # Created at runtime; SQLite database
```

The database and media directories are runtime data, not source files. Keep backups if local demo data must be preserved. Do not commit API keys, private media, or user data.

## Requirements

- Node.js and npm (use a current supported LTS release).
- Python 3.10 or newer is recommended.
- FFmpeg is optional for starting the app but required for actual video trimming/export. The backend first checks `imageio-ffmpeg`, then the system `PATH`, then common Windows install locations.
- A Gemini API key is optional. The app can run without one, but AI behavior will be heuristic/demo behavior.

## Run locally

Run the frontend and backend in separate terminals from the repository root.

### 1. Install frontend dependencies

```powershell
npm install
```

### 2. Create and install the Python environment

On Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r server\requirements.txt
```

If PowerShell blocks virtual-environment activation, invoke the environment's Python directly instead:

```powershell
.\.venv\Scripts\python.exe -m pip install -r server\requirements.txt
```

### 3. Start the backend

From the repository root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn server.main:app --reload --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`. Interactive API documentation is at `http://127.0.0.1:8000/docs`.

The first backend start creates the SQLite schema and seeds sample projects, assets, and clips if the project table is empty. Runtime uploads and exports are placed under `server\uploads` and `server\exports`.

### 4. Start the frontend

In another terminal, from the repository root:

```powershell
npm run dev
```

Open `http://localhost:3000`. Vite proxies `/api`, `/uploads`, and `/exports` requests to the backend at `http://localhost:8000`; keep the backend running while using server-backed features.

### Production frontend build

```powershell
npm run build
```

This produces a static bundle in `dist/`. The current project does not include a production deployment recipe or a production API-origin configuration.

## Configuration

The backend loads environment variables from a `.env` file found from the current working directory. Optional setting:

```dotenv
GEMINI_API_KEY=your_google_ai_studio_key
```

Keep `.env` out of version control. No key is required for the backend to start. The health endpoint reports whether a Gemini key is configured, but that only indicates configuration—not that a live AI request will succeed.

Other current settings, including the API proxy target, frontend/backend ports, and SQLite path, are configured in source rather than through a complete deployment configuration system:

- Vite dev server and proxy: `vite.config.js`
- SQLite database: `server/database.py` (`server/creatorai.db`)
- Upload/export directories: `server/ffmpeg_service.py`
- Gemini model/client: `server/ai_engine.py`

## Using the application

The main frontend routes are:

| Route | Screen |
|---|---|
| `/` | Dashboard |
| `/projects` | Project workspace |
| `/assets` | Asset library |
| `/clip-studio` | Candidate discovery and clip preparation |
| `/video-editor` | Video editing interface |
| `/planner` | Content planning |
| `/analytics` | Analytics interface |
| `/settings` | Application settings |
| `/auth` | Demo authentication screen |

The intended demo journey is:

1. Open the dashboard and review the seeded workspace.
2. Select or create a project.
3. Add an asset or upload a video while the backend is running.
4. Use the clip/AI screens to review suggested moments and content.
5. Trim/export a local uploaded video if FFmpeg is available.
6. Review the resulting clip and the planning/analytics screens.

For a reliable demo, use a small, known-good video file and rehearse the upload and export in advance. Be clear that sample data and heuristic AI results are not live production analytics.

## Backend API

The FastAPI service currently exposes the following routes:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend, FFmpeg, and Gemini configuration status |
| `GET` | `/api/projects` | List persisted projects |
| `POST` | `/api/projects` | Create a project from a JSON object |
| `GET` | `/api/assets?project_id=...` | List assets, optionally filtered by project |
| `POST` | `/api/assets` | Create asset metadata from a JSON object |
| `POST` | `/api/assets/upload` | Upload a file as multipart form data |
| `GET` | `/api/clips?project_id=...` | List clips, optionally filtered by project |
| `POST` | `/api/clips` | Create a clip metadata record |
| `POST` | `/api/ai/analyze-potential` | Get candidate moments for an asset |
| `POST` | `/api/ai/analyze-retention` | Get heuristic/AI retention analysis |
| `POST` | `/api/ai/ab-hooks` | Generate hook variations |
| `POST` | `/api/ai/script-match` | Match script text against transcript data |
| `POST` | `/api/ai/generate-content` | Generate hooks, captions, hashtags, and subtitles |
| `POST` | `/api/clips/trim` | Trim a local uploaded video through FFmpeg |
| `GET` | `/api/clips/status/{task_id}` | Read current trim task status |
| `GET` | `/uploads/{filename}` | Serve a locally uploaded file |
| `GET` | `/exports/{filename}` | Serve a locally generated export |

Use the interactive `/docs` page to inspect exact request and response shapes. The API currently has no authentication or per-user access control; do not expose it publicly with private files or data.

## Data and media storage

The backend persists the following metadata in SQLite:

- **Projects:** name, description, category, target platforms, status, thumbnail, and item counts.
- **Assets:** project association, filename, type, size, URL, upload date, duration, and status.
- **Clips:** project/asset association, trim range, aspect ratio, hook/caption fields, scheduling metadata, export URL, and status.

SQLite is initialized automatically. The current seed routine inserts demonstration content only when there are no projects. Uploaded file bytes and generated exports are stored separately on local disk; SQLite stores their metadata and paths/URLs, not the media itself.

The backend database is the only server-side persistence layer for these records. The frontend also persists Zustand state in the browser, so the browser's local state and server records are not yet a fully synchronized single source of truth. Clearing browser storage and deleting the backend database/media folders are separate actions.

## AI behavior

The AI module is configured to initialize the Google GenAI client when `GEMINI_API_KEY` is available. Its analysis and generation functions also contain heuristic/default transcript fallbacks. With no key—or when a provider call fails—responses may be generated from built-in sample transcript blocks and local heuristics rather than the uploaded video's actual audio/video.

Consequently:

- `gemini_configured: true` in `/api/health` means a key was detected; it does not prove successful inference.
- Candidate scores and retention estimates are not measured platform analytics.
- Do not claim the app transcribes arbitrary uploaded files or bases all analysis on their actual content unless that behavior has been separately verified.
- Avoid sending confidential or private media to an external AI provider without appropriate consent and configuration.

## Validation

The following checks have been run against the current working tree:

- `npm run build` — passed; Vite emitted a warning that the generated JavaScript bundle exceeds 500 kB.
- Python compilation of the backend modules — passed after fixing a syntax issue in the clip persistence code.
- Direct SQLite smoke test — passed for initialization, seed data, project/asset/clip creation, and project-filtered reads.
- FastAPI smoke test — `/api/health` and `/api/projects` returned HTTP 200; FFmpeg was detected in the checked environment.

These checks validate build/startup and selected database/API behavior; they are not a complete automated test suite or proof that every UI workflow works end to end.

## Known limitations and demo guidance

The app is appropriate for a guided prototype demonstration, with the following boundaries:

- **Demo-oriented browser state:** the frontend starts with seeded records and persists substantial app state in the browser. Some actions do not yet round-trip through the backend.
- **No real authentication:** the auth screen and demo user do not protect API routes or isolate user data.
- **Local-only persistence:** SQLite and media files live on the server's local disk. There is no cloud bucket, backup policy, or shared multi-instance storage.
- **No migration framework:** schema creation uses `CREATE TABLE IF NOT EXISTS`; there is no versioned migration history.
- **AI fallback behavior:** not all results are guaranteed to be generated from uploaded media or by a live AI provider.
- **Synchronous exports:** FFmpeg runs in the request process. Task status is held in memory, so it is not durable across server restarts and does not constitute a persistent job queue.
- **Upload hardening:** the upload route has no configured production file-size/type policy, malware scanning, or authenticated ownership checks.
- **Prototype API contracts:** some endpoints accept generic JSON dictionaries, and project/asset/clip relationships are not yet guarded by a complete validation/authorization layer.
- **No production operations layer:** HTTPS, rate limiting, structured monitoring, error reporting, backups, deployment automation, and recovery procedures are not configured.
- **Build size warning:** the current frontend bundle is larger than Vite's 500 kB advisory threshold.

For presentations, describe the app as a working prototype, verify the exact scenario beforehand, and distinguish seeded/heuristic output from live provider output.

## Next steps toward a production MVP

Recommended order:

1. **Make server state authoritative:** load projects/assets/clips from the API, persist all edits through the API, and make offline/demo fallbacks opt-in rather than indistinguishable from real results.
2. **Add authentication and ownership:** implement accounts/sessions and enforce owner checks for every project, asset, clip, upload, and export.
3. **Harden data contracts and migrations:** validate IDs, relationships, input bounds, filenames, and lifecycle transitions; introduce versioned schema migrations and database tests.
4. **Move to production persistence:** use PostgreSQL for shared/concurrent data and object storage for uploads/exports, with access controls and signed URLs.
5. **Move media work to durable jobs:** use a worker/queue, persistent task records, retries, and observable progress for AI analysis and FFmpeg export.
6. **Make AI results trustworthy:** configure and verify the provider, feed it actual asset-derived transcripts/media, label fallback outputs, and persist provenance and errors.
7. **Prepare operations and release:** configure secrets, environments, HTTPS, logging/monitoring, backups, deployment, and end-to-end tests.

## Project attribution

This repository was developed for the Bit N Build internal round. Personal contributor details are intentionally omitted from this public-facing documentation.
