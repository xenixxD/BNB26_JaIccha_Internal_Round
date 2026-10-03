# CreatorAI — Audited Implementation Architecture & Coding Contract
## GDG Hackathon | Web/App Dev PS 1 | 24-Hour Build | v2.0

> **Purpose:** This is the implementation source of truth for CreatorAI. It combines the risk-fixed architecture and the coding contract into one consistent document so the team does not maintain two competing versions.
>
> **Product source of truth:** The organiser-provided CreatorAI problem statement and the previously reviewed CreatorAI architecture.
>
> **Implementation principle:** Build the reliable multimedia production loop first. Supporting creator-operations features are added only after the critical path works.
>
> **Core promise:** A creator provides a script and/or raw footage. CreatorAI understands the available content, finds useful moments, creates a structured and editable `EditPlan`, lets the creator modify it, and renders the approved result.

---

# 1. DOCUMENT CONTROL

| Item | Decision |
|---|---|
| Product | CreatorAI |
| Document role | Implementation source of truth |
| Build target | 24-hour hackathon MVP |
| Canonical editable object | `EditPlan` |
| Canonical processing object | `ProcessingJob` |
| Canonical rendering object | `RenderJob` |
| Primary matching evidence | Timestamped transcript ↔ script semantic similarity |
| Visual analysis | Optional enrichment; never a critical dependency |
| Rendering engine | FFmpeg |
| Demo protection | `Demo Mode` |
| Live processing | `Real Mode` |
| MVP critical path | Upload → Validate → Transcribe → Match → Candidates → EditPlan → Creator Edit → Render → Preview → Export |
| Source media policy | Immutable |
| Architecture status | Audited and ready for implementation |

## 1.1 Canonical Terms

Use these terms consistently in code, API names, database models, comments, and UI copy:

```text
CreatorAI
Demo Mode
Real Mode
EditPlan
ProcessingJob
RenderJob
ClipCandidate
TranscriptSegment
PlatformProfile
ContentOutput
```

Human-facing labels may include spaces, for example `Edit Plan Editor`, but the canonical code/model name is `EditPlan`.

Use only the canonical term `Real Mode`; do not create alternate names for it.

---

# 2. WHAT CREATORAI IS

CreatorAI is a creator-focused AI production workspace.

Its job is not merely to provide another caption generator, another clipper, or another video editor.

Its implementation focus is:

> **Connect creator intent and creator media so the system can identify useful content, propose an editable production plan, execute that plan, and keep the creator in control.**

The central workflow is:

```text
IDEA / SCRIPT / RAW FOOTAGE
            ↓
      MEDIA + CONTEXT
            ↓
         UNDERSTAND
            ↓
      MATCH / DISCOVER
            ↓
      CLIP CANDIDATES
            ↓
          EDITPLAN
            ↓
       CREATOR EDITS
            ↓
           RENDER
            ↓
          EXPORT
```

The product vision continues into performance and intelligence, but the 24-hour MVP is successful when the production path is reliable through export.

---

# 3. PROBLEM BEING SOLVED

Individual creator-AI features already exist in many forms.

The implementation problem we address is **context fragmentation across the creator workflow**.

A creator may separately have:

```text
Idea
Script
Raw video
Transcript
Useful moments
Edit
Platform variant
Published content
Performance data
```

When these are disconnected, the creator becomes the integration layer.

CreatorAI should preserve relationships between these objects:

```text
SCRIPT
  ↕
TRANSCRIPT
  ↕
FOOTAGE
  ↕
CLIP
  ↕
EDITPLAN
  ↕
OUTPUT
```

The MVP demonstrates that relationship through script-to-footage understanding and editable content generation.

Do not claim that CreatorAI invented clipping, captions, hooks, resizing, or video editing.

The differentiating implementation idea is:

```text
SHARED CONTEXT
+
SEMANTIC SCRIPT ↔ FOOTAGE ALIGNMENT
+
EDITABLE AI DECISIONS
+
CREATOR CONTROL
```

---

# 4. PRODUCT BOUNDARY

## 4.1 In Scope — Critical Path

These features are mandatory for the technical MVP:

```text
Project creation
Video upload
Media validation
Script input
Source storage
Audio extraction
Timestamped transcription
Transcript segmentation
Script-to-footage matching
Clip candidate generation
Candidate ranking
EditPlan generation
EditPlan modification
FFmpeg rendering
Output validation
Preview
Export
```

## 4.2 In Scope — Secondary

Build only after the critical path is stable:

```text
Asset library
Creator profile
Hook generation
Caption generation
Platform profiles
Content history
Basic workflow states
Basic analytics
Basic creator intelligence
Visual analysis
```

## 4.3 Out of Scope for the Critical Path

Do not allow these to delay the MVP:

```text
Full Premiere/CapCut replacement
Advanced nonlinear timeline
Complex transitions
Color grading
Audio mastering
AI-generated B-roll
Automatic background removal
Large social-publishing integration matrix
Large OAuth infrastructure
Autonomous multi-agent swarm
Sophisticated recommendation model
Real-time collaboration
Large-scale trend scraping
```

They may exist as long-term product ideas, but they are not implementation requirements for the 24-hour core.

---

# 5. NON-NEGOTIABLE ARCHITECTURE RULES

1. **Source media is immutable.**
2. AI must never overwrite the original source asset.
3. AI editing decisions must become validated structured data before execution.
4. `EditPlan` is the canonical representation of an editable AI edit.
5. The browser edits `EditPlan` state; the backend/media engine renders it.
6. FFmpeg performs deterministic media operations.
7. Transcript-first matching is the primary script-to-footage path.
8. Visual analysis is optional enrichment and cannot be a single point of failure.
9. Long-running operations use asynchronous jobs.
10. Successful expensive stages should be cached and reused.
11. A failed render must preserve the `EditPlan`.
12. A failed visual-analysis stage must not destroy transcript-first matching.
13. Every final output must be traceable to a source asset and `EditPlan` version.
14. AI output must be schema-validated before application use.
15. AI must not emit arbitrary shell commands for execution.
16. The MVP is not a full nonlinear editor.
17. No autonomous agent swarm is required.
18. Direct social-platform publishing is optional and never critical.
19. Real metrics must be distinguished from demo/sample metrics.
20. AI insights must not claim conclusions unsupported by available data.
21. Temporary processing files must have a cleanup policy.
22. Source storage credentials and AI keys remain server-side.
23. No secondary feature may block the critical path.
24. Do not add a major new dependency while the core pipeline is unstable.
25. At feature freeze, reliability takes priority over feature count.

