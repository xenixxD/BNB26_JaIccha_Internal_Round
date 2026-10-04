import os
import uuid
import logging
import hashlib
from typing import Any, Dict, Optional
from datetime import datetime, timezone
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
        list_projects, create_project, delete_project, list_assets, create_asset, list_clips, create_clip,
        init_db, update_asset, delete_asset, save_clip_draft, list_clip_drafts, update_clip, save_project_state,
        get_project_state, create_output, list_outputs, get_asset, get_cached_transcript, save_transcript,
        create_or_get_script_version, list_project_scripts, save_clip_candidates, list_clip_candidates,
        create_render_job, update_render_job, get_render_job, list_render_jobs,
        recover_interrupted_render_jobs,
    )
    from local_storage import ASSETS_DIR, OUTPUTS_DIR
except ModuleNotFoundError:
    from server.database import (
        list_projects, create_project, delete_project, list_assets, create_asset, list_clips, create_clip,
        init_db, update_asset, delete_asset, save_clip_draft, list_clip_drafts, update_clip, save_project_state,
        get_project_state, create_output, list_outputs, get_asset, get_cached_transcript, save_transcript,
        create_or_get_script_version, list_project_scripts, save_clip_candidates, list_clip_candidates,
        create_render_job, update_render_job, get_render_job, list_render_jobs,
        recover_interrupted_render_jobs,
    )
    from server.local_storage import ASSETS_DIR, OUTPUTS_DIR

try:
    from schemas import (
        SystemHealthResponse, AssetResponse,
        PotentialAnalysisRequest, PotentialAnalysisResponse,
        RetentionAnalysisRequest, RetentionAnalysisResponse,
        ABHookRequest, ABHookResponse,
        ScriptMatchRequest, ScriptMatchItem, ScriptMatchResponse, ClipCandidateResponse,
        ContentGenRequest, ContentGenResponse,
        PlannerGenerateRequest, PlannerGenerateResponse,
        AssetTranscriptResponse,
        ClipTrimRequest, TrimTaskResponse
    )
    from ffmpeg_service import check_ffmpeg, process_video_trim
    from ai_engine import (
        analyze_video_potential, analyze_retention_risk, generate_ab_hooks,
        generate_planner_ideas, generate_ai_content,
        transcribe_media_file, GEMINI_API_KEY, GROQ_API_KEY, genai_client, groq_client
    )
    from semantic_matcher import (
        match_script_to_transcript as match_script_semantically,
        SemanticMatcherUnavailable,
    )
except ModuleNotFoundError:
    from server.schemas import (
        SystemHealthResponse, AssetResponse,
        PotentialAnalysisRequest, PotentialAnalysisResponse,
        RetentionAnalysisRequest, RetentionAnalysisResponse,
        ABHookRequest, ABHookResponse,
        ScriptMatchRequest, ScriptMatchItem, ScriptMatchResponse, ClipCandidateResponse,
        ContentGenRequest, ContentGenResponse,
        PlannerGenerateRequest, PlannerGenerateResponse,
        AssetTranscriptResponse,
        ClipTrimRequest, TrimTaskResponse
    )
    from server.ffmpeg_service import check_ffmpeg, process_video_trim
    from server.ai_engine import (
        analyze_video_potential, analyze_retention_risk, generate_ab_hooks,
        generate_planner_ideas, generate_ai_content,
        transcribe_media_file, GEMINI_API_KEY, GROQ_API_KEY, genai_client, groq_client
    )
    from server.semantic_matcher import (
        match_script_to_transcript as match_script_semantically,
        SemanticMatcherUnavailable,
    )

init_db()
interrupted_jobs = recover_interrupted_render_jobs()
if interrupted_jobs:
    logging.getLogger(__name__).warning(
        "Marked %s interrupted render job(s) failed during startup recovery",
        interrupted_jobs,
    )

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


