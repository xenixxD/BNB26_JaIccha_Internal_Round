import json
import math
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

try:
    from local_storage import DATA_DIR, migrate_legacy_local_data
except ModuleNotFoundError:
    from server.local_storage import DATA_DIR, migrate_legacy_local_data

migrate_legacy_local_data()
DB_PATH = os.path.join(DATA_DIR, "creatorai.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                content_goal TEXT,
                category TEXT,
                target_platforms TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT,
                status TEXT NOT NULL DEFAULT 'Active',
                thumbnail TEXT,
                assets_count INTEGER NOT NULL DEFAULT 0,
                clips_count INTEGER NOT NULL DEFAULT 0,
                metadata TEXT DEFAULT '{}'
            )
            """
        )

        project_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(projects)").fetchall()
        }
        if "content_goal" not in project_columns:
            conn.execute("ALTER TABLE projects ADD COLUMN content_goal TEXT")
        if "updated_at" not in project_columns:
            conn.execute("ALTER TABLE projects ADD COLUMN updated_at TEXT")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS assets (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER NOT NULL DEFAULT 0,
                url TEXT,
                upload_date TEXT NOT NULL,
                duration REAL,
                status TEXT NOT NULL DEFAULT 'ready',
                content TEXT,
                checksum TEXT,
                mime_type TEXT,
                is_demo INTEGER NOT NULL DEFAULT 0,
                metadata TEXT DEFAULT '{}',
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )
            """
        )
        asset_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(assets)").fetchall()
        }
        if "checksum" not in asset_columns:
            conn.execute("ALTER TABLE assets ADD COLUMN checksum TEXT")
        if "mime_type" not in asset_columns:
            conn.execute("ALTER TABLE assets ADD COLUMN mime_type TEXT")

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS clips (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                asset_id TEXT,
                title TEXT NOT NULL,
                start_time REAL NOT NULL,
                end_time REAL NOT NULL,
                duration REAL NOT NULL,
                aspect_ratio TEXT NOT NULL DEFAULT '9:16',
                potential_score REAL NOT NULL DEFAULT 0,
                rating_label TEXT,
                suggested_hook TEXT,
                hooks TEXT DEFAULT '[]',
                selected_hook_index INTEGER DEFAULT 0,
                caption TEXT,
                hashtags TEXT DEFAULT '[]',
                subtitles TEXT DEFAULT '[]',
                status TEXT NOT NULL DEFAULT 'Draft',
                scheduled_date TEXT,
                platform TEXT,
                exported_url TEXT,
                metadata TEXT DEFAULT '{}',
                FOREIGN KEY(project_id) REFERENCES projects(id),
                FOREIGN KEY(asset_id) REFERENCES assets(id)
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS project_state (
                project_id TEXT NOT NULL,
                state_key TEXT NOT NULL,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (project_id, state_key),
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS clip_drafts (
                id TEXT PRIMARY KEY,
                clip_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                version INTEGER NOT NULL,
                parent_id TEXT,
                created_at TEXT NOT NULL,
                payload TEXT NOT NULL,
                UNIQUE (clip_id, version),
                FOREIGN KEY(clip_id) REFERENCES clips(id),
                FOREIGN KEY(project_id) REFERENCES projects(id),
                FOREIGN KEY(parent_id) REFERENCES clip_drafts(id)
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS outputs (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                asset_id TEXT NOT NULL,
                clip_id TEXT NOT NULL,
                draft_id TEXT,
                filename TEXT NOT NULL,
                url TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                metadata TEXT NOT NULL DEFAULT '{}',
                FOREIGN KEY(project_id) REFERENCES projects(id),
                FOREIGN KEY(asset_id) REFERENCES assets(id),
                FOREIGN KEY(clip_id) REFERENCES clips(id),
                FOREIGN KEY(draft_id) REFERENCES clip_drafts(id)
            )
            """
        )

        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS transcripts (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                asset_id TEXT NOT NULL,
                source_checksum TEXT NOT NULL,
                provider TEXT NOT NULL,
                model TEXT NOT NULL,
                text TEXT NOT NULL,
                duration REAL NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE (asset_id, source_checksum, provider, model),
                FOREIGN KEY(project_id) REFERENCES projects(id),
                FOREIGN KEY(asset_id) REFERENCES assets(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS transcript_segments (
                id TEXT PRIMARY KEY,
                transcript_id TEXT NOT NULL,
                sequence INTEGER NOT NULL,
                start_time REAL NOT NULL,
                end_time REAL NOT NULL,
                text TEXT NOT NULL,
                confidence REAL,
                UNIQUE (transcript_id, sequence),
                FOREIGN KEY(transcript_id) REFERENCES transcripts(id)
            )
            """
        )

        conn.commit()
    finally:
        conn.close()


def list_projects() -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM projects ORDER BY created_at DESC, name ASC"
        ).fetchall()
        return [project_to_dict(row) for row in rows]
    finally:
        conn.close()


def create_project(payload: Dict[str, Any]) -> Dict[str, Any]:
    project_id = payload.get("id") or f"proj_{uuid.uuid4().hex[:12]}"
    created_at = payload.get("createdAt") or payload.get("created_at") or datetime.now(
        timezone.utc
    ).strftime("%Y-%m-%d")
    project = {
        "id": project_id,
        "name": payload.get("name") or "New Project",
        "description": payload.get("description") or "",
        "content_goal": payload.get("contentGoal") or payload.get("content_goal") or "",
        "category": payload.get("category") or "General",
        "target_platforms": payload.get("targetPlatforms") or payload.get("target_platforms") or [],
        "created_at": created_at,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "status": payload.get("status") or "Active",
        "thumbnail": payload.get("thumbnail") or "",
        "assets_count": int(payload.get("assetsCount") or 0),
        "clips_count": int(payload.get("clipsCount") or 0),
        "metadata": payload.get("metadata") or {},
    }

    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO projects (
                id, name, description, content_goal, category, target_platforms, created_at,
                updated_at, status, thumbnail, assets_count, clips_count, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project["id"],
                project["name"],
                project["description"],
                project["content_goal"],
                project["category"],
                json.dumps(project["target_platforms"]),
                project["created_at"],
                project["updated_at"],
                project["status"],
                project["thumbnail"],
                project["assets_count"],
                project["clips_count"],
                json.dumps(project["metadata"]),
            ),
        )
        conn.commit()
        return project_to_dict(conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone())
    finally:
        conn.close()


