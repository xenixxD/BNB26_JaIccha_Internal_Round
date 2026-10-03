# CreatorAI — UI/UX Design System Audit & Migration Plan

## 1. Codebase Architecture Summary

- **Frontend Framework**: React 18 + Vite
- **Routing**: React Router DOM v7
- **State Management**: Zustand hydrated from the FastAPI local workspace API (`src/store/useStore.js`)
- **Local Persistence**: SQLite metadata and local media/output files under the configurable server data directory
- **Backend API**: Python FastAPI (`server/main.py`) with Pydantic schemas, FFmpeg video processing, and NLP AI engines.
- **Styling**: Tailwind CSS + custom tokens in `tailwind.config.js` and `src/index.css`.
- **Icons**: Lucide React (`lucide-react`)
- **Data Visualizations**: Recharts (`recharts`)

---

## 2. Page Routes & Components Audit

| Route | Page File | Purpose | Current Layout & Reuse Status |
| :--- | :--- | :--- | :--- |
| `/` | `DashboardPage.jsx` | Operations Overview & KPIs | Needs compact stat tiles, activity queue, quick actions |
| `/projects` | `ProjectsPage.jsx` | Workspace & Projects list | Needs toolbar, grid/list view toggle, dense cards & detail panel |
| `/assets` | `AssetLibraryPage.jsx` | Smart Asset Manager | Needs left filter rail, main asset table/grid, preview drawer |
| `/clip-studio` | `ClipStudioPage.jsx` | AI Clip Studio (Analyzer & Matcher) | Flagship 2-column workspace layout (Section 8 spec) |
| `/video-editor` | `VideoEditorPage.jsx` | Editable 9:16 Video Workspace | Full-height editor layout with top toolbar & bottom timeline |
| `/planner` | `PlannerPage.jsx` | Content Planner & Publisher | Kanban, Calendar, and List views with status cards |
| `/analytics` | `AnalyticsPage.jsx` | Performance Metrics | Clean line & bar charts in navy/blue palette with dense tables |
| `/settings` | `SettingsPage.jsx` | API Keys & Preferences | Left vertical nav & grouped form panels |
| `/auth` | `AuthPage.jsx` | Login & Registration | Clean auth card using design system tokens |

---

## 3. Design System Token Mapping

- **Sidebar Background**: `#17203A` (hover `#1F2A48`, active `#2A3659`, left accent `#4C7DF0`)
- **Canvas Background**: `#F5F6FA`
- **Panel Surface**: `#FFFFFF` (inset `#F6F7FB`)
- **Borders**: `#E3E7EF` (strong `#CDD3E0`)
- **Primary Accent**: `#2F5FE3` (hover `#2650C7`, soft bg `#E8EEFD`, soft text `#2447B8`)
- **Text Hierarchy**: `#141B2D` (Primary), `#4B5568` (Secondary), `#7A8499` (Muted/Labels)
- **Status Colors**: Success `#1E9E5A`, Warning `#C77D0A`, Danger `#D1383D`, Notification `#E5484D`
- **Control Sizes**: Buttons 30-32px, Inputs 32px, Nav items 32px, Radii 4px/6px/8px.

---

## 4. Migration Execution Strategy

1. Extend `tailwind.config.js` and `src/index.css` with exact design tokens.
2. Build reusable UI component library in `src/components/ui/` (Button, Panel, Badge, StatTile, Table, Timecode, Input, Select, Tabs, etc.).
3. Refactor `AppLayout`, `Sidebar`, `Header`, and page headers to match Section 6 specifications.
4. Refactor flagship pages (**AI Clip Studio / Potential Analyzer & Script Matcher** and **Video Editor**).
5. Refactor Dashboard, Projects, Asset Library, Content Planner, Analytics, Settings, and Auth pages.
6. Verify responsive behavior and preserve all existing Zustand store state & API backend handlers.