@app.delete("/api/projects/{project_id}", response_model=dict)
def delete_existing_project(project_id: str):
    try:
        deleted = delete_project(project_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    file_urls = [
        *(
            _local_media_path(url, "uploads", ASSETS_DIR)
            for url in deleted["asset_urls"]
        ),
        *(
            _local_media_path(url, "exports", OUTPUTS_DIR)
            for url in deleted["output_urls"]
        ),
    ]
    warnings = []
    for file_path in file_urls:
        if file_path and os.path.isfile(file_path):
            try:
                os.remove(file_path)
            except OSError as exc:
                logger.warning(
                    "Could not remove deleted project media file %s: %s",
                    file_path,
                    exc,
                )
                warnings.append(
                    f"A related local media file could not be removed: {os.path.basename(file_path)}"
                )

    return {
        "deleted": True,
        "project_id": project_id,
        "asset_count": len(deleted["asset_urls"]),
        "clip_count": len(deleted["clip_ids"]),
        "warnings": warnings,
    }


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

@app.get("/api/projects/{project_id}/scripts", response_model=list)
def get_project_scripts(project_id: str, source_asset_id: Optional[str] = None):
    if not any(project["id"] == project_id for project in list_projects()):
        raise HTTPException(status_code=404, detail="Project not found")
    if source_asset_id:
        asset = get_asset(source_asset_id)
        if not asset or asset["project_id"] != project_id:
            raise HTTPException(status_code=404, detail="Source asset not found in project")
    return list_project_scripts(project_id, source_asset_id)

@app.get("/api/projects/{project_id}/clip-candidates", response_model=list)
def get_project_clip_candidates(
    project_id: str,
    source_asset_id: Optional[str] = None,
    script_version_id: Optional[str] = None,
):
    if not any(project["id"] == project_id for project in list_projects()):
        raise HTTPException(status_code=404, detail="Project not found")
    return list_clip_candidates(project_id, source_asset_id, script_version_id)

@app.get("/api/projects/{project_id}/render-jobs", response_model=list)
def get_project_render_jobs(project_id: str):
    if not any(project["id"] == project_id for project in list_projects()):
        raise HTTPException(status_code=404, detail="Project not found")
    return list_render_jobs(project_id)

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


def _file_checksum_and_mime(path: str, file_type: str, extension: str) -> tuple[str, str]:
    with open(path, "rb") as media_file:
        header = media_file.read(32)
        media_file.seek(0)
        digest = hashlib.sha256()
        for chunk in iter(lambda: media_file.read(1024 * 1024), b""):
            digest.update(chunk)

    signatures = {
        ".mp4": (file_type == "video" and header[4:8] == b"ftyp", "video/mp4"),
        ".mov": (file_type == "video" and header[4:8] == b"ftyp", "video/quicktime"),
        ".m4a": (file_type == "audio" and header[4:8] == b"ftyp", "audio/mp4"),
        ".webm": (
            file_type == "video" and header.startswith(b"\x1a\x45\xdf\xa3"),
            "video/webm",
        ),
        ".mkv": (
            file_type == "video" and header.startswith(b"\x1a\x45\xdf\xa3"),
            "video/x-matroska",
        ),
        ".mp3": (
            file_type == "audio"
            and (header.startswith(b"ID3") or (len(header) > 1 and header[0] == 0xFF and header[1] & 0xE0 == 0xE0)),
            "audio/mpeg",
        ),
        ".wav": (file_type == "audio" and header.startswith(b"RIFF") and header[8:12] == b"WAVE", "audio/wav"),
        ".jpg": (file_type == "image" and header.startswith(b"\xff\xd8\xff"), "image/jpeg"),
        ".jpeg": (file_type == "image" and header.startswith(b"\xff\xd8\xff"), "image/jpeg"),
        ".png": (file_type == "image" and header.startswith(b"\x89PNG\r\n\x1a\n"), "image/png"),
        ".webp": (
            file_type == "image" and header.startswith(b"RIFF") and header[8:12] == b"WEBP",
            "image/webp",
        ),
    }
    valid, mime_type = signatures.get(extension, (False, "application/octet-stream"))
    if not valid:
        raise ValueError("Uploaded content does not match its declared media type")
    return digest.hexdigest(), mime_type


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

        try:
            checksum, mime_type = _file_checksum_and_mime(saved_path, file_type, file_ext)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        existing_asset = next(
            (
                asset
                for asset in list_assets(project_id)
                if asset.get("checksum") == checksum and asset.get("file_type") == file_type
            ),
            None,
        )
        if existing_asset:
            os.remove(saved_path)
            return AssetResponse(
                id=existing_asset["id"],
                project_id=existing_asset["project_id"],
                filename=existing_asset["filename"],
                file_type=existing_asset["file_type"],
                file_size=existing_asset["file_size"],
                url=existing_asset["url"],
                upload_date=existing_asset["upload_date"],
                duration=existing_asset.get("duration"),
                status=existing_asset["status"],
                checksum=existing_asset.get("checksum"),
                mime_type=existing_asset.get("mime_type"),
                duplicate=True,
            )
        file_url = f"/uploads/{saved_filename}"
        try:
            asset = create_asset({
                "id": asset_id,
                "projectId": project_id,
                "filename": original_filename,
                "fileType": file_type,
                "fileSize": file_size,
                "url": file_url,
                "uploadDate": datetime.now(timezone.utc).isoformat(),
                "duration": None,
                "status": "ready",
                "checksum": checksum,
                "mimeType": mime_type,
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
            status=asset["status"],
            checksum=asset["checksum"],
            mime_type=asset["mimeType"],
        )
    except HTTPException:
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise
    except Exception:
        logging.exception("Failed to upload media asset")
        if os.path.exists(saved_path):
            os.remove(saved_path)
        raise HTTPException(status_code=500, detail="Failed to upload asset") from None
    finally:
        await file.close()


def _require_ai_result(provider_used: str):
    if provider_used == "Heuristic Fallback Engine":
        raise HTTPException(
            status_code=503,
            detail={
                "code": "AI_PROVIDER_UNAVAILABLE",
                "message": "CreatorAI could not reach a configured AI provider. Check the server provider settings and try again.",
            },
        )

@app.post("/api/ai/analyze-potential", response_model=PotentialAnalysisResponse)
def api_analyze_potential(request: PotentialAnalysisRequest):
    candidates, provider_used = analyze_video_potential(
        asset_filename=request.asset_id,
        provider=request.provider or "auto"
    )
    _require_ai_result(provider_used)
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
    _require_ai_result(provider_used)
    return RetentionAnalysisResponse(**res)

@app.post("/api/ai/ab-hooks", response_model=ABHookResponse)
def api_ab_hooks(request: ABHookRequest):
    res, provider_used = generate_ab_hooks(
        segment_text=request.segment_text,
        tone=request.tone or "curious",
        audience=request.audience or "Creators & Engineers",
        provider=request.provider or "auto"
    )
    _require_ai_result(provider_used)
    res["provider_used"] = provider_used
    return ABHookResponse(**res)

@app.post("/api/ai/planner-generate", response_model=PlannerGenerateResponse)
def api_planner_generate(request: PlannerGenerateRequest):
    res, provider_used = generate_planner_ideas(
        topic=request.topic,
        niche=request.niche or "Tech & AI",
        days=request.days or 7,
        provider=request.provider or "auto"
    )
    _require_ai_result(provider_used)
    return PlannerGenerateResponse(
        topic=res["topic"],
        niche=res["niche"],
        items=res["items"],
        provider_used=provider_used
    )

@app.post("/api/ai/script-match", response_model=ScriptMatchResponse)
def api_script_match(request: ScriptMatchRequest):
    if not request.script_text.strip():
        raise HTTPException(status_code=422, detail="Script text must not be blank")
    asset = get_asset(request.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Source asset not found")
    try:
        script = create_or_get_script_version(
            project_id=asset["project_id"],
            source_asset_id=request.asset_id,
            title=request.script_title,
            text=request.script_text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    transcript = _get_or_create_asset_transcript(request.asset_id)
    try:
        raw_candidates = match_script_semantically(
            script_text=script["text"],
            transcript_segments=transcript["segments"],
            project_id=asset["project_id"],
            source_asset_id=request.asset_id,
            script_version_id=script["script_version_id"],
            transcript_id=transcript["id"],
        )
    except SemanticMatcherUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "LOCAL_SEMANTIC_MODEL_UNAVAILABLE",
                "message": str(exc),
            },
        ) from exc
    candidates = save_clip_candidates(
        raw_candidates,
        script_version_id=script["script_version_id"],
        transcript_id=transcript["id"],
    )
    matches = [
        ScriptMatchItem(
            id=candidate["id"],
            script_section_index=candidate["script_section_index"],
            script_section=candidate["script_section"],
            matched_transcript_excerpt=candidate["transcript_text"],
            start_time=candidate["start_time"],
            end_time=candidate["end_time"],
            confidence_score=round(candidate["final_score"], 1),
            explanation="; ".join(candidate["reasons"]),
            semantic_score=candidate["semantic_score"],
            completeness_score=candidate["completeness_score"],
            duration_score=candidate["duration_score"],
            reasons=candidate["reasons"],
        )
        for candidate in candidates
    ]
    return ScriptMatchResponse(
        asset_id=request.asset_id,
        script_id=script["script_id"],
        script_version_id=script["script_version_id"],
        transcript_id=transcript["id"],
        matches=matches,
        candidates=[ClipCandidateResponse(**candidate) for candidate in candidates],
        provider_used="local-fastembed",
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
    _require_ai_result(provider_used)
    return ContentGenResponse(
        hooks=content.get("hooks", []),
        caption=content.get("caption", ""),
        description=content.get("description", ""),
        hashtags=content.get("hashtags", []),
        subtitles=content.get("subtitles", []),
        provider_used=provider_used
    )

def _get_or_create_asset_transcript(asset_id: str):
    asset = get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Source asset not found")
    if asset["file_type"] not in {"video", "audio"}:
        raise HTTPException(status_code=400, detail="Only audio and video assets can be transcribed")
    asset_url = asset.get("url") or ""
    if not asset_url.startswith("/uploads/"):
        raise HTTPException(status_code=422, detail="Source asset is not stored in local uploads")
    saved_filename = os.path.basename(asset_url)
    saved_path = os.path.abspath(os.path.join(ASSETS_DIR, saved_filename))
    if os.path.commonpath([os.path.abspath(ASSETS_DIR), saved_path]) != os.path.abspath(ASSETS_DIR):
        raise HTTPException(status_code=422, detail="Invalid local media path")
    if not os.path.isfile(saved_path):
        raise HTTPException(status_code=410, detail="Source media file is missing from local storage")

    extension = os.path.splitext(saved_filename)[1].lower()
    try:
        checksum, mime_type = _file_checksum_and_mime(saved_path, asset["file_type"], extension)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if checksum != asset.get("checksum") or mime_type != asset.get("mimeType"):
        update_asset(asset_id, {"checksum": checksum, "mime_type": mime_type})

    transcript = get_cached_transcript(asset_id)
    if transcript:
        return transcript

    result = transcribe_media_file(saved_path)
    if result.get("status") != "success":
        raise HTTPException(
            status_code=503,
            detail={
                "code": result.get("error_code", "TRANSCRIPTION_FAILED"),
                "message": result.get("error_message", "Transcription is unavailable."),
            },
        )
    try:
        return save_transcript(
            asset_id=asset_id,
            source_checksum=checksum,
            provider=result["provider"],
            model=result["model"],
            text=result["text"],
            duration=result["duration"],
            segments=result["segments"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid transcript from provider: {exc}") from exc


@app.post(
    "/api/assets/{asset_id}/transcript",
    response_model=AssetTranscriptResponse,
)
def api_transcribe_asset(asset_id: str):
    return _get_or_create_asset_transcript(asset_id)

@app.post("/api/clips/trim", response_model=TrimTaskResponse)
def api_trim_clip(request: ClipTrimRequest):
    asset = get_asset(request.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Source asset not found")
    if asset["fileType"] != "video":
        raise HTTPException(status_code=400, detail="Only video assets can be trimmed")
    existing_clip = None
    if request.clip_id:
        existing_clip = next(
            (clip for clip in list_clips() if clip["id"] == request.clip_id),
            None,
        )
        if not existing_clip or existing_clip["assetId"] != request.asset_id:
            raise HTTPException(status_code=404, detail="Clip does not belong to the source asset")

    filename = os.path.basename(urlparse(asset["url"] or "").path)
    input_file_path = os.path.abspath(os.path.join(ASSETS_DIR, filename))
    if os.path.commonpath((os.path.abspath(ASSETS_DIR), input_file_path)) != os.path.abspath(ASSETS_DIR):
        raise HTTPException(status_code=400, detail="Invalid source asset reference")
    task_id = str(uuid.uuid4())
    clip_id = request.clip_id or f"clip_{task_id[:8]}"
    duration = round(request.end_time - request.start_time, 2)
    drafts = list_clip_drafts(clip_id) if existing_clip else []
    create_render_job({
        "task_id": task_id,
        "project_id": asset["project_id"],
        "asset_id": request.asset_id,
        "clip_id": clip_id,
        "draft_id": drafts[-1]["id"] if drafts else None,
        "duration_seconds": duration,
    })
    update_render_job(task_id, {"status": "processing", "progress": 1})

    output_path = None
    clip_persisted = False
    task_result: Dict[str, Any]
    try:
        if not filename or not os.path.isfile(input_file_path):
            ffmpeg_ok, _ = check_ffmpeg()
            task_result = {
                "task_id": task_id,
                "clip_id": clip_id,
                "status": "failed",
                "progress": 0.0,
                "output_filename": None,
                "output_url": None,
                "file_size_bytes": 0,
                "duration_seconds": duration,
                "error_message": "Source video file not found on server disk for FFmpeg trimming.",
                "ffmpeg_used": ffmpeg_ok,
            }
            return TrimTaskResponse(**update_render_job(task_id, task_result))

        task_result = process_video_trim(
            input_path=input_file_path,
            start_time=request.start_time,
            end_time=request.end_time,
            aspect_ratio=request.aspect_ratio,
            task_id=task_id,
            clip_id=clip_id,
        )
        if task_result["status"] != "completed":
            return TrimTaskResponse(**update_render_job(task_id, task_result))
        output_filename = task_result["output_filename"]
        if not output_filename or task_result["file_size_bytes"] <= 0:
            raise RuntimeError("FFmpeg reported success without a non-empty output file")
        output_path = os.path.join(OUTPUTS_DIR, output_filename)
        if not os.path.isfile(output_path):
            raise RuntimeError("FFmpeg output file is missing from local storage")

        clip_payload: Dict[str, Any] = {
            "startTime": request.start_time,
            "endTime": request.end_time,
            "duration": request.end_time - request.start_time,
            "aspectRatio": request.aspect_ratio,
            "status": "Ready for Review",
            "exportedUrl": task_result["output_url"],
        }
        if existing_clip:
            update_clip(clip_id, clip_payload)
            project_id = existing_clip["projectId"]
        else:
            clip_payload.update({
                "id": clip_id,
                "projectId": asset["project_id"],
                "assetId": request.asset_id,
                "title": f"Generated Clip {clip_id[-4:]}",
            })
            create_clip(clip_payload)
            project_id = asset["project_id"]
        clip_persisted = True

        drafts = list_clip_drafts(clip_id)
        create_output({
            "project_id": project_id,
            "asset_id": request.asset_id,
            "clip_id": clip_id,
            "draft_id": drafts[-1]["id"] if drafts else None,
            "filename": output_filename,
            "url": task_result["output_url"],
            "file_size": task_result["file_size_bytes"],
            "metadata": {
                "start_time": request.start_time,
                "end_time": request.end_time,
                "aspect_ratio": request.aspect_ratio,
            },
        })
        return TrimTaskResponse(**update_render_job(task_id, task_result))
    except Exception as exc:
        if output_path and os.path.isfile(output_path):
            os.remove(output_path)
        if clip_persisted:
            try:
                update_clip(clip_id, {"status": "Draft", "exportedUrl": None})
            except Exception:
                logging.getLogger(__name__).exception(
                    "Could not revert clip %s after export persistence failed",
                    clip_id,
                )
        try:
            update_render_job(task_id, {
                "status": "failed",
                "progress": 0,
                "output_filename": None,
                "output_url": None,
                "file_size_bytes": 0,
                "error_message": f"Export persistence failed: {exc}",
            })
        except Exception:
            logging.getLogger(__name__).exception(
                "Could not persist failure for render job %s",
                task_id,
            )
        raise HTTPException(status_code=500, detail=f"Failed to persist export: {exc}") from exc

@app.get("/api/clips/status/{task_id}", response_model=TrimTaskResponse)
def api_clip_status(task_id: str):
    res = get_render_job(task_id)
    if not res:
        raise HTTPException(status_code=404, detail="Task ID not found")
    return TrimTaskResponse(**res)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