---

# 6. MVP CRITICAL PATH

The canonical implementation path is:

```text
CREATOR
  ↓
VIDEO + SCRIPT
  ↓
MEDIA INGESTION
  ↓
MEDIA VALIDATION
  ↓
AUDIO EXTRACTION
  ↓
TIMESTAMPED TRANSCRIPTION
  ↓
TRANSCRIPT SEGMENTATION
  ↓
SCRIPT ↔ FOOTAGE MATCHING
  ↓
CLIP CANDIDATES
  ↓
CANDIDATE RANKING
  ↓
EDITPLAN v1
  ↓
CREATOR MODIFICATION
  ↓
EDITPLAN v2
  ↓
FFMPEG RENDER
  ↓
OUTPUT VALIDATION
  ↓
PREVIEW
  ↓
EXPORT
```

For the primary MVP path, both **video and script** are available because the main feature being demonstrated is script-to-footage alignment.

The product can also support a footage-first route as a secondary workflow:

```text
RAW FOOTAGE
  ↓
TRANSCRIPT
  ↓
CONTENT UNDERSTANDING
  ↓
HIGHLIGHT DISCOVERY
  ↓
EDITPLAN
  ↓
CREATOR EDIT
  ↓
RENDER
  ↓
EXPORT
```

Do not label a footage-only workflow as script matching when no script is present.

---

# 7. SYSTEM ARCHITECTURE

```text
                         ┌──────────────────────┐
                         │       CREATOR        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  CREATOR WORKSPACE   │
                         │                      │
                         │  Projects            │
                         │  Assets              │
                         │  Script              │
                         │  Processing          │
                         │  Candidates          │
                         │  EditPlan Editor     │
                         │  Outputs             │
                         │  Insights            │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       API LAYER      │
                         │                      │
                         │ Projects             │
                         │ Assets               │
                         │ Jobs                 │
                         │ Matching             │
                         │ EditPlans            │
                         │ Renders              │
                         └──────────┬───────────┘
                                    │
                ┌───────────────────┼────────────────────┐
                │                   │                    │
                ▼                   ▼                    ▼
        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │   DATABASE   │    │   STORAGE    │    │  AI SERVICES │
        │              │    │              │    │              │
        │ Projects     │    │ Source video │    │ Transcription│
        │ Assets       │    │ Audio        │    │ Matching     │
        │ Jobs         │    │ Intermediates│    │ Hooks        │
        │ EditPlans    │    │ Outputs      │    │ Captions     │
        │ Outputs      │    │              │    │ Insights     │
        └──────────────┘    └──────────────┘    └──────┬───────┘
                                                       │
                                                       ▼
                                               ┌──────────────┐
                                               │ MEDIA ENGINE │
                                               │              │
                                               │ FFmpeg       │
                                               │ Probe        │
                                               │ Trim         │
                                               │ Crop/Scale   │
                                               │ Captions     │
                                               │ Overlay      │
                                               │ Encode       │
                                               └──────┬───────┘
                                                      │
                                                      ▼
                                               ┌──────────────┐
                                               │FINAL OUTPUT  │
                                               │ContentOutput │
                                               └──────────────┘
```

---

# 8. SERVICE RESPONSIBILITIES

## 8.1 API Layer

Owns:

```text
request validation
authentication/authorization
project operations
asset operations
job creation/status
EditPlan operations
render operations
output access
```

## 8.2 Workflow / Orchestration Layer

This is a **deterministic application workflow**, not an autonomous agent system.

Owns:

```text
stage ordering
job creation
stage transitions
retry decisions
cache lookup
service invocation
failure handling
```

Do not build autonomous agent-to-agent planning for the MVP.

## 8.3 AI Services

Own:

```text
speech-to-text / transcription
semantic matching
content understanding
hook generation
caption generation
visual interpretation
insight generation
```

## 8.4 Media Services

Own:

```text
probe
validation
audio extraction
segment trimming
concatenation
crop/scale
captions
text overlays
encoding
output validation
```

## 8.5 Storage

Own:

```text
source assets
cached intermediates
final outputs
metadata references
```

---

# 9. TECHNOLOGY BASELINE

Use the following baseline unless the team explicitly freezes a different stack **before implementation**.

```text
Frontend: React / Next.js
Backend: FastAPI + Python
Database: Firestore
Storage: Firebase Storage or Google Cloud Storage
AI: Gemini / approved model service
Media: FFmpeg
```

## 9.1 Stack Freeze Rule

Before the first implementation merge, explicitly record:

```text
frontend framework/version
backend framework/version
database choice
storage choice
AI provider/model
FFmpeg version
deployment target
```

Once recorded:

> **Do not switch a major technology during the 24-hour build unless the current technology cannot satisfy a required task.**

Do not add a second database merely for convenience.

Do not add an agent framework merely for architectural appearance.

---

# 10. REPOSITORY STRUCTURE

Recommended:

```text
creator-ai/
│
├── README.md
├── .gitignore
├── .env.example
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── app/
│       ├── components/
│       ├── features/
│       │   ├── projects/
│       │   ├── assets/
│       │   ├── processing/
│       │   ├── candidates/
│       │   ├── editor/
│       │   └── outputs/
│       ├── hooks/
│       ├── lib/
│       └── types/
│
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   ├── projects.py
│   │   │   ├── assets.py
│   │   │   ├── processing.py
│   │   │   ├── matching.py
│   │   │   ├── edit_plans.py
│   │   │   ├── renders.py
│   │   │   └── insights.py
│   │   ├── models/
│   │   │   ├── creator.py
│   │   │   ├── project.py
│   │   │   ├── asset.py
│   │   │   ├── script.py
│   │   │   ├── transcript.py
│   │   │   ├── candidate.py
│   │   │   ├── edit_plan.py
│   │   │   ├── processing_job.py
│   │   │   ├── render_job.py
│   │   │   └── output.py
│   │   ├── services/
│   │   │   ├── storage_service.py
│   │   │   ├── media_validation_service.py
│   │   │   ├── transcription_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── matching_service.py
│   │   │   ├── hook_service.py
│   │   │   ├── caption_service.py
│   │   │   ├── edit_plan_service.py
│   │   │   ├── render_service.py
│   │   │   └── insight_service.py
│   │   ├── workers/
│   │   │   ├── processing_worker.py
│   │   │   └── render_worker.py
│   │   ├── media/
│   │   │   ├── ffmpeg.py
│   │   │   ├── probe.py
│   │   │   └── validation.py
│   │   └── utils/
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── fixtures/
│
├── scripts/
│   ├── prepare_demo.py
│   ├── seed_demo.py
│   ├── validate_environment.py
│   └── cleanup_temp.py
│
├── demo/
│   ├── assets/
│   ├── scripts/
│   ├── transcripts/
│   ├── candidates/
│   ├── edit_plans/
│   └── expected_outputs/
│
└── docs/
    ├── architecture.md
    ├── api.md
    └── demo.md
```

