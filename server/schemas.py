from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Dict, Any, Literal

class SystemHealthResponse(BaseModel):
    status: str
    ffmpeg_available: bool
    ffmpeg_path: Optional[str] = None
    gemini_configured: bool
    groq_configured: bool
    whisper_available: bool
    version: str = "1.2.0"

class ProjectItem(BaseModel):
    id: str
    name: str
    description: str = ""
    category: str = "General"
    targetPlatforms: List[str] = []
    createdAt: str
    status: str = "Active"
    thumbnail: Optional[str] = None
    assetsCount: int = 0
    clipsCount: int = 0

class ProjectCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    category: Optional[str] = "General"
    targetPlatforms: Optional[List[str]] = None
    thumbnail: Optional[str] = None
    status: Optional[str] = "Active"

class AssetResponse(BaseModel):
    id: str
    project_id: str
    filename: str
    file_type: str # "video" | "audio" | "image" | "script"
    file_size: int
    url: str
    upload_date: str
    duration: Optional[float] = None
    status: str # "ready" | "processing" | "error"
    checksum: Optional[str] = None
    mime_type: Optional[str] = None

class ProjectListResponse(BaseModel):
    projects: List[ProjectItem]

class AssetListResponse(BaseModel):
    assets: List[AssetResponse]

class MomentCandidate(BaseModel):
    id: str
    title: str
    start_time: float
    end_time: float
    duration: float
    transcript_excerpt: str
    potential_score: float # 0.0 - 100.0
    rating_label: str # "High Potential" | "Moderate Potential" | "Needs Improvement"
    suggested_hook: str
    reasons: List[str]

class PotentialAnalysisRequest(BaseModel):
    asset_id: str
    transcript: Optional[str] = None
    min_duration: float = 15.0
    max_duration: float = 60.0
    provider: Optional[str] = "auto" # "auto" | "gemini" | "groq"

class PotentialAnalysisResponse(BaseModel):
    asset_id: str
    candidates: List[MomentCandidate]
    methodology: str = "NLP Heuristic & Structure Analysis"
    provider_used: Optional[str] = "auto"

# Retention Analyzer Schemas
class WeakSection(BaseModel):
    id: str
    start_time: float
    end_time: float
    risk_level: Literal["High Drop-off Risk", "Moderate Risk", "Minor Pacing Issue"]
    issue_type: str # "Unnecessary Pause", "Weak Opening Hook", "Repetitive Speech", "Abrupt Transition"
    description: str
    suggestion: str

class RetentionAnalysisRequest(BaseModel):
    asset_id: str
    clip_id: Optional[str] = None
    provider: Optional[str] = "auto"

class RetentionAnalysisResponse(BaseModel):
    asset_id: str
    overall_retention_score: float # Heuristic engagement estimate 0-100
    opening_effectiveness: str # "Strong Hook (Top 5%)", "Needs Punchier Opener", etc.
    pacing_wpm: float
    weak_sections: List[WeakSection]
    actionable_recommendations: List[str]
    methodology_note: str = "Heuristic prediction based on transcript pacing, pause density, and topic boundaries (Not real platform analytics)."
    provider_used: Optional[str] = "auto"

# A/B Hook Generator Schemas
class HookVariation(BaseModel):
    id: str
    style: Literal["Curiosity-Driven", "Bold & Controversial", "Educational", "Storytelling", "Question-Based"]
    hook_text: str
    suggested_caption: str
    predicted_impact: str # "Higher CTR", "Better Retention", "More Comments"

class ABHookRequest(BaseModel):
    clip_id: str
    segment_text: str
    preferred_styles: Optional[List[str]] = None
    tone: Optional[str] = "curious" # "curious" | "bold" | "educational" | "professional"
    audience: Optional[str] = "Creators & Engineers"
    provider: Optional[str] = "auto"

class ABHookResponse(BaseModel):
    clip_id: str
    original_hook: str
    variations: List[HookVariation]
    provider_used: Optional[str] = "auto"

class ScriptMatchRequest(BaseModel):
    asset_id: str
    script_text: str = Field(min_length=1, max_length=20000)
    script_title: str = Field(default="Script", min_length=1, max_length=120)

class ScriptMatchItem(BaseModel):
    id: str
    script_section_index: int
    script_section: str
    matched_transcript_excerpt: str
    start_time: float
    end_time: float
    confidence_score: float
    explanation: str
    semantic_score: float
    completeness_score: float
    duration_score: float
    reasons: List[str]

class ClipCandidateResponse(BaseModel):
    id: str
    project_id: str
    source_asset_id: str
    script_version_id: str
    transcript_id: str
    script_section_index: int
    script_section: str
    start_time: float
    end_time: float
    transcript_text: str
    semantic_score: float
    completeness_score: float
    visual_score: Optional[float] = None
    duration_score: float
    final_score: float
    reasons: List[str]
    status: str
    created_at: str
    updated_at: str

class ScriptMatchResponse(BaseModel):
    asset_id: str
    script_id: str
    script_version_id: str
    transcript_id: str
    matches: List[ScriptMatchItem]
    candidates: List[ClipCandidateResponse]
    provider_used: Optional[str] = "auto"

class ContentGenRequest(BaseModel):
    clip_id: str
    transcript_segment: str
    platform: str = "instagram_reels"
    tone: Optional[str] = "curious"
    topic: Optional[str] = "AI Creator Workflow"
    provider: Optional[str] = "auto"

class ContentGenResponse(BaseModel):
    hooks: List[str]
    caption: str
    description: str
    hashtags: List[str]
    subtitles: List[Dict[str, Any]]
    provider_used: Optional[str] = "auto"

class PlannerGenerateRequest(BaseModel):
    topic: str
    niche: Optional[str] = "Tech & AI Content Creation"
    days: int = 7
    provider: Optional[str] = "auto"

class PlannerGenerateResponse(BaseModel):
    topic: str
    niche: str
    items: List[Dict[str, Any]]
    provider_used: Optional[str] = "auto"

class TranscriptionResponse(BaseModel):
    filename: str
    text: str
    duration: float
    segments: Optional[List[Dict[str, Any]]] = None
    provider_used: str = "groq_whisper"

class TranscriptSegmentResponse(BaseModel):
    start: float
    end: float
    text: str
    confidence: Optional[float] = None

class AssetTranscriptResponse(BaseModel):
    id: str
    asset_id: str
    source_checksum: str
    provider: str
    model: str
    text: str
    duration: float
    created_at: str
    segments: List[TranscriptSegmentResponse]

class ClipTrimRequest(BaseModel):
    asset_id: str
    clip_id: Optional[str] = None
    video_url: Optional[str] = None
    start_time: float = Field(ge=0)
    end_time: float = Field(gt=0)
    aspect_ratio: Literal["9:16", "1:1", "16:9"] = "9:16"
    burn_subtitles: bool = False
    subtitle_lines: Optional[List[Dict[str, Any]]] = None

    @model_validator(mode="after")
    def validate_trim_range(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be greater than start_time")
        return self

class TrimTaskResponse(BaseModel):
    task_id: str
    clip_id: str
    status: str
    progress: float
    output_filename: Optional[str] = None
    output_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    ffmpeg_used: bool
