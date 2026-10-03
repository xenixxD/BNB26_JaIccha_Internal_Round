from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

class SystemHealthResponse(BaseModel):
    status: str
    ffmpeg_available: bool
    ffmpeg_path: Optional[str] = None
    gemini_configured: bool
    version: str = "1.0.0"

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

class PotentialAnalysisResponse(BaseModel):
    asset_id: str
    candidates: List[MomentCandidate]
    methodology: str = "NLP Heuristic & Structure Analysis"

class ScriptMatchRequest(BaseModel):
    asset_id: str
    script_text: str
    transcript_json: Optional[List[Dict[str, Any]]] = None

class ScriptMatchItem(BaseModel):
    id: str
    script_section: str
    matched_transcript_excerpt: str
    start_time: float
    end_time: float
    confidence_score: float
    explanation: str

class ScriptMatchResponse(BaseModel):
    asset_id: str
    matches: List[ScriptMatchItem]

class ContentGenRequest(BaseModel):
    clip_id: str
    transcript_segment: str
    platform: str = "instagram_reels" # "instagram_reels" | "youtube_shorts" | "tiktok" | "linkedin"

class ContentGenResponse(BaseModel):
    hooks: List[str]
    caption: str
    description: str
    hashtags: List[str]
    subtitles: List[Dict[str, Any]]

class ClipTrimRequest(BaseModel):
    asset_id: str
    video_url: Optional[str] = None
    start_time: float
    end_time: float
    aspect_ratio: str = "9:16" # "9:16" | "16:9" | "1:1"
    burn_subtitles: bool = False
    subtitle_lines: Optional[List[Dict[str, Any]]] = None

class TrimTaskResponse(BaseModel):
    task_id: str
    clip_id: str
    status: str # "queued" | "processing" | "completed" | "failed"
    progress: float
    output_filename: Optional[str] = None
    output_url: Optional[str] = None
    file_size_bytes: Optional[int] = None
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    ffmpeg_used: bool
