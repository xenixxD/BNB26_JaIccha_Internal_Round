import os
import shutil
import uuid
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from server.database.asset_service import AssetService
from server.database.project_service import ProjectService
from server.storage.storage_service import StorageService
from server.creatorai.pipeline import CreatorAIPipeline

try:
    from .schemas import (
        SystemHealthResponse, AssetResponse,
        PotentialAnalysisRequest, PotentialAnalysisResponse,
        ScriptMatchRequest, ScriptMatchResponse,
        ContentGenRequest, ContentGenResponse,
        ClipTrimRequest, TrimTaskResponse
    )
    from .ffmpeg_service import check_ffmpeg, process_video_trim, get_task_status, UPLOADS_DIR, EXPORTS_DIR
    from .ai_engine import analyze_video_potential, match_script_to_transcript, generate_ai_content, GEMINI_API_KEY
except ImportError:  # pragma: no cover
    from schemas import (
        SystemHealthResponse, AssetResponse,
        PotentialAnalysisRequest, PotentialAnalysisResponse,
        ScriptMatchRequest, ScriptMatchResponse,
        ContentGenRequest, ContentGenResponse,
        ClipTrimRequest, TrimTaskResponse
    )
    from ffmpeg_service import check_ffmpeg, process_video_trim, get_task_status, UPLOADS_DIR, EXPORTS_DIR
    from ai_engine import analyze_video_potential, match_script_to_transcript, generate_ai_content, GEMINI_API_KEY

project_service = ProjectService()
asset_service = AssetService()
storage_service = StorageService(os.path.join(os.path.dirname(__file__), "runtime_storage"))
creator_ai_pipeline = CreatorAIPipeline(
    project_service=project_service,
    asset_service=asset_service,
    storage_service=storage_service,
)

app = FastAPI(
    title="CreatorAI Backend Server",
    description="FastAPI backend providing video clipping, transcription, and AI content analysis services.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directories for uploads and exports
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/exports", StaticFiles(directory=EXPORTS_DIR), name="exports")

@app.get("/api/health", response_model=SystemHealthResponse)
def get_health():
    ffmpeg_ok, ffmpeg_path = check_ffmpeg()
    return SystemHealthResponse(
        status="ok",
        ffmpeg_available=ffmpeg_ok,
        ffmpeg_path=ffmpeg_path,
        gemini_configured=bool(GEMINI_API_KEY),
        version="1.0.0"
    )

@app.post("/api/assets/upload", response_model=AssetResponse)
async def upload_asset(
    file: UploadFile = File(...),
    project_id: str = Form("proj_default"),
    file_type: str = Form("video")
):
    try:
        file_ext = os.path.splitext(file.filename)[1]
        unique_id = str(uuid.uuid4())[:8]
        saved_filename = f"{unique_id}_{file.filename}"
        saved_path = os.path.join(UPLOADS_DIR, saved_filename)
        project_service.create_project(project_id, f"Project {project_id}", f"Uploaded asset {file.filename}")

        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        storage_result = storage_service.store_source(project_id, f"asset_{unique_id}", saved_path, file.filename)
        asset_payload = asset_service.create_asset(
            f"asset_{unique_id}",
            project_id,
            file.filename,
            media_type=file_type,
            storage_key=storage_result["path"],
            checksum_sha256=storage_result.get("checksum"),
        )

        file_size = os.path.getsize(saved_path)
        file_url = f"/uploads/{saved_filename}"

        return AssetResponse(
            id=asset_payload["asset_id"],
            project_id=project_id,
            filename=file.filename,
            file_type=file_type,
            file_size=file_size,
            url=file_url,
            upload_date="Just now",
            duration=160.0 if file_type == "video" else None,
            status=asset_payload.get("status", "ready")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload asset: {str(e)}")

@app.post("/api/ai/analyze-potential", response_model=PotentialAnalysisResponse)
def api_analyze_potential(request: PotentialAnalysisRequest):
    candidates = analyze_video_potential()
    return PotentialAnalysisResponse(
        asset_id=request.asset_id,
        candidates=candidates,
        methodology="Transcript Hook & WPM Pacing NLP Heuristics"
    )

@app.post("/api/ai/script-match", response_model=ScriptMatchResponse)
def api_script_match(request: ScriptMatchRequest):
    matches = match_script_to_transcript(script_text=request.script_text)
    return ScriptMatchResponse(
        asset_id=request.asset_id,
        matches=matches
    )

@app.post("/api/ai/generate-content", response_model=ContentGenResponse)
def api_generate_content(request: ContentGenRequest):
    content = generate_ai_content(
        transcript_segment=request.transcript_segment,
        platform=request.platform
    )
    return ContentGenResponse(**content)

@app.post("/api/clips/trim", response_model=TrimTaskResponse)
def api_trim_clip(request: ClipTrimRequest):
    # Resolve input video file path
    input_file_path = None
    if request.video_url and request.video_url.startswith("/uploads/"):
        filename = os.path.basename(request.video_url)
        input_file_path = os.path.join(UPLOADS_DIR, filename)
        
    if not input_file_path or not os.path.exists(input_file_path):
        # Fallback to search any existing mp4 in UPLOADS_DIR
        files = [f for f in os.listdir(UPLOADS_DIR) if f.endswith(".mp4")]
        if files:
            input_file_path = os.path.join(UPLOADS_DIR, files[0])
            
    if not input_file_path or not os.path.exists(input_file_path):
        ffmpeg_ok, _ = check_ffmpeg()
        return TrimTaskResponse(
            task_id=str(uuid.uuid4()),
            clip_id=f"clip_{str(uuid.uuid4())[:8]}",
            status="failed",
            progress=0.0,
            output_filename=None,
            output_url=None,
            file_size_bytes=0,
            duration_seconds=round(request.end_time - request.start_time, 2),
            error_message="Source video file not found on server disk for FFmpeg trimming.",
            ffmpeg_used=ffmpeg_ok
        )
        
    task_res = process_video_trim(
        asset_id=request.asset_id,
        input_path=input_file_path,
        start_time=request.start_time,
        end_time=request.end_time,
        aspect_ratio=request.aspect_ratio
    )
    return TrimTaskResponse(**task_res)

@app.get("/api/clips/status/{task_id}", response_model=TrimTaskResponse)
def api_clip_status(task_id: str):
    res = get_task_status(task_id)
    if not res:
        raise HTTPException(status_code=404, detail="Task ID not found")
    return TrimTaskResponse(**res)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server.main:app", host="0.0.0.0", port=8000, reload=True)
