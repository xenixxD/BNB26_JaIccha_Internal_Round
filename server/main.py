import os
import uuid
import logging
from typing import Optional
from urllib.parse import urlparse
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv, find_dotenv

# Load local configuration before importing modules that resolve the data directory.
env_path = find_dotenv(usecwd=True)
load_dotenv(env_path)

try:
    from database import (
        list_projects, create_project, list_assets, create_asset, list_clips, create_clip,
        init_db, update_asset, delete_asset, save_clip_draft, list_clip_drafts, update_clip, save_project_state,
        get_project_state, create_output, list_outputs
    )
    from local_storage import ASSETS_DIR, OUTPUTS_DIR
except ModuleNotFoundError:
    from server.database import (
        list_projects, create_project, list_assets, create_asset, list_clips, create_clip,
        init_db, update_asset, delete_asset, save_clip_draft, list_clip_drafts, update_clip, save_project_state,
        get_project_state, create_output, list_outputs
    )
    from server.local_storage import ASSETS_DIR, OUTPUTS_DIR

try:
    from schemas import (
        SystemHealthResponse, AssetResponse,
        PotentialAnalysisRequest, PotentialAnalysisResponse,
        RetentionAnalysisRequest, RetentionAnalysisResponse,
        ABHookRequest, ABHookResponse,
        ScriptMatchRequest, ScriptMatchResponse,
        ContentGenRequest, ContentGenResponse,
        PlannerGenerateRequest, PlannerGenerateResponse,
        TranscriptionResponse,
        ClipTrimRequest, TrimTaskResponse
    )
    from ffmpeg_service import check_ffmpeg, process_video_trim, get_task_status
    from ai_engine import (
        analyze_video_potential, analyze_retention_risk, generate_ab_hooks,
        generate_planner_ideas, match_script_to_transcript, generate_ai_content,
        transcribe_media_file, GEMINI_API_KEY, GROQ_API_KEY, genai_client, groq_client
    )
except ModuleNotFoundError:
    from server.schemas import (
        SystemHealthResponse, AssetResponse,
        PotentialAnalysisRequest, PotentialAnalysisResponse,
        RetentionAnalysisRequest, RetentionAnalysisResponse,
        ABHookRequest, ABHookResponse,
        ScriptMatchRequest, ScriptMatchResponse,
        ContentGenRequest, ContentGenResponse,
        PlannerGenerateRequest, PlannerGenerateResponse,
        TranscriptionResponse,
        ClipTrimRequest, TrimTaskResponse
    )
    from server.ffmpeg_service import check_ffmpeg, process_video_trim, get_task_status
    from server.ai_engine import (
        analyze_video_potential, analyze_retention_risk, generate_ab_hooks,
        generate_planner_ideas, match_script_to_transcript, generate_ai_content,
        transcribe_media_file, GEMINI_API_KEY, GROQ_API_KEY, genai_client, groq_client
    )

init_db()

app = FastAPI(
    title="CreatorAI Backend Server",
    description="FastAPI backend providing Gemini + Groq AI video intelligence, transcription, retention analysis, and FFmpeg clipping.",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=ASSETS_DIR), name="uploads")
app.mount("/exports", StaticFiles(directory=OUTPUTS_DIR), name="exports")
logger = logging.getLogger(__name__)


def _local_media_path(url: Optional[str], route_prefix: str, root: str) -> Optional[str]:
    parsed = urlparse(url or "")
    relative_path = parsed.path.lstrip("/")
    expected_prefix = f"{route_prefix}/"
    if parsed.scheme or parsed.netloc or not relative_path.startswith(expected_prefix):
        return None

    filename = relative_path[len(expected_prefix):]
    if not filename or os.path.basename(filename) != filename:
        return None

    root_path = os.path.realpath(root)
    file_path = os.path.realpath(os.path.join(root_path, filename))
    try:
        if os.path.commonpath((root_path, file_path)) == root_path:
            return file_path
    except ValueError:
        return None
    return None


