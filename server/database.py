import json
import os
import sqlite3
import uuid
from typing import Any, Dict, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "creatorai.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
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
                category TEXT,
                target_platforms TEXT,
                created_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Active',
                thumbnail TEXT,
                assets_count INTEGER NOT NULL DEFAULT 0,
                clips_count INTEGER NOT NULL DEFAULT 0,
                metadata TEXT DEFAULT '{}'
            )
            """
        )

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
                is_demo INTEGER NOT NULL DEFAULT 0,
                metadata TEXT DEFAULT '{}',
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )
            """
        )

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

        conn.commit()
    finally:
        conn.close()


def seed_default_data() -> None:
    conn = get_connection()
    try:
        project_count = conn.execute("SELECT COUNT(*) AS c FROM projects").fetchone()["c"]
        if project_count > 0:
            return

        sample_projects = [
            {
                "id": "proj_1",
                "name": "Kolkata Tech Talk",
                "description": "Keynote presentation on AI-driven creator tools and automated video workflows.",
                "category": "Technology & AI",
                "target_platforms": ["Instagram Reels", "YouTube Shorts", "TikTok"],
                "created_at": "2026-10-01",
                "status": "Active",
                "thumbnail": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80",
                "assets_count": 3,
                "clips_count": 2,
            },
            {
                "id": "proj_2",
                "name": "SaaS Launch Roadmap",
                "description": "Breakdown of product strategy, pricing models, and acquisition channels.",
                "category": "Product & Startup",
                "target_platforms": ["LinkedIn", "YouTube Shorts"],
                "created_at": "2026-09-28",
                "status": "Active",
                "thumbnail": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
                "assets_count": 2,
                "clips_count": 2,
            },
        ]

        for project in sample_projects:
            conn.execute(
                """
                INSERT INTO projects (
                    id, name, description, category, target_platforms, created_at, status, thumbnail,
                    assets_count, clips_count, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    project["id"],
                    project["name"],
                    project["description"],
                    project["category"],
                    json.dumps(project["target_platforms"]),
                    project["created_at"],
                    project["status"],
                    project["thumbnail"],
                    project["assets_count"],
                    project["clips_count"],
                    json.dumps({}),
                ),
            )

        conn.execute(
            """
            INSERT INTO assets (
                id, project_id, filename, file_type, file_size, url, upload_date, duration, status, content, is_demo, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "asset_v1",
                "proj_1",
                "Kolkata_Tech_Talk_Full_Keynote.mp4",
                "video",
                48500000,
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "2026-10-01",
                160.0,
                "ready",
                None,
                0,
                json.dumps({}),
            ),
        )

        conn.execute(
            """
            INSERT INTO assets (
                id, project_id, filename, file_type, file_size, url, upload_date, duration, status, content, is_demo, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "asset_s1",
                "proj_1",
                "Keynote_Presentation_Script.txt",
                "script",
                4200,
                "#",
                "2026-10-01",
                None,
                "ready",
                "Welcome everyone to Kolkata Tech Talk 2026! Today we are discussing how AI is reshaping content creation.\n\nMost creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot.",
                0,
                json.dumps({}),
            ),
        )

        conn.execute(
            """
            INSERT INTO assets (
                id, project_id, filename, file_type, file_size, url, upload_date, duration, status, content, is_demo, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "asset_a1",
                "proj_1",
                "Background_Lofi_Beat.mp3",
                "audio",
                3200000,
                "#",
                "2026-10-02",
                None,
                "ready",
                None,
                0,
                json.dumps({}),
            ),
        )

        conn.execute(
            """
            INSERT INTO clips (
                id, project_id, asset_id, title, start_time, end_time, duration, aspect_ratio, potential_score,
                rating_label, suggested_hook, hooks, selected_hook_index, caption, hashtags, subtitles, status,
                scheduled_date, platform, exported_url, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "clip_1",
                "proj_1",
                "asset_v1",
                "The #1 AI Creator Mistake",
                12.5,
                35.0,
                22.5,
                "9:16",
                94.5,
                "High Potential",
                "Most creators make one huge mistake when starting with AI...",
                json.dumps([
                    "🔥 Stop making this #1 mistake when using AI tools for Instagram Reels!",
                    "💡 Here's how top 1% creators automate video workflows in 2026...",
                    "🚀 The secret step-by-step strategy to boost video engagement tenfold."
                ]),
                0,
                "Ready to level up your content game on Instagram Reels? 🚀\n\nIn this clip: Most creators treat AI as a replacement instead of a copilot...\n\nComment 'CREATOR' for full access!",
                json.dumps(["#CreatorEconomy", "#AIWorkflow", "#ReelsViral", "#TechTools"]),
                json.dumps([{"id": 1, "start": 0.0, "end": 3.5, "text": "Most creators make one huge mistake"}]),
                "Ready for Review",
                "2026-10-05T14:00:00",
                "Instagram Reels",
                None,
                json.dumps({}),
            ),
        )

        conn.execute(
            """
            INSERT INTO clips (
                id, project_id, asset_id, title, start_time, end_time, duration, aspect_ratio, potential_score,
                rating_label, suggested_hook, hooks, selected_hook_index, caption, hashtags, subtitles, status,
                scheduled_date, platform, exported_url, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "clip_2",
                "proj_1",
                "asset_v1",
                "3-Second Hook Retention Secret",
                95.0,
                128.0,
                33.0,
                "9:16",
                89.2,
                "High Potential",
                "If you master hook generation in the first 3 seconds...",
                json.dumps([
                    "⚡ How to skyrocket your TikTok watch time instantly!",
                    "📈 The 3-second rule that changed my video analytics forever.",
                    "🎥 Retention secret that big creators don't want you to know."
                ]),
                0,
                "Retention is everything in 2026! 📈 Master the 3-second hook to keep viewers locked in.",
                json.dumps(["#TikTokTips", "#ContentGrowth", "#VideoHooks", "#Shorts"]),
                json.dumps([{"id": 1, "start": 0.0, "end": 4.0, "text": "If you master hook generation"}]),
                "Scheduled",
                "2026-10-06T18:30:00",
                "TikTok",
                None,
                json.dumps({}),
            ),
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
    created_at = payload.get("createdAt") or payload.get("created_at") or __import__("datetime").datetime.utcnow().strftime("%Y-%m-%d")
    project = {
        "id": project_id,
        "name": payload.get("name") or "New Project",
        "description": payload.get("description") or "",
        "category": payload.get("category") or "General",
        "target_platforms": payload.get("targetPlatforms") or payload.get("target_platforms") or [],
        "created_at": created_at,
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
            INSERT INTO projects (id, name, description, category, target_platforms, created_at, status, thumbnail, assets_count, clips_count, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                project["id"],
                project["name"],
                project["description"],
                project["category"],
                json.dumps(project["target_platforms"]),
                project["created_at"],
                project["status"],
                project["thumbnail"],
                project["assets_count"],
                project["clips_count"],
                json.dumps(project["metadata"]),
            ),
        )
        conn.commit()
        return project
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
    asset = {
        "id": payload.get("id") or f"asset_{uuid.uuid4().hex[:12]}",
        "project_id": payload.get("projectId") or payload.get("project_id") or "proj_1",
        "filename": payload.get("filename") or "uploaded_file",
        "file_type": payload.get("fileType") or payload.get("file_type") or "video",
        "file_size": int(payload.get("fileSize") or payload.get("file_size") or 0),
        "url": payload.get("url") or "#",
        "upload_date": payload.get("uploadDate") or payload.get("upload_date") or __import__("datetime").datetime.utcnow().strftime("%Y-%m-%d"),
        "duration": payload.get("duration"),
        "status": payload.get("status") or "ready",
        "content": payload.get("content"),
        "is_demo": bool(payload.get("isDemo") or payload.get("is_demo") or 0),
        "metadata": payload.get("metadata") or {},
    }

    conn = get_connection()
    try:
        conn.execute(
            """
            INSERT INTO assets (
                id, project_id, filename, file_type, file_size, url, upload_date, duration, status, content, is_demo, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                1 if asset["is_demo"] else 0,
                json.dumps(asset["metadata"]),
            ),
        )
        conn.execute(
            "UPDATE projects SET assets_count = assets_count + 1 WHERE id = ?",
            (asset["project_id"],),
        )
        conn.commit()
        return asset
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

    clip = {
        "id": payload.get("id") or f"clip_{uuid.uuid4().hex[:12]}",
        "project_id": payload.get("projectId") or payload.get("project_id") or "proj_1",
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
            "UPDATE projects SET clips_count = clips_count + 1 WHERE id = ?",
            (clip["project_id"],),
        )
        conn.commit()
        return clip
    finally:
        conn.close()


def project_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row["description"],
        "category": row["category"],
        "targetPlatforms": json.loads(row["target_platforms"] or "[]"),
        "createdAt": row["created_at"],
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
        "isDemo": bool(row["is_demo"]),
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
seed_default_data()
seed_default_data()