The exact folder structure may be simplified, but responsibilities must remain separated.

---

# 11. DOMAIN MODEL

## 11.1 Creator

```text
Creator
├── id
├── name
├── email
├── niche
├── audience
├── preferences
├── created_at
└── updated_at
```

## 11.2 Project

```text
Project
├── id
├── creator_id
├── name
├── description
├── status
├── content_goal
├── target_platform
├── created_at
└── updated_at
```

Suggested `Project.status`:

```text
IDEA
DRAFT
IN_PRODUCTION
PROCESSING
EDITING
REVIEW
READY
PUBLISHED
ARCHIVED
```

These are workflow labels, not processing-job states.

## 11.3 Asset

```text
Asset
├── id
├── creator_id
├── project_id
├── type
├── filename
├── mime_type
├── size_bytes
├── storage_path
├── duration
├── width
├── height
├── checksum
├── metadata
├── created_at
└── updated_at
```

Asset types:

```text
VIDEO
AUDIO
IMAGE
SCRIPT
DOCUMENT
GENERATED_OUTPUT
```

## 11.4 Script

```text
Script
├── id
├── project_id
├── title
├── body
├── source
├── language
├── target_duration
├── target_platform
├── version
├── created_at
└── updated_at
```

Suggested `Script.source`:

```text
USER
AI
IMPORTED
```

## 11.5 Transcript

```text
Transcript
├── id
├── asset_id
├── language
├── full_text
├── segments[]
├── provider
├── model
├── created_at
└── updated_at
```

## 11.6 TranscriptSegment

```text
TranscriptSegment
├── id
├── transcript_id
├── start_time
├── end_time
├── text
├── speaker
├── confidence
└── sequence
```

`start_time` and `end_time` are seconds from the beginning of the source media.

Validation:

```text
start_time >= 0
end_time > start_time
```

## 11.7 ClipCandidate

```text
ClipCandidate
├── id
├── project_id
├── source_asset_id
├── start_time
├── end_time
├── transcript_text
├── semantic_score
├── completeness_score
├── visual_score
├── duration_score
├── final_score
├── reasons[]
├── status
└── created_at
```

Suggested `ClipCandidate.status`:

```text
SUGGESTED
SELECTED
REJECTED
USED
```

## 11.8 EditPlan

```text
EditPlan
├── id
├── project_id
├── source_asset_id
├── version
├── parent_version_id
├── segments[]
├── hook
├── captions
├── text_overlays[]
├── format
├── audio_settings
├── created_by
├── created_at
└── updated_at
```

## 11.9 ProcessingJob

```text
ProcessingJob
├── id
├── project_id
├── input_asset_id
├── stage
├── status
├── progress
├── output_reference
├── error_code
├── error_message
├── attempt
├── created_at
├── started_at
└── completed_at
```

## 11.10 RenderJob

```text
RenderJob
├── id
├── project_id
├── edit_plan_id
├── status
├── progress
├── output_asset_id
├── renderer_version
├── error_code
├── error_message
├── created_at
├── started_at
└── completed_at
```

## 11.11 ContentOutput

```text
ContentOutput
├── id
├── project_id
├── source_asset_id
├── edit_plan_id
├── render_job_id
├── video_asset_id
├── platform_profile_id
├── metadata
├── created_at
└── updated_at
```

`ContentOutput` is the durable record connecting final content to its source and edit plan.

---

# 12. PROCESSING JOB STATE MACHINE

## 12.1 Canonical Stages

The only canonical `ProcessingJob.stage` values are:

```text
QUEUED
VALIDATING
AUDIO_EXTRACTION
TRANSCRIBING
SEGMENTING
ANALYZING
MATCHING
PLANNING
COMPLETED
```

Failure is represented by status, not by a stage.

## 12.2 Canonical Status Values

```text
QUEUED
RUNNING
COMPLETED
FAILED
CANCELLED
```

Therefore:

```text
stage = MATCHING
status = RUNNING
```

or:

```text
stage = MATCHING
status = FAILED
```

Do not create separate stages named `FAILED` or `ERROR`.

## 12.3 Canonical Transition

```text
QUEUED
  ↓
VALIDATING
  ↓
AUDIO_EXTRACTION
  ↓
TRANSCRIBING
  ↓
SEGMENTING
  ↓
ANALYZING
  ↓
MATCHING
  ↓
PLANNING
  ↓
COMPLETED
```

Any stage may transition to:

```text
FAILED
```

Retry behavior:

```text
FAILED
 ↓
retry
 ↓
same failed stage
```

Successful previous stages should not be repeated unless their inputs changed.

---

# 13. RENDER JOB STATE MACHINE

Canonical `RenderJob.status`:

```text
QUEUED
RUNNING
COMPLETED
FAILED
CANCELLED
```

Flow:

```text
QUEUED
  ↓
RUNNING
  ↓
COMPLETED
```

or:

```text
RUNNING
  ↓
FAILED
  ↓
RETRY
  ↓
QUEUED
```

A render failure must not change or delete the saved `EditPlan`.

---

# 14. MEDIA INGESTION

## 14.1 Upload Contract

When a source video is uploaded:

```text
receive
 ↓
validate
 ↓
probe
 ↓
store source asset
 ↓
create Asset record
```

Validate at minimum:

```text
file exists
supported MIME/type
size <= configured limit
filename sanitized
media probe succeeds
```

Do not trust the extension alone.

## 14.2 Media Probe

Record:

```text
duration
width
height
fps
video codec
audio codec
audio presence
```

## 14.3 Source Immutability

The original source must remain untouched.

AI editing creates instructions.

FFmpeg reads the source.

Rendered outputs are separate assets.

---

# 15. AUDIO EXTRACTION

For speech-dependent processing:

```text
source video
 ↓
audio extraction
 ↓
temporary/cached audio artifact
```

Do not replace the source video with extracted audio.

If the source has no audio:

```text
audio_available = false
```

The primary speech/transcript workflow should return a clear state such as:

```text
TRANSCRIPTION_UNAVAILABLE_NO_AUDIO
```

A footage-only workflow can continue only if that workflow has actually been implemented.

Do not claim that a no-audio video has been transcribed.

---