def list_assets(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        if project_id:
            rows = conn.execute(
                "SELECT * FROM assets WHERE project_id = ? ORDER BY upload_date DESC, filename ASC",
                (project_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM assets ORDER BY upload_date DESC, filename ASC").fetchall()
        return [asset_to_dict(row) for row in rows]
    finally:
        conn.close()


def create_asset(payload: Dict[str, Any]) -> Dict[str, Any]:
    project_id = payload.get("projectId") or payload.get("project_id")
    if not project_id:
        raise ValueError("Project ID is required")

    asset = {
        "id": payload.get("id") or f"asset_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "filename": payload.get("filename") or "uploaded_file",
        "file_type": payload.get("fileType") or payload.get("file_type") or "video",
        "file_size": int(payload.get("fileSize") or payload.get("file_size") or 0),
        "url": payload.get("url") or "#",
        "upload_date": payload.get("uploadDate") or payload.get("upload_date") or datetime.now(
            timezone.utc
        ).strftime("%Y-%m-%d"),
        "duration": payload.get("duration"),
        "status": payload.get("status") or "ready",
        "content": payload.get("content"),
        "checksum": payload.get("checksum"),
        "mime_type": payload.get("mimeType") or payload.get("mime_type"),
        "is_demo": bool(payload.get("isDemo") or payload.get("is_demo") or 0),
        "metadata": payload.get("metadata") or {},
    }

    conn = get_connection()
    try:
        if not conn.execute(
            "SELECT 1 FROM projects WHERE id = ?", (asset["project_id"],)
        ).fetchone():
            raise ValueError(f"Project not found: {asset['project_id']}")
        conn.execute(
            """
            INSERT INTO assets (
                id, project_id, filename, file_type, file_size, url, upload_date, duration,
                status, content, checksum, mime_type, is_demo, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                asset["id"],
                asset["project_id"],
                asset["filename"],
                asset["file_type"],
                asset["file_size"],
                asset["url"],
                asset["upload_date"],
                asset["duration"],
                asset["status"],
                asset["content"],
                asset["checksum"],
                asset["mime_type"],
                1 if asset["is_demo"] else 0,
                json.dumps(asset["metadata"]),
            ),
        )
        conn.execute(
            "UPDATE projects SET assets_count = assets_count + 1, updated_at = ? WHERE id = ?",
            (
                datetime.now(timezone.utc).isoformat(),
                asset["project_id"],
            ),
        )
        conn.commit()
        return asset_to_dict(conn.execute(
            "SELECT * FROM assets WHERE id = ?", (asset["id"],)
        ).fetchone())
    finally:
        conn.close()


def update_asset(asset_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
        if not row:
            raise ValueError(f"Asset not found: {asset_id}")
        if "duration" in payload:
            conn.execute(
                "UPDATE assets SET duration = ? WHERE id = ?",
                (payload["duration"], asset_id),
            )
        if "checksum" in payload:
            transcript_rows = conn.execute(
                "SELECT id FROM transcripts WHERE asset_id = ? AND source_checksum != ?",
                (asset_id, payload["checksum"]),
            ).fetchall()
            transcript_ids = [item["id"] for item in transcript_rows]
            if transcript_ids:
                placeholders = ",".join("?" for _ in transcript_ids)
                conn.execute(
                    f"DELETE FROM transcript_segments WHERE transcript_id IN ({placeholders})",
                    transcript_ids,
                )
                conn.execute(
                    f"DELETE FROM transcripts WHERE id IN ({placeholders})",
                    transcript_ids,
                )
            conn.execute(
                "UPDATE assets SET checksum = ? WHERE id = ?",
                (payload["checksum"], asset_id),
            )
        if "mime_type" in payload:
            conn.execute(
                "UPDATE assets SET mime_type = ? WHERE id = ?",
                (payload["mime_type"], asset_id),
            )
        conn.commit()
        return asset_to_dict(conn.execute(
            "SELECT * FROM assets WHERE id = ?", (asset_id,)
        ).fetchone())
    finally:
        conn.close()


def get_asset(asset_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
        return asset_to_dict(row) if row else None
    finally:
        conn.close()


def save_transcript(
    asset_id: str,
    source_checksum: str,
    provider: str,
    model: str,
    text: str,
    duration: float,
    segments: List[Dict[str, Any]],
) -> Dict[str, Any]:
    if not source_checksum or not provider or not model or not text.strip():
        raise ValueError("Transcript metadata and text are required")
    if not math.isfinite(duration) or duration <= 0:
        raise ValueError("Transcript duration must be a positive finite number")
    if not segments:
        raise ValueError("A transcript must contain timestamped segments")

    normalized_segments: List[Dict[str, Any]] = []
    previous_start = -1.0
    for index, segment in enumerate(segments):
        try:
            start = float(segment.get("start", segment.get("start_time", 0)))
            end = float(segment.get("end", segment.get("end_time", 0)))
            confidence = segment.get("confidence")
            if confidence is not None:
                confidence = float(confidence)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Transcript segment {index} has invalid numeric fields") from exc
        segment_text = str(segment.get("text", "")).strip()
        if (
            not math.isfinite(start)
            or not math.isfinite(end)
            or start < 0
            or end <= start
            or end > duration + 1
            or start < previous_start
            or not segment_text
        ):
            raise ValueError(f"Transcript segment {index} has invalid timing or text")
        if confidence is not None:
            if not math.isfinite(confidence) or not 0 <= confidence <= 1:
                raise ValueError(f"Transcript segment {index} has invalid confidence")
        normalized_segments.append({
            "start": start,
            "end": end,
            "text": segment_text,
            "confidence": confidence,
        })
        previous_start = start

    conn = get_connection()
    try:
        asset = conn.execute(
            "SELECT project_id, checksum FROM assets WHERE id = ?",
            (asset_id,),
        ).fetchone()
        if not asset:
            raise ValueError(f"Asset not found: {asset_id}")
        if asset["checksum"] != source_checksum:
            raise ValueError("Asset checksum changed; transcript cannot be attached")

        conn.execute(
            """
            INSERT OR IGNORE INTO transcripts (
                id, project_id, asset_id, source_checksum, provider, model, text, duration, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"transcript_{uuid.uuid4().hex}",
                asset["project_id"],
                asset_id,
                source_checksum,
                provider,
                model,
                text.strip(),
                duration,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        transcript = conn.execute(
            """
            SELECT * FROM transcripts
            WHERE asset_id = ? AND source_checksum = ? AND provider = ? AND model = ?
            """,
            (asset_id, source_checksum, provider, model),
        ).fetchone()
        if transcript is None:
            raise RuntimeError("Transcript persistence failed")
        existing_segments = conn.execute(
            "SELECT COUNT(*) AS count FROM transcript_segments WHERE transcript_id = ?",
            (transcript["id"],),
        ).fetchone()["count"]
        if not existing_segments:
            for index, segment in enumerate(normalized_segments):
                conn.execute(
                    """
                    INSERT INTO transcript_segments (
                        id, transcript_id, sequence, start_time, end_time, text, confidence
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        f"segment_{uuid.uuid4().hex}",
                        transcript["id"],
                        index,
                        segment["start"],
                        segment["end"],
                        segment["text"],
                        segment["confidence"],
                    ),
                )
        conn.commit()
        return transcript_to_dict(
            transcript,
            conn.execute(
                """
                SELECT * FROM transcript_segments
                WHERE transcript_id = ? ORDER BY sequence
                """,
                (transcript["id"],),
            ).fetchall(),
        )
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_cached_transcript(asset_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        asset = conn.execute(
            "SELECT checksum FROM assets WHERE id = ?",
            (asset_id,),
        ).fetchone()
        if not asset or not asset["checksum"]:
            return None
        transcript = conn.execute(
            """
            SELECT * FROM transcripts
            WHERE asset_id = ? AND source_checksum = ?
            ORDER BY created_at DESC LIMIT 1
            """,
            (asset_id, asset["checksum"]),
        ).fetchone()
        if not transcript:
            return None
        segments = conn.execute(
            "SELECT * FROM transcript_segments WHERE transcript_id = ? ORDER BY sequence",
            (transcript["id"],),
        ).fetchall()
        return transcript_to_dict(transcript, segments)
    finally:
        conn.close()


def delete_asset(asset_id: str) -> Dict[str, Any]:
    conn = get_connection()
    try:
        asset = conn.execute(
            "SELECT id, project_id, url FROM assets WHERE id = ?",
            (asset_id,),
        ).fetchone()
        if not asset:
            raise ValueError(f"Asset not found: {asset_id}")

        clip_rows = conn.execute(
            "SELECT id FROM clips WHERE asset_id = ?",
            (asset_id,),
        ).fetchall()
        clip_ids = [row["id"] for row in clip_rows]
        output_rows = conn.execute(
            "SELECT url FROM outputs WHERE asset_id = ?",
            (asset_id,),
        ).fetchall()
        output_urls = [row["url"] for row in output_rows]
        conn.execute("DELETE FROM outputs WHERE asset_id = ?", (asset_id,))
        transcript_rows = conn.execute(
            "SELECT id FROM transcripts WHERE asset_id = ?",
            (asset_id,),
        ).fetchall()
        transcript_ids = [row["id"] for row in transcript_rows]
        if transcript_ids:
            placeholders = ",".join("?" for _ in transcript_ids)
            conn.execute(
                f"DELETE FROM transcript_segments WHERE transcript_id IN ({placeholders})",
                transcript_ids,
            )
            conn.execute(
                f"DELETE FROM transcripts WHERE id IN ({placeholders})",
                transcript_ids,
            )

        if clip_ids:
            placeholders = ",".join("?" for _ in clip_ids)
            draft_rows = conn.execute(
                f"""
                SELECT id FROM clip_drafts
                WHERE clip_id IN ({placeholders})
                ORDER BY version DESC
                """,
                clip_ids,
            ).fetchall()
            for draft in draft_rows:
                conn.execute("DELETE FROM clip_drafts WHERE id = ?", (draft["id"],))
        conn.execute("DELETE FROM clips WHERE asset_id = ?", (asset_id,))
        conn.execute("DELETE FROM assets WHERE id = ?", (asset_id,))
        conn.execute(
            """
            UPDATE projects SET
                assets_count = MAX(assets_count - 1, 0),
                clips_count = MAX(clips_count - ?, 0),
                updated_at = ?
            WHERE id = ?
            """,
            (
                len(clip_ids),
                datetime.now(timezone.utc).isoformat(),
                asset["project_id"],
            ),
        )
        conn.commit()
        return {
            "asset_id": asset_id,
            "project_id": asset["project_id"],
            "asset_url": asset["url"],
            "clip_ids": clip_ids,
            "output_urls": output_urls,
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def delete_project(project_id: str) -> Dict[str, Any]:
    conn = get_connection()
    try:
        project = conn.execute(
            "SELECT id FROM projects WHERE id = ?",
            (project_id,),
        ).fetchone()
        if not project:
            raise ValueError(f"Project not found: {project_id}")

        asset_rows = conn.execute(
            "SELECT id, url FROM assets WHERE project_id = ?",
            (project_id,),
        ).fetchall()
        clip_rows = conn.execute(
            "SELECT id FROM clips WHERE project_id = ?",
            (project_id,),
        ).fetchall()
        output_rows = conn.execute(
            "SELECT url FROM outputs WHERE project_id = ?",
            (project_id,),
        ).fetchall()
        transcript_rows = conn.execute(
            "SELECT id FROM transcripts WHERE project_id = ?",
            (project_id,),
        ).fetchall()
        clip_ids = [row["id"] for row in clip_rows]
        transcript_ids = [row["id"] for row in transcript_rows]
        asset_files = [row["url"] for row in asset_rows]
        output_files = [row["url"] for row in output_rows]

        conn.execute("DELETE FROM outputs WHERE project_id = ?", (project_id,))
        if clip_ids:
            placeholders = ",".join("?" for _ in clip_ids)
            draft_rows = conn.execute(
                f"""
                SELECT id FROM clip_drafts
                WHERE clip_id IN ({placeholders})
                ORDER BY version DESC
                """,
                clip_ids,
            ).fetchall()
            for draft in draft_rows:
                conn.execute("DELETE FROM clip_drafts WHERE id = ?", (draft["id"],))
        conn.execute("DELETE FROM clips WHERE project_id = ?", (project_id,))
        if transcript_ids:
            placeholders = ",".join("?" for _ in transcript_ids)
            conn.execute(
                f"DELETE FROM transcript_segments WHERE transcript_id IN ({placeholders})",
                transcript_ids,
            )
            conn.execute(
                f"DELETE FROM transcripts WHERE id IN ({placeholders})",
                transcript_ids,
            )
        conn.execute("DELETE FROM assets WHERE project_id = ?", (project_id,))
        conn.execute("DELETE FROM project_state WHERE project_id = ?", (project_id,))
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
        return {
            "project_id": project_id,
            "asset_urls": asset_files,
            "output_urls": output_files,
            "clip_ids": clip_ids,
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def list_clips(project_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        if project_id:
            rows = conn.execute(
                "SELECT * FROM clips WHERE project_id = ? ORDER BY start_time ASC",
                (project_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM clips ORDER BY start_time ASC").fetchall()
        return [clip_to_dict(row) for row in rows]
    finally:
        conn.close()


def create_clip(payload: Dict[str, Any]) -> Dict[str, Any]:
    start_time = float(payload.get("startTime") or payload.get("start_time") or 0.0)
    end_time = float(payload.get("endTime") or payload.get("end_time") or 30.0)
    explicit_duration = payload.get("duration")
    computed_duration = max(end_time - start_time, 0.0)
    project_id = payload.get("projectId") or payload.get("project_id")
    if not project_id:
        raise ValueError("Project ID is required")

    clip = {
        "id": payload.get("id") or f"clip_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "asset_id": payload.get("assetId") or payload.get("asset_id"),
        "title": payload.get("title") or "Generated Clip",
        "start_time": start_time,
        "end_time": end_time,
        "duration": float(explicit_duration) if explicit_duration is not None else computed_duration,
        "aspect_ratio": payload.get("aspectRatio") or payload.get("aspect_ratio") or "9:16",
        "potential_score": float(payload.get("potentialScore") or payload.get("potential_score") or 0.0),
        "rating_label": payload.get("ratingLabel") or payload.get("rating_label") or "High Potential",
        "suggested_hook": payload.get("suggestedHook") or payload.get("suggested_hook") or "",
        "hooks": payload.get("hooks") or [],
        "selected_hook_index": int(payload.get("selectedHookIndex") or payload.get("selected_hook_index") or 0),
        "caption": payload.get("caption") or "",
        "hashtags": payload.get("hashtags") or [],
        "subtitles": payload.get("subtitles") or [],
        "status": payload.get("status") or "Draft",
        "scheduled_date": payload.get("scheduledDate") or payload.get("scheduled_date"),
        "platform": payload.get("platform") or "Instagram Reels",
        "exported_url": payload.get("exportedUrl") or payload.get("exported_url"),
        "metadata": payload.get("metadata") or {},
    }

    conn = get_connection()
    try:
        if not conn.execute(
            "SELECT 1 FROM projects WHERE id = ?", (clip["project_id"],)
        ).fetchone():
            raise ValueError(f"Project not found: {clip['project_id']}")
        if clip["asset_id"] and not conn.execute(
            "SELECT 1 FROM assets WHERE id = ? AND project_id = ?",
            (clip["asset_id"], clip["project_id"]),
        ).fetchone():
            raise ValueError(f"Asset not found in project: {clip['asset_id']}")
        conn.execute(
            """
            INSERT INTO clips (
                id, project_id, asset_id, title, start_time, end_time, duration, aspect_ratio, potential_score,
                rating_label, suggested_hook, hooks, selected_hook_index, caption, hashtags, subtitles, status,
                scheduled_date, platform, exported_url, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                clip["id"],
                clip["project_id"],
                clip["asset_id"],
                clip["title"],
                clip["start_time"],
                clip["end_time"],
                clip["duration"],
                clip["aspect_ratio"],
                clip["potential_score"],
                clip["rating_label"],
                clip["suggested_hook"],
                json.dumps(clip["hooks"]),
                clip["selected_hook_index"],
                clip["caption"],
                json.dumps(clip["hashtags"]),
                json.dumps(clip["subtitles"]),
                clip["status"],
                clip["scheduled_date"],
                clip["platform"],
                clip["exported_url"],
                json.dumps(clip["metadata"]),
            ),
        )
        conn.execute(
            "UPDATE projects SET clips_count = clips_count + 1, updated_at = ? WHERE id = ?",
            (
                datetime.now(timezone.utc).isoformat(),
                clip["project_id"],
            ),
        )
        conn.commit()
        return clip_to_dict(conn.execute(
            "SELECT * FROM clips WHERE id = ?", (clip["id"],)
        ).fetchone())
    finally:
        conn.close()


CLIP_FIELDS = {
    "title": ("title",),
    "start_time": ("startTime", "start_time"),
    "end_time": ("endTime", "end_time"),
    "duration": ("duration",),
    "aspect_ratio": ("aspectRatio", "aspect_ratio"),
    "potential_score": ("potentialScore", "potential_score"),
    "rating_label": ("ratingLabel", "rating_label"),
    "suggested_hook": ("suggestedHook", "suggested_hook"),
    "hooks": ("hooks",),
    "selected_hook_index": ("selectedHookIndex", "selected_hook_index"),
    "caption": ("caption",),
    "hashtags": ("hashtags",),
    "subtitles": ("subtitles",),
    "status": ("status",),
    "scheduled_date": ("scheduledDate", "scheduled_date"),
    "platform": ("platform",),
    "exported_url": ("exportedUrl", "exported_url"),
}
JSON_CLIP_FIELDS = {"hooks", "hashtags", "subtitles"}


def _merge_clip_payload(existing: Dict[str, Any], payload: Dict[str, Any]) -> Dict[str, Any]:
    merged = {
        field: next(
            (existing[alias] for alias in aliases if alias in existing),
            None,
        )
        for field, aliases in CLIP_FIELDS.items()
    }
    for field, aliases in CLIP_FIELDS.items():
        for alias in aliases:
            if alias in payload:
                merged[field] = payload[alias]
                break
    if "start_time" in payload or "startTime" in payload:
        merged["start_time"] = float(merged["start_time"])
    if "end_time" in payload or "endTime" in payload:
        merged["end_time"] = float(merged["end_time"])
    if "duration" in payload:
        merged["duration"] = float(payload["duration"])
    elif "start_time" in payload or "startTime" in payload or "end_time" in payload or "endTime" in payload:
        merged["duration"] = max(merged["end_time"] - merged["start_time"], 0.0)
    if merged["start_time"] < 0 or merged["end_time"] <= merged["start_time"]:
        raise ValueError("Clip end time must be greater than a non-negative start time")
    return merged


def update_clip(clip_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
        if not row:
            raise ValueError(f"Clip not found: {clip_id}")
        merged = _merge_clip_payload(clip_to_dict(row), payload)
        assignments = ", ".join(f"{field} = ?" for field in CLIP_FIELDS)
        values = []
        for field in CLIP_FIELDS:
            value = merged[field]
            values.append(json.dumps(value) if field in JSON_CLIP_FIELDS else value)
        conn.execute(
            f"UPDATE clips SET {assignments} WHERE id = ?",
            (*values, clip_id),
        )
        conn.commit()
        updated = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
        return clip_to_dict(updated)
    finally:
        conn.close()


def save_clip_draft(clip_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
        if not row:
            raise ValueError(f"Clip not found: {clip_id}")
        merged = _merge_clip_payload(clip_to_dict(row), payload)
        latest = conn.execute(
            "SELECT id, version FROM clip_drafts WHERE clip_id = ? ORDER BY version DESC LIMIT 1",
            (clip_id,),
        ).fetchone()
        version = latest["version"] + 1 if latest else 1
        draft_id = f"draft_{uuid.uuid4().hex}"
        created_at = datetime.now(timezone.utc).isoformat()
        snapshot = {**merged, "id": clip_id, "projectId": row["project_id"], "assetId": row["asset_id"]}
        conn.execute(
            """
            INSERT INTO clip_drafts (id, clip_id, project_id, version, parent_id, created_at, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                draft_id,
                clip_id,
                row["project_id"],
                version,
                latest["id"] if latest else None,
                created_at,
                json.dumps(snapshot),
            ),
        )
        assignments = ", ".join(f"{field} = ?" for field in CLIP_FIELDS)
        values = []
        for field in CLIP_FIELDS:
            value = merged[field]
            values.append(json.dumps(value) if field in JSON_CLIP_FIELDS else value)
        conn.execute(
            f"UPDATE clips SET {assignments} WHERE id = ?",
            (*values, clip_id),
        )
        updated = conn.execute("SELECT * FROM clips WHERE id = ?", (clip_id,)).fetchone()
        snapshot = clip_to_dict(updated)
        snapshot["id"] = clip_id
        snapshot["projectId"] = row["project_id"]
        snapshot["assetId"] = row["asset_id"]
        conn.commit()
        return {
            "id": draft_id,
            "clip_id": clip_id,
            "project_id": row["project_id"],
            "version": version,
            "parent_id": latest["id"] if latest else None,
            "created_at": created_at,
            "payload": snapshot,
        }
    finally:
        conn.close()


def list_clip_drafts(clip_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM clip_drafts WHERE clip_id = ? ORDER BY version ASC",
            (clip_id,),
        ).fetchall()
        return [
            {
                "id": row["id"],
                "clip_id": row["clip_id"],
                "project_id": row["project_id"],
                "version": row["version"],
                "parent_id": row["parent_id"],
                "created_at": row["created_at"],
                "payload": json.loads(row["payload"]),
            }
            for row in rows
        ]
    finally:
        conn.close()


def save_project_state(project_id: str, state_key: str, payload: Any) -> Dict[str, Any]:
    updated_at = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    try:
        if not conn.execute("SELECT 1 FROM projects WHERE id = ?", (project_id,)).fetchone():
            raise ValueError(f"Project not found: {project_id}")
        conn.execute(
            """
            INSERT INTO project_state (project_id, state_key, payload, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(project_id, state_key) DO UPDATE SET
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (project_id, state_key, json.dumps(payload), updated_at),
        )
        conn.commit()
        return {"project_id": project_id, "state_key": state_key, "updated_at": updated_at}
    finally:
        conn.close()


def get_project_state(project_id: str) -> Dict[str, Any]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT state_key, payload, updated_at FROM project_state WHERE project_id = ?",
            (project_id,),
        ).fetchall()
        return {
            row["state_key"]: {
                "data": json.loads(row["payload"]),
                "updated_at": row["updated_at"],
            }
            for row in rows
        }
    finally:
        conn.close()


def create_output(payload: Dict[str, Any]) -> Dict[str, Any]:
    output = {
        "id": payload.get("id") or f"output_{uuid.uuid4().hex}",
        "project_id": payload["project_id"],
        "asset_id": payload["asset_id"],
        "clip_id": payload["clip_id"],
        "draft_id": payload.get("draft_id"),
        "filename": payload["filename"],
        "url": payload["url"],
        "file_size": int(payload["file_size"]),
        "created_at": payload.get("created_at") or datetime.now(timezone.utc).isoformat(),
        "metadata": payload.get("metadata") or {},
    }
    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO outputs (
                id, project_id, asset_id, clip_id, draft_id, filename, url, file_size, created_at, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                output["id"], output["project_id"], output["asset_id"], output["clip_id"],
                output["draft_id"], output["filename"], output["url"], output["file_size"],
                output["created_at"], json.dumps(output["metadata"]),
            ),
        )
        conn.commit()
        return output
    finally:
        conn.close()


def list_outputs(project_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM outputs WHERE project_id = ? ORDER BY created_at DESC",
            (project_id,),
        ).fetchall()
        return [
            {
                "id": row["id"],
                "project_id": row["project_id"],
                "asset_id": row["asset_id"],
                "clip_id": row["clip_id"],
                "draft_id": row["draft_id"],
                "filename": row["filename"],
                "url": row["url"],
                "file_size": row["file_size"],
                "created_at": row["created_at"],
                "metadata": json.loads(row["metadata"] or "{}"),
            }
            for row in rows
        ]
    finally:
        conn.close()


def project_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "contentGoal": row["content_goal"] or "",
        "category": row["category"],
        "targetPlatforms": json.loads(row["target_platforms"] or "[]"),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"] or row["created_at"],
        "status": row["status"],
        "thumbnail": row["thumbnail"],
        "assetsCount": row["assets_count"],
        "clipsCount": row["clips_count"],
    }


def asset_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "projectId": row["project_id"],
        "project_id": row["project_id"],
        "filename": row["filename"],
        "fileType": row["file_type"],
        "file_type": row["file_type"],
        "fileSize": row["file_size"],
        "file_size": row["file_size"],
        "url": row["url"],
        "uploadDate": row["upload_date"],
        "upload_date": row["upload_date"],
        "duration": row["duration"],
        "status": row["status"],
        "content": row["content"],
        "checksum": row["checksum"],
        "mimeType": row["mime_type"],
        "isDemo": bool(row["is_demo"]),
    }


def transcript_to_dict(
    row: sqlite3.Row,
    segment_rows: List[sqlite3.Row],
) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "project_id": row["project_id"],
        "asset_id": row["asset_id"],
        "source_checksum": row["source_checksum"],
        "provider": row["provider"],
        "model": row["model"],
        "text": row["text"],
        "duration": row["duration"],
        "created_at": row["created_at"],
        "segments": [
            {
                "start": segment["start_time"],
                "end": segment["end_time"],
                "text": segment["text"],
                "confidence": segment["confidence"],
            }
            for segment in segment_rows
        ],
    }


def clip_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "projectId": row["project_id"],
        "assetId": row["asset_id"],
        "title": row["title"],
        "startTime": row["start_time"],
        "endTime": row["end_time"],
        "duration": row["duration"],
        "aspectRatio": row["aspect_ratio"],
        "potentialScore": row["potential_score"],
        "ratingLabel": row["rating_label"],
        "suggestedHook": row["suggested_hook"],
        "hooks": json.loads(row["hooks"] or "[]"),
        "selectedHookIndex": row["selected_hook_index"],
        "caption": row["caption"],
        "hashtags": json.loads(row["hashtags"] or "[]"),
        "subtitles": json.loads(row["subtitles"] or "[]"),
        "status": row["status"],
        "scheduledDate": row["scheduled_date"],
        "platform": row["platform"],
        "exportedUrl": row["exported_url"],
    }


init_db()