@app.get("/api/health", response_model=SystemHealthResponse)
def get_health():
    ffmpeg_ok, ffmpeg_path = check_ffmpeg()
    return SystemHealthResponse(
        status="ok",
        ffmpeg_available=ffmpeg_ok,
        ffmpeg_path=ffmpeg_path,
        gemini_configured=bool(genai_client or os.getenv("GEMINI_API_KEY")),
        groq_configured=bool(groq_client or os.getenv("GROQ_API_KEY")),
        whisper_available=bool(groq_client or os.getenv("GROQ_API_KEY")),
        version="1.2.0"
    )

@app.get("/api/projects", response_model=list)
def get_projects():
    return list_projects()

@app.post("/api/projects", response_model=dict)
def create_new_project(request: dict):
    payload = dict(request)
    project = create_project(payload)
    return project

@app.get("/api/assets", response_model=list)
def get_assets(project_id: Optional[str] = None):
    return list_assets(project_id)

@app.post("/api/assets", response_model=dict)
def create_new_asset(request: dict):
    try:
        return create_asset(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.put("/api/assets/{asset_id}", response_model=dict)
def update_existing_asset(asset_id: str, request: dict):
    try:
        return update_asset(asset_id, request)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.delete("/api/assets/{asset_id}", response_model=dict)
def delete_existing_asset(asset_id: str):
    try:
        deleted = delete_asset(asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    files_to_remove = [
        _local_media_path(deleted["asset_url"], "uploads", ASSETS_DIR),
        *(
            _local_media_path(url, "exports", OUTPUTS_DIR)
            for url in deleted["output_urls"]
        ),
    ]
    warnings = []
    for file_path in files_to_remove:
        if file_path and os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except OSError as exc:
                logger.warning("Could not remove deleted asset media file %s: %s", file_path, exc)
                warnings.append(
                    f"A related local media file could not be removed: {os.path.basename(file_path)}"
                )

    return {
        "deleted": True,
        "asset_id": asset_id,
        "clip_ids": deleted["clip_ids"],
        "warnings": warnings,
    }


@app.get("/api/clips", response_model=list)
def get_clips(project_id: Optional[str] = None):
    return list_clips(project_id)

@app.post("/api/clips", response_model=dict)
def create_new_clip(request: dict):
    try:
        return create_clip(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.put("/api/clips/{clip_id}", response_model=dict)
def update_existing_clip(clip_id: str, request: dict):
    try:
        return update_clip(clip_id, request)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@app.post("/api/clips/{clip_id}/drafts", response_model=dict)
def save_clip_draft_version(clip_id: str, request: dict):
    try:
        return save_clip_draft(clip_id, request)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@app.get("/api/clips/{clip_id}/drafts", response_model=list)
def get_clip_draft_versions(clip_id: str):
    return list_clip_drafts(clip_id)

@app.get("/api/projects/{project_id}/state", response_model=dict)
def get_project_persisted_state(project_id: str):
    return get_project_state(project_id)

@app.put("/api/projects/{project_id}/state/{state_key}", response_model=dict)
def put_project_persisted_state(project_id: str, state_key: str, request: dict):
    if state_key not in {
        "transcript", "candidateMoments", "scriptMatches",
        "retentionAnalysis", "abHookVariations",
    }:
        raise HTTPException(status_code=400, detail="Unsupported project state key")
    if "data" not in request:
        raise HTTPException(status_code=422, detail="Request must include data")
    try:
        return save_project_state(project_id, state_key, request["data"])
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

@app.get("/api/projects/{project_id}/outputs", response_model=list)
def get_project_outputs(project_id: str):
    return list_outputs(project_id)

@app.post("/api/assets/upload", response_model=AssetResponse)
async def upload_asset(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    file_type: str = Form("video")
):
    if not any(project["id"] == project_id for project in list_projects()):
        raise HTTPException(status_code=404, detail="Project not found")
    allowed_types = {
        "video": {".mp4", ".mov", ".webm", ".mkv"},
        "audio": {".mp3", ".wav", ".m4a"},
        "image": {".jpg", ".jpeg", ".png", ".webp"},
    }
    original_filename = os.path.basename((file.filename or "").replace("\\", "/"))
    file_ext = os.path.splitext(original_filename)[1].lower()
    if file_type not in allowed_types or file_ext not in allowed_types[file_type]:
        raise HTTPException(status_code=400, detail="Unsupported asset type or file extension")

    asset_id = f"asset_{uuid.uuid4().hex[:12]}"
    saved_filename = f"{asset_id}{file_ext}"
    saved_path = os.path.join(ASSETS_DIR, saved_filename)
    file_size = 0
    max_upload_size = 500 * 1024 * 1024
    try:
        with open(saved_path, "xb") as buffer:
            while chunk := await file.read(1024 * 1024):
                file_size += len(chunk)
                if file_size > max_upload_size:
                    raise HTTPException(status_code=413, detail="Upload exceeds the 500 MB limit")
                buffer.write(chunk)

        file_url = f"/uploads/{saved_filename}"
        try:
            asset = create_asset({
                "id": asset_id,
                "projectId": project_id,
                "filename": original_filename,
                "fileType": file_type,
                "fileSize": file_size,
                "url": file_url,
                "uploadDate": __import__("datetime").datetime.now(
                    __import__("datetime").timezone.utc
                ).isoformat(),
                "duration": None,
                "status": "ready",
                "isDemo": False,
            })
        except Exception:
            if os.path.exists(saved_path):
                os.remove(saved_path)
            raise

        return AssetResponse(
            id=asset["id"],
            project_id=asset["project_id"],
            filename=asset["filename"],
            file_type=asset["file_type"],
            file_size=asset["file_size"],
            url=asset["url"],
            upload_date=asset["upload_date"],
            duration=asset["duration"],
            status=asset["status"]
        )
    except HTTPException:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise
    except Exception as e:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(status_code=500, detail=f"Failed to upload asset: {str(e)}")
    finally:
        await file.close()

@app.post("/api/ai/analyze-potential", response_model=PotentialAnalysisResponse)
def api_analyze_potential(request: PotentialAnalysisRequest):
    candidates, provider_used = analyze_video_potential(
        asset_filename=request.asset_id,
        provider=request.provider or "auto"
    )
    return PotentialAnalysisResponse(
        asset_id=request.asset_id,
        candidates=candidates,
        methodology=f"Video Virality Intelligence via {provider_used}",
        provider_used=provider_used
    )

@app.post("/api/ai/analyze-retention", response_model=RetentionAnalysisResponse)
def api_analyze_retention(request: RetentionAnalysisRequest):
    res, provider_used = analyze_retention_risk(
        asset_id=request.asset_id,
        provider=request.provider or "auto"
    )
    return RetentionAnalysisResponse(**res)

@app.post("/api/ai/ab-hooks", response_model=ABHookResponse)
def api_ab_hooks(request: ABHookRequest):
    res, provider_used = generate_ab_hooks(
        segment_text=request.segment_text,
        tone=request.tone or "curious",
        audience=request.audience or "Creators & Engineers",
        provider=request.provider or "auto"
    )
    return ABHookResponse(**res)

@app.post("/api/ai/planner-generate", response_model=PlannerGenerateResponse)
def api_planner_generate(request: PlannerGenerateRequest):
    res, provider_used = generate_planner_ideas(
        topic=request.topic,
        niche=request.niche or "Tech & AI",
        days=request.days or 7,
        provider=request.provider or "auto"
    )
    return PlannerGenerateResponse(
        topic=res["topic"],
        niche=res["niche"],
        items=res["items"],
        provider_used=provider_used
    )

@app.post("/api/ai/script-match", response_model=ScriptMatchResponse)
def api_script_match(request: ScriptMatchRequest):
    matches, provider_used = match_script_to_transcript(
        script_text=request.script_text,
        provider=request.provider or "auto"
    )
    return ScriptMatchResponse(
        asset_id=request.asset_id,
        matches=matches,
        provider_used=provider_used
    )

@app.post("/api/ai/generate-content", response_model=ContentGenResponse)
def api_generate_content(request: ContentGenRequest):
    content, provider_used = generate_ai_content(
        transcript_segment=request.transcript_segment,
        platform=request.platform,
        tone=request.tone or "curious",
        topic=request.topic or "AI Creator Workflow",
        provider=request.provider or "auto"
    )
    return ContentGenResponse(
        hooks=content.get("hooks", []),
        caption=content.get("caption", ""),
        description=content.get("description", ""),
        hashtags=content.get("hashtags", []),
        subtitles=content.get("subtitles", []),
        provider_used=provider_used
    )

@app.post("/api/ai/transcribe")
async def api_transcribe(file: UploadFile = File(...)):
    try:
        unique_id = str(uuid.uuid4())[:8]
        saved_filename = f"transcribe_{unique_id}_{file.filename}"
        saved_path = os.path.join(UPLOADS_DIR, saved_filename)
        
        with open(saved_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        result = transcribe_media_file(saved_path)
        
        # Cleanup temporary audio/video file
        try:
            if os.path.exists(saved_path):
                os.remove(saved_path)
        except Exception as cleanup_err:
            print(f"Cleanup error for {saved_path}: {cleanup_err}")
            
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error_message"))
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/api/clips/trim", response_model=TrimTaskResponse)
def api_trim_clip(request: ClipTrimRequest):
    asset = next((item for item in list_assets() if item["id"] == request.asset_id), None)
    if not asset:
        raise HTTPException(status_code=404, detail="Source asset not found")
    if asset["fileType"] != "video":
        raise HTTPException(status_code=400, detail="Only video assets can be trimmed")
    filename = os.path.basename(urlparse(asset["url"] or "").path)
    input_file_path = os.path.abspath(os.path.join(ASSETS_DIR, filename))
    if os.path.commonpath((os.path.abspath(ASSETS_DIR), input_file_path)) != os.path.abspath(ASSETS_DIR):
        raise HTTPException(status_code=400, detail="Invalid source asset reference")
    if not filename or not os.path.isfile(input_file_path):
        ffmpeg_ok, _ = check_ffmpeg()
        return TrimTaskResponse(
            task_id=str(uuid.uuid4()),
            clip_id=request.clip_id or f"clip_{uuid.uuid4().hex[:8]}",
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
    if task_res.get("status") == "completed":
        clip_id = request.clip_id or task_res["clip_id"]
        if request.clip_id:
            existing_clip = next((c for c in list_clips() if c["id"] == request.clip_id), None)
            if not existing_clip or existing_clip["assetId"] != request.asset_id:
                raise HTTPException(status_code=404, detail="Clip does not belong to the source asset")
            clip_payload = {
                "startTime": request.start_time,
                "endTime": request.end_time,
                "duration": request.end_time - request.start_time,
                "aspectRatio": request.aspect_ratio,
                "status": "Ready for Review",
                "exportedUrl": task_res["output_url"],
            }
            project_id = existing_clip["projectId"]
            update_clip(clip_id, clip_payload)
        else:
            clip_payload = {
                "id": clip_id,
                "projectId": asset["projectId"],
                "assetId": request.asset_id,
                "title": f"Generated Clip {clip_id[-4:]}",
                "startTime": request.start_time,
                "endTime": request.end_time,
                "duration": request.end_time - request.start_time,
                "aspectRatio": request.aspect_ratio,
                "status": "Ready for Review",
                "exportedUrl": task_res["output_url"],
            }
            project_id = asset["projectId"]
            create_clip(clip_payload)

        task_res["clip_id"] = clip_id
        drafts = list_clip_drafts(clip_id)
        try:
            create_output({
                "project_id": project_id,
                "asset_id": request.asset_id,
                "clip_id": clip_id,
                "draft_id": drafts[-1]["id"] if drafts else None,
                "filename": task_res["output_filename"],
                "url": task_res["output_url"],
                "file_size": task_res["file_size_bytes"],
                "metadata": {
                    "start_time": request.start_time,
                    "end_time": request.end_time,
                    "aspect_ratio": request.aspect_ratio,
                },
            })
        except Exception as exc:
            output_path = os.path.join(OUTPUTS_DIR, task_res["output_filename"])
            if os.path.isfile(output_path):
                os.remove(output_path)
            raise HTTPException(status_code=500, detail=f"Failed to persist export metadata: {exc}") from exc
    return TrimTaskResponse(**task_res)

@app.get("/api/clips/status/{task_id}", response_model=TrimTaskResponse)
def api_clip_status(task_id: str):
    res = get_task_status(task_id)
    if not res:
        raise HTTPException(status_code=404, detail="Task ID not found")
    return TrimTaskResponse(**res)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