# 16. TRANSCRIPTION

The transcription service receives:

```text
audio artifact
+
language/configuration
```

It returns:

```text
Transcript
  +
TranscriptSegment[]
```

Required properties:

```text
start_time
end_time
text
sequence
```

Optional:

```text
speaker
confidence
```

The exact speech-to-text provider is an implementation choice inside `transcription_service.py`, but its output must conform to the internal `Transcript` contract.

---

# 17. TRANSCRIPT SEGMENTATION

The first implementation should use simple, reliable boundaries.

Candidate boundaries can be based on:

```text
sentence boundaries
pause boundaries
speaker changes
topic transitions where available
```

Do not require a sophisticated segmentation model for the MVP.

The result must remain timestamped.

Example:

```text
[00:10.0–00:16.0] Sentence A
[00:16.0–00:24.0] Sentence B
[00:24.0–00:31.0] Sentence C
[00:31.0–00:38.0] Sentence D
```

---

# 18. SCRIPT-TO-FOOTAGE MATCHING

This is one of the most important technical components.

## 18.1 Primary Evidence

```text
script
  ↕
timestamped transcript
```

Calculate semantic similarity between script sections and transcript windows.

## 18.2 Secondary Evidence

Use:

```text
completeness
topic continuity
duration fit
keyword/entity overlap
```

## 18.3 Tertiary Evidence

Use:

```text
visual metadata
```

Visual evidence improves ranking but is not mandatory.

## 18.4 Matching Flow

```text
SCRIPT
  ↓
SCRIPT SECTIONS
  +
TIMESTAMPED TRANSCRIPT
  ↓
CANDIDATE WINDOWS
  ↓
SEMANTIC MATCH
  ↓
SECONDARY SCORING
  ↓
OPTIONAL VISUAL RE-RANKING
  ↓
CLIP CANDIDATES
```

---

# 19. CANDIDATE WINDOW GENERATION

Generate windows from transcript boundaries.

Given:

```text
A = 00:10–00:16
B = 00:16–00:24
C = 00:24–00:31
D = 00:31–00:38
```

possible windows include:

```text
A
A+B
A+B+C
B+C
B+C+D
C+D
```

The implementation should generate only valid combinations.

Constraints:

```text
end_time > start_time
window duration within configurable bounds
boundaries remain inside source duration
```

Do not create arbitrary one-second windows as the primary approach.

---

# 20. CANDIDATE SCORING

Initial ranking default:

```text
final_score =
    0.50 × semantic_score
  + 0.20 × completeness_score
  + 0.15 × visual_score
  + 0.15 × duration_score
```

When visual analysis is unavailable:

```text
final_score =
    0.60 × semantic_score
  + 0.25 × completeness_score
  + 0.15 × duration_score
```

All scores must be normalized:

```text
0.0 ≤ score ≤ 1.0
```

These are implementation defaults, not claims that they are objectively correct measures of content quality.

The result must contain reasons:

```json
{
  "reasons": [
    "High script relevance",
    "Complete thought",
    "Fits target duration"
  ]
}
```

Do not present `final_score` as a platform engagement prediction.

It is only a ranking signal used by CreatorAI.

---

# 21. DURATION POLICY

Use configurable target ranges.

Example default:

```text
short-form target:
20–60 seconds
```

The exact range may be changed in configuration.

Do not discard a semantically strong candidate solely because it is slightly outside the preferred range.

Use duration as a ranking factor unless the product configuration explicitly makes it a hard constraint.

---

# 22. VISUAL ANALYSIS

Visual analysis is optional enrichment.

Pipeline:

```text
video
 ↓
scene/shot detection
 ↓
representative frame selection
 ↓
visual interpretation
 ↓
normalized visual metadata
```

Do not send every frame to an AI service unless explicitly necessary and practical.

Possible metadata:

```text
people_present
screen_present
code_visible
presentation_visible
camera_type
scene_description
visual_topic_cues
```

Visual analysis failure:

```text
continue transcript-first matching
```

The system should not block the core workflow because visual analysis failed.

---

# 23. HOOK GENERATION

Hook generation and hook detection are separate capabilities.

## 23.1 Hook Generation

Input:

```text
clip transcript
script context
content goal
PlatformProfile
```

Output:

```json
{
  "text": "Your chatbot isn't an AI agent.",
  "alternatives": [
    "Most people misunderstand AI agents.",
    "Here's where my AI project went wrong."
  ]
}
```

The application must schema-validate the response.

## 23.2 Hook Failure

Preferred fallback order:

```text
generated hook
    ↓ failure
creator-provided hook, if available
    ↓ unavailable
no generated hook
```

Never invent a fallback hook inside application code and present it as AI-generated.

---

# 24. CAPTION GENERATION

Initial MVP approach:

```text
selected clip transcript
 ↓
timestamped caption segments
```

Example:

```json
[
  {
    "start": 0.0,
    "end": 2.4,
    "text": "The biggest problem was latency."
  }
]
```

Caption generation failure:

```text
continue without captions
```

only where the selected demo/product flow allows this.

Do not make the application appear successful if captions are explicitly required by the selected workflow and the system omitted them.

---

# 25. EDITPLAN CONTRACT

`EditPlan` is the canonical editable representation of an AI edit.

Example:

```json
{
  "id": "edit_001",
  "project_id": "project_001",
  "source_asset_id": "video_001",
  "version": 2,
  "parent_version_id": "edit_001_v1",
  "segments": [
    {
      "start": 72.0,
      "end": 102.0,
      "order": 1
    }
  ],
  "hook": {
    "text": "Your chatbot isn't an AI agent.",
    "enabled": true,
    "position": "top"
  },
  "captions": {
    "enabled": true,
    "style": "default"
  },
  "text_overlays": [],
  "format": {
    "aspect_ratio": "9:16",
    "width": 1080,
    "height": 1920
  },
  "audio_settings": {
    "source_enabled": true
  },
  "created_by": "creator"
}
```

## 25.1 EditPlan Validation

Application code must validate:

```text
project_id exists
source_asset_id exists
source asset belongs to project
version is positive
segment order values are unique
segment start >= 0
segment end > segment start
segment end <= source duration
format is supported
caption structure is valid
hook structure is valid
```

## 25.2 Versioning

Creator changes:

```text
EditPlan v1
   ↓
creator modifies state
   ↓
EditPlan v2
```

Never silently overwrite the canonical history when versioning is required.

Every render references one exact version.

---

# 26. EDIT PLAN EDITOR

The MVP editor is intentionally small.

Required controls:

```text
video preview
start time
end time
hook text
captions toggle
aspect ratio
save edit
render
reset AI edit
```

Optional:

```text
segment ordering
text overlays
caption style
```

The editor is not a full nonlinear editor.

## 26.1 Browser Responsibility

Browser:

```text
loads EditPlan
shows preview
changes EditPlan fields
saves EditPlan
requests render
```

Browser does not perform the final media render.

## 26.2 Backend Responsibility

Backend:

```text
validates EditPlan
creates version
loads source asset
constructs render instructions
runs FFmpeg
stores output
```

---

# 27. FFMPEG RENDERING CONTRACT

The renderer accepts:

```text
validated EditPlan
```

It never accepts arbitrary shell commands produced by an AI model.

Supported MVP operations:

```text
trim
concatenate selected segments
crop
scale
caption overlay
hook/text overlay
encode
```

Avoid:

```text
advanced transitions
complex effects
color grading
audio mastering
AI B-roll
background removal
multi-track professional editing
```

---

# 28. RENDER PIPELINE

```text
EditPlan
  ↓
validate
  ↓
load source
  ↓
construct internal render instructions
  ↓
trim segments
  ↓
concatenate when required
  ↓
crop/scale
  ↓
hook/text
  ↓
captions
  ↓
encode
  ↓
probe output
  ↓
store final output
  ↓
create ContentOutput
```

Output validation must verify:

```text
file exists
non-zero size
probe succeeds
expected dimensions
expected approximate duration
required audio/video streams
```

Use safe subprocess argument arrays.

Do not build raw shell strings from untrusted values.

---

# 29. OUTPUT / EXPORT

The final output is represented as a `ContentOutput`.

Minimum export:

```text
final_video.mp4
```

Optional publishing-preparation package:

```text
final_video.mp4
title.txt
caption.txt
description.txt
hashtags.txt
```

This is still part of the export workflow.

Direct platform publishing remains optional and is not a critical dependency.

---

# 30. PLATFORM PROFILES

Represent adaptation through `PlatformProfile`.

Example:

```text
PlatformProfile
├── id
├── name
├── aspect_ratio
├── width
├── height
├── target_duration_min
├── target_duration_max
├── caption_style
├── title_rules
├── description_rules
└── hashtag_rules
```

The profile controls adaptation.

Do not claim that changing only aspect ratio constitutes complete platform adaptation.

At MVP level, a small number of profiles is enough.

---

# 31. CACHING

Expensive stages should reuse results when inputs have not changed.

Conceptual keys:

```text
transcript =
    hash(source_asset + transcription_config)

matching =
    hash(script_version + transcript_version + matching_config)

visual_analysis =
    hash(source_asset + visual_config)

hook =
    hash(clip_transcript + script_context + platform_profile)

render =
    hash(edit_plan_version + renderer_version)
```

Behavior:

```text
render failure
 ↓
retry render
```

not:

```text
transcribe again
analyze again
match again
render again
```

unless an input/configuration actually changed.

---

# 32. ASYNCHRONOUS PROCESSING

Long-running operations must be jobs.

Flow:

```text
Frontend
  ↓
POST /process
  ↓
Backend creates ProcessingJob
  ↓
returns job_id
  ↓
worker processes stages
  ↓
frontend polls/subscribes to job status
```

Example response:

```json
{
  "job_id": "job_123",
  "stage": "TRANSCRIBING",
  "status": "RUNNING",
  "progress": 42
}
```

The UI should show actual stages:

```text
✓ Validation
✓ Audio extraction
⟳ Transcription
○ Segmentation
○ Matching
○ Planning
○ Rendering
```

Do not display a misleading percentage unless it is calculated from meaningful stage progress.

---

# 33. API CONTRACT

Routes may be adjusted during implementation, but responsibilities must remain.

## Projects

```http
POST   /projects
GET    /projects
GET    /projects/{project_id}
PATCH  /projects/{project_id}
```

## Assets

```http
POST   /projects/{project_id}/assets
GET    /projects/{project_id}/assets
GET    /assets/{asset_id}
DELETE /assets/{asset_id}
```

## Processing

```http
POST /projects/{project_id}/process
GET  /jobs/{job_id}
POST /jobs/{job_id}/retry
```

## Transcript

```http
GET  /assets/{asset_id}/transcript
POST /assets/{asset_id}/transcript
```

## Matching

```http
POST /projects/{project_id}/match
GET  /projects/{project_id}/candidates
```

## EditPlans

```http
POST  /projects/{project_id}/edit-plans
GET   /projects/{project_id}/edit-plans
GET   /edit-plans/{edit_plan_id}
PATCH /edit-plans/{edit_plan_id}
```

Where versioning is enabled, a creator edit creates a new version.

## Renders

```http
POST /edit-plans/{edit_plan_id}/render
GET  /renders/{render_id}
POST /renders/{render_id}/retry
```

Long-running calls return job identifiers.

---

# 34. API ERROR CONTRACT

Use consistent structured errors.

Example:

```json
{
  "error": {
    "code": "MEDIA_UNSUPPORTED",
    "message": "The uploaded media format is not supported.",
    "retryable": false
  }
}
```

Recommended codes:

```text
AUTH_REQUIRED
PROJECT_NOT_FOUND
ASSET_NOT_FOUND
MEDIA_UNSUPPORTED
MEDIA_CORRUPT
MEDIA_TOO_LARGE
MEDIA_NO_AUDIO
TRANSCRIPTION_FAILED
TRANSCRIPTION_UNAVAILABLE
MATCHING_FAILED
EDITPLAN_INVALID
RENDER_FAILED
STORAGE_FAILED
AI_SERVICE_UNAVAILABLE
RATE_LIMITED
INTERNAL_ERROR
```

Never expose stack traces to the browser.

Log detailed diagnostics server-side.

---

# 35. FAILURE / FALLBACK CONTRACT

| Stage | Failure | Required behavior |
|---|---|---|
| Upload | network/upload problem | retry; preserve partial state where safe |
| Validation | unsupported media | explain and reject |
| Probe | corrupt/unsupported media | reject without changing source |
| Audio extraction | failure | retry; preserve source |
| Transcription | service failure | bounded retry; surface clear error |
| No audio | source has no audio | mark transcription unavailable; do not fabricate transcript |
| Segmentation | failure | retry or use raw transcript segments |
| Matching | AI/service failure | retry or allow manual candidate selection if implemented |
| Visual analysis | failure | continue transcript-first |
| Hook generation | failure | use creator hook if available; otherwise continue without generated hook |
| Caption generation | failure | continue without captions only where the workflow permits |
| EditPlan validation | invalid | reject save; do not render invalid state |
| Render | failure | preserve EditPlan; allow retry |
| Storage | failure | do not mark output complete |
| Analytics | unavailable | show insufficient-data state |
| Insights | insufficient data | say insufficient data; do not invent conclusions |

The core principle is:

> **An enhancement failure must not unnecessarily destroy the core workflow.**

---

# 36. SECURITY CONTRACT

Minimum requirements:

```text
API keys remain server-side
storage credentials remain server-side
validate MIME/type
validate file size
sanitize filenames
prevent path traversal
validate project/asset ownership
never execute arbitrary uploaded commands
never execute AI-generated shell commands
use safe subprocess arguments
do not expose stack traces
validate storage references
```

Every project/asset/edit-plan operation must verify authorization.

---

# 37. ENVIRONMENT CONTRACT

Create:

```text
.env.example
```

Keep the real `.env` untracked.

Conceptual configuration:

```text
APP_ENV
API_BASE_URL

DATABASE_CONFIG
STORAGE_CONFIG

AI_API_KEY
AI_MODEL
TRANSCRIPTION_CONFIG

FFMPEG_PATH
FFMPEG_VERSION

MAX_UPLOAD_SIZE
MAX_VIDEO_DURATION

DEMO_MODE
```

Do not commit credentials.

Do not expose AI/API secrets through frontend build variables.

---

# 38. TEMPORARY STORAGE POLICY

## Permanent

```text
source assets
transcripts
EditPlans
final outputs
important metadata
```

## Temporary / Cacheable

```text
extracted audio
representative frames
intermediate clips
temporary render files
```

Temporary artifacts should be deleted after successful completion when no longer needed.

Do not delete an intermediate that is required for cache reuse.

Do not delete the only copy of a final output.

---

# 39. DEMO MODE

`Demo Mode` is a reliability mechanism around the real product.

Prepared demo data:

```text
demo_video.mp4
demo_script.txt
demo_transcript.json
demo_candidates.json
demo_edit_plan.json
demo_performance.json
```

The prepared data must be clearly identified as demo/sample data where relevant.

Demo Mode can bypass waiting for expensive live processing, but it must use the same application concepts:

```text
Project
Asset
Transcript
ClipCandidate
EditPlan
ContentOutput
```

Do not present precomputed data as live external data.

---

# 40. REAL MODE

`Real Mode` must execute the real processing path:

```text
upload
 ↓
validate
 ↓
probe
 ↓
audio extraction
 ↓
transcribe
 ↓
segment
 ↓
match
 ↓
candidate ranking
 ↓
EditPlan
 ↓
creator edit
 ↓
render
 ↓
export
```

If an optional enhancement is unavailable, Real Mode may fall back according to the failure contract.

Real Mode must not silently replace an unimplemented core operation with precomputed demo data.

---

# 41. DEMO DATASET

Recommended demo dataset:

```text
3–10 minute source video
matching script
precomputed transcript
3–5 candidates
example EditPlan
final output
optional sample performance data
```

The demo video should contain clearly identifiable topical sections.

Example structure:

```text
00:00–01:00 introduction
01:00–02:00 problem
02:00–03:00 solution
03:00–04:00 result
```

The actual dataset can be longer.

---

# 42. FRONTEND SCREEN MAP

Minimum screens:

```text
Dashboard / Projects
Project Overview
Upload
Processing
Candidates
EditPlan Editor
Outputs
```

Secondary:

```text
Asset Library
Analytics
Insights
```

Do not build secondary dashboard panels before the core path works.

---

# 43. FRONTEND PROCESSING UI

Processing screen must expose the real job state.

Example:

```text
✓ Validation
✓ Audio extraction
✓ Transcription
⟳ Segmentation
○ Matching
○ Planning
○ Rendering
```

Each state should be derived from the actual `ProcessingJob`.

Do not hard-code a fake progress animation.

---

# 44. FRONTEND CANDIDATE UI

Each candidate should show:

```text
Candidate #1
00:01:12 → 00:01:42

Topic:
AI latency problem

Ranking signal:
0.91

Why:
✓ High script relevance
✓ Complete thought
✓ Fits target duration

[Preview]
[Use this]
```

The UI must make clear that the ranking score is a system ranking signal, not a prediction of real-world engagement.

---

# 45. FRONTEND EDITOR UI

Minimum:

```text
Preview

Start [ 01:12 ]
End   [ 01:42 ]

Hook
[ Your chatbot isn't an AI agent. ]

Captions [ON]

Format [9:16]

[Reset AI Edit]
[Save Edit]
[Render]
```

The UI should show the current EditPlan version where practical.

Example:

```text
EditPlan v2
```

---

# 46. OUTPUT SCREEN

Show:

```text
Render Complete

Duration
Resolution
Aspect Ratio

[Preview]
[Export Video]
[Export Package]
```

On failure:

```text
Render failed.
Your EditPlan is preserved.

[Retry Render]
[Edit Plan]
```

Do not force the user to rebuild the AI edit after a render failure.

---

# 47. CONTENT WORKFLOW STATES

Project workflow:

```text
IDEA
DRAFT
IN_PRODUCTION
PROCESSING
EDITING
REVIEW
READY
PUBLISHED
ARCHIVED
```

Do not confuse these with `ProcessingJob.stage` or `RenderJob.status`.

These represent project lifecycle.

The processing state is tracked separately.

---

# 48. ANALYTICS CONTRACT

Only use one of these sources:

```text
REAL PLATFORM DATA
CREATOR-ENTERED DATA
DEMO/SAMPLE DATA
```

The UI must indicate which source is being shown.

Never fabricate:

```text
views
likes
comments
retention
engagement
```

and call them real.

Analytics are secondary to the production pipeline.

---

# 49. CREATOR INTELLIGENCE CONTRACT

Creator Intelligence v1 uses:

```text
current project data
+
available content history
+
available performance data
```

Flow:

```text
structured data
 ↓
summary
 ↓
AI interpretation
 ↓
insight
```

If insufficient data exists:

```text
Not enough performance history yet.
```

Do not infer a trend from no data.

Do not present unsupported AI conclusions as measured facts.

---

# 50. TESTING CONTRACT

## 50.1 Unit Tests

Test:

```text
EditPlan validation
candidate score calculation
timestamp validation
job state transitions
version increment
platform profile validation
render instruction generation
```

## 50.2 Integration Test

The core integration test is:

```text
source video
 ↓
probe
 ↓
audio
 ↓
transcript
 ↓
match
 ↓
candidate
 ↓
EditPlan
 ↓
render
```

## 50.3 Media Tests

Verify:

```text
duration
dimensions
audio/video streams
trim result
aspect ratio
caption presence where enabled
output readability
```

## 50.4 Failure Tests

Test intentionally:

```text
corrupt file
unsupported file
missing audio
empty transcript
invalid timestamp
AI timeout
render failure
missing asset
unauthorized asset access
```

For missing audio, verify that the system does not create fake transcript text.

---

# 51. GOLDEN TEST VIDEO

Create one deterministic engineering fixture:

```text
30–60 seconds
16:9
clear speech
at least 3 distinct topics
known timestamps
```

Example:

```text
00–10 Topic A
10–20 Topic B
20–30 Topic C
```

Test:

```text
request Topic B
 ↓
candidate around Topic B interval
 ↓
EditPlan
 ↓
render
```

Then modify:

```text
10–20
```

to:

```text
12–20
```

and render again.

Expected:

```text
second output begins later
source video unchanged
```

---

# 52. SINGLE MOST IMPORTANT ENGINEERING TEST

Before declaring the technical core complete:

```text
SOURCE VIDEO
    ↓
PROBE
    ↓
AUDIO EXTRACTION
    ↓
TIMESTAMPED TRANSCRIPT
    ↓
SCRIPT
    ↓
MATCHED TIMESTAMPS
    ↓
CLIP CANDIDATE
    ↓
EDITPLAN v1
    ↓
CREATOR CHANGES START/END
    ↓
EDITPLAN v2
    ↓
FFMPEG
    ↓
OUTPUT VALIDATION
    ↓
FINAL CLIP
```

Manually verify:

```text
1. Selected content actually matches the requested topic.
2. Timestamps are correct.
3. Creator changes alter the rendered output.
4. Source remains unchanged.
5. Failed render can be retried without retranscription.
6. The complete flow can be demonstrated from a clean project.
```

All six must pass.

---

# 53. FIRST ENGINEERING MILESTONE

Before polished frontend work:

```text
30–60 second test video
        ↓
media probe
        ↓
audio extraction
        ↓
timestamped transcription
        ↓
script matching
        ↓
start/end JSON
        ↓
FFmpeg clip
        ↓
playable output
```

Acceptance:

```text
Expected topic:
Topic B

Produced clip:
contains Topic B

Timestamps:
within expected source range

Output:
playable
```

If this fails, do not spend time polishing the dashboard.

---

# 54. SECOND ENGINEERING MILESTONE — EDITABLE AI

Implement:

```text
ClipCandidate
 ↓
EditPlan v1
 ↓
creator changes start/end
 ↓
EditPlan v2
 ↓
FFmpeg
 ↓
second output
```

Acceptance:

```text
source unchanged
v1 valid
v2 valid
second render reflects creator edit
render failure preserves EditPlan
```

This is the strongest technical proof of editable AI-assisted editing.

---

# 55. THIRD ENGINEERING MILESTONE — API

Minimum working backend:

```text
create project
upload asset
process asset
read job state
read transcript
run matching
read candidates
create/read/update EditPlan
render EditPlan
read render state
read output
```

Frontend does not bypass the API to mutate database state directly.

---

# 56. FOURTH ENGINEERING MILESTONE — FRONTEND

Connect:

```text
Project
 ↓
Upload
 ↓
Processing
 ↓
Candidates
 ↓
EditPlan Editor
 ↓
Render
 ↓
Output
```

Only after the service-layer workflow is proven.

---

# 57. FIFTH ENGINEERING MILESTONE — SECONDARY FEATURES

Add only after core stability:

```text
Hook generation
Caption generation
Platform profiles
Asset library
Visual analysis
Content history
Analytics
Creator intelligence
```

The order may change based on team availability, but the rule does not:

> Secondary work cannot break the critical path.

---

# 58. TEAM OWNERSHIP

## AI / Matching Owner

Owns:

```text
transcription integration
semantic matching
candidate windows
candidate scoring
hook generation
caption generation
AI schema validation
```

Deliverable:

```text
script + transcript
→ ranked candidates
```

## Frontend Owner

Owns:

```text
project UI
upload
processing status
candidate UI
EditPlan editor
output UI
```

Deliverable:

```text
creator can drive the core workflow
```

## Backend / Infrastructure Owner

Owns:

```text
API
database
storage
job state
configuration
authentication
authorization
deployment
```

Deliverable:

```text
reliable service layer
```

## Media / Integration Owner

Owns:

```text
FFmpeg
probe
audio extraction
media validation
rendering
output validation
demo fixtures
integration media tests
```

Deliverable:

```text
validated EditPlan
→ playable output
```

Ownership prevents gaps but does not forbid cross-team debugging.

---

# 59. GIT CONTRACT

Stable branch:

```text
main
```

Feature branches may include:

```text
feature/media-pipeline
feature/transcription
feature/matching
feature/edit-plan
feature/rendering
feature/frontend
```

Rules:

```text
No secrets
Small understandable commits
Keep main runnable
Run relevant tests before merge
Do not introduce major dependencies silently
Do not rewrite another person's active work
```

---

# 60. 24-HOUR EXECUTION PLAN

## Hour 0–1 — Freeze

Freeze:

```text
MVP workflow
stack
environment
API responsibilities
domain models
EditPlan schema
ProcessingJob schema
golden test video
demo plan
team ownership
```

No feature expansion yet.

## Hour 1–4 — Media + Backend Foundation

Build:

```text
project model
asset upload
storage
media probe
validation
audio extraction
ProcessingJob
transcription foundation
```

Acceptance:

```text
video → validated source → audio → transcript
```

## Hour 4–8 — Matching

Build:

```text
transcript segmentation
script sectioning
candidate windows
semantic matching
candidate scoring
ClipCandidate persistence
```

Acceptance:

```text
script + transcript → ranked candidates
```

## Hour 8–12 — EditPlan + Rendering Core

Build:

```text
EditPlan schema
EditPlan validation
versioning
render instruction builder
FFmpeg renderer
output validation
```

Acceptance:

```text
candidate
→ EditPlan v1
→ creator timestamp change
→ EditPlan v2
→ second render
```

At hour 12, the **backend/media technical core** must work. The polished frontend editor is not yet the acceptance criterion.

## Hour 12–15 — Frontend Critical Path

Build:

```text
project
upload
processing state
candidate list
candidate preview
EditPlan editor
render
output
```

Acceptance:

```text
browser drives the already-proven service workflow
```

## Hour 15–18 — Secondary Product Layer

Add as stable time allows:

```text
hooks
captions
platform profiles
Demo Mode
caching
asset library
```

Do not add all of them if the core needs hardening.

## Hour 18–20 — Intelligence / Enrichment

Add:

```text
visual analysis
basic analytics
creator intelligence
history
```

Only where data and implementation are available.

## Hour 20–22 — Hardening

Test:

```text
bad file
large file
missing audio
transcription failure
AI timeout
matching failure
render failure
retry
page refresh during processing
ownership/auth checks
```

## Hour 22–23 — Demo Freeze

Run the exact presentation flow repeatedly.

Verify:

```text
Demo Mode works
Real Mode works
backup output exists
no broken controls
no secrets
```

## Hour 23–24 — Submission Freeze

No new features.

Prepare:

```text
README
architecture diagram
screenshots
demo
repository
presentation
submission
```

---

# 61. DEMO STORY

The demo should tell one coherent story:

```text
Creator has long-form video + script
            ↓
CreatorAI understands both
            ↓
Finds relevant moments
            ↓
Ranks candidates
            ↓
Creator selects one
            ↓
AI generates hook + captions where enabled
            ↓
EditPlan is created
            ↓
Creator changes timestamps
            ↓
New EditPlan version is saved
            ↓
FFmpeg renders approved result
            ↓
Output is validated
            ↓
Final short is exported
```

The point of the demo is not to show every screen.

The point is to show that **AI understanding leads to an editable, reproducible production decision**.

---

# 62. DEMO FALLBACK PLAN

If a live service fails:

```text
Real Mode problem
      ↓
Demo Mode
```

If AI matching is unavailable:

```text
precomputed demo candidates
```

If render fails during presentation:

```text
saved known-good demo output
```

The team must state clearly when a result is precomputed demo data.

Never present a precomputed result as a live model response.

---

# 63. FEATURE FREEZE

Once the critical path is reliable:

Allowed:

```text
bug fixes
reliability fixes
performance fixes
small UI polish
demo polish
```

Not allowed:

```text
new database
new architecture
new agent framework
new large integration
full editor
major dependency switch
new critical external service
```

No architecture rewrite in the final hours.

---

# 64. CUT ORDER IF TIME IS LOST

Cut in this order:

```text
1. advanced analytics
2. creator intelligence
3. visual analysis
4. multi-platform variants
5. asset tagging
6. advanced caption styling
7. multiple hook strategies
8. creator personalization
```

Never cut:

```text
upload
validation
transcription
matching
candidate selection
EditPlan
creator edit
render
output validation
export
```

---

# 65. SECURITY / RELIABILITY FINAL CHECK

Before submission:

```text
[ ] no secrets in Git
[ ] source media immutable
[ ] project/asset ownership checks
[ ] upload validation
[ ] safe FFmpeg execution
[ ] storage paths validated
[ ] AI outputs schema-validated
[ ] render failures preserve EditPlan
[ ] expensive stages cached
[ ] retries bounded
[ ] temporary files cleaned
[ ] demo data labeled
[ ] real data distinguished from demo data
```

---

# 66. FINAL ACCEPTANCE CHECKLIST

## Critical Path

```text
[ ] Project can be created
[ ] Video can be uploaded
[ ] Video is validated
[ ] Source is stored
[ ] Audio is extracted for speech-dependent flow
[ ] Timestamped transcript exists
[ ] Script is accepted
[ ] Matching returns candidates
[ ] Candidates are ranked
[ ] EditPlan v1 is generated
[ ] EditPlan can be modified
[ ] EditPlan v2 is created
[ ] FFmpeg renders
[ ] Output is validated
[ ] Output is playable
[ ] Output can be previewed
[ ] Output can be exported
```

## Reliability

```text
[ ] source remains immutable
[ ] render failure preserves EditPlan
[ ] visual-analysis failure does not block transcript-first flow
[ ] successful expensive stages are cached
[ ] retry avoids unnecessary recomputation
[ ] Demo Mode works
[ ] Real Mode works
```

## Security

```text
[ ] secrets are not committed
[ ] upload validation exists
[ ] ownership checks exist
[ ] safe FFmpeg execution exists
[ ] storage references are validated
```

## Presentation

```text
[ ] demo project loads
[ ] candidate ranking is understandable
[ ] EditPlan is visibly editable
[ ] second render reflects creator change
[ ] final output is ready
[ ] demo/sample analytics are honestly labeled
```

---

# 67. FINAL ARCHITECTURE IN ONE VIEW

```text
                         CREATOR
                            │
                            ▼
                    ┌───────────────┐
                    │    PROJECT    │
                    │ Script+Video  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   INGESTION   │
                    │ Validate/Store│
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ TRANSCRIPTION │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  UNDERSTAND   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    MATCH      │
                    │Script↔Footage │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  CANDIDATES   │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   EDITPLAN    │
                    │      v1       │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │ CREATOR EDIT  │
                    │      ↓        │
                    │   EditPlan v2 │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    FFMPEG     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │VALIDATE OUTPUT│
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    EXPORT     │
                    └───────────────┘

Supporting layers:
    Asset Management
    PlatformProfile objects
    Analytics
    Creator Intelligence
    Demo Mode
```

---

# 68. FINAL ENGINEERING PRINCIPLE

The implementation follows one separation:

```text
AI
UNDERSTANDS + GENERATES + SUGGESTS
            ↓
APPLICATION
VALIDATES + STORES + ORCHESTRATES
            ↓
MEDIA ENGINE
EXECUTES + RENDERS
            ↓
CREATOR
REVIEWS + MODIFIES + APPROVES
```

This keeps:

```text
AI flexible
application deterministic
media processing reproducible
creator control intact
```

---

# 69. FINAL RULE

> **We are not building an AI video editor with many disconnected tricks. We are building one connected creator workflow and proving that the AI's decisions remain understandable, editable, reproducible, and executable.**

The immediate coding target is:

```text
30–60 SECOND TEST VIDEO
        ↓
MEDIA PROBE
        ↓
AUDIO EXTRACTION
        ↓
TRANSCRIPTION
        ↓
SCRIPT MATCHING
        ↓
TIMESTAMP JSON
        ↓
EDITPLAN
        ↓
FFMPEG CLIP
```

Then:

```text
EDITPLAN v1
        ↓
CREATOR CHANGES START/END
        ↓
EDITPLAN v2
        ↓
SECOND RENDER
```

Only after that:

```text
FRONTEND
+
DEMO MODE
+
SECONDARY FEATURES
```

**The dashboard is not the first milestone. The machine is.**
