import os
import shutil
import subprocess
import uuid
from typing import Dict, Any, Optional

EXPORTS_DIR = os.path.join(os.path.dirname(__file__), "exports")
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")

os.makedirs(EXPORTS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Task storage in memory
TASKS: Dict[str, Dict[str, Any]] = {}

def check_ffmpeg() -> tuple[bool, Optional[str]]:
    """Checks if FFmpeg binary is available on system path or standard locations."""
    path = shutil.which("ffmpeg")
    if path:
        return True, path
    
    # Common Windows fallback paths
    common_paths = [
        r"C:\ffmpeg\bin\ffmpeg.exe",
        r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        r"C:\ProgramData\chocolatey\bin\ffmpeg.exe"
    ]
    for p in common_paths:
        if os.path.exists(p):
            return True, p
            
    return False, None

def get_aspect_ratio_filter(aspect_ratio: str) -> str:
    """Returns FFmpeg video filter graph for target aspect ratio."""
    if aspect_ratio == "9:16":
        # Crop width to (height * 9 / 16) centered
        return "crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=1080:1920"
    elif aspect_ratio == "1:1":
        # Crop to square centered
        return "crop=ih:ih:(iw-ih)/2:0,scale=1080:1080"
    elif aspect_ratio == "16:9":
        # Standard landscape
        return "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(1920-iw)/2:(1080-ih)/2"
    return "scale=1080:1920"

def process_video_trim(
    asset_id: str,
    input_path: str,
    start_time: float,
    end_time: float,
    aspect_ratio: str = "9:16"
) -> Dict[str, Any]:
    task_id = str(uuid.uuid4())
    clip_id = f"clip_{task_id[:8]}"
    
    ffmpeg_ok, ffmpeg_bin = check_ffmpeg()
    
    if not ffmpeg_ok:
        task_data = {
            "task_id": task_id,
            "clip_id": clip_id,
            "status": "failed",
            "progress": 0.0,
            "output_filename": None,
            "output_url": None,
            "file_size_bytes": 0,
            "duration_seconds": round(end_time - start_time, 2),
            "error_message": "FFmpeg binary not detected on host system. Export is disabled (Preview Mode active).",
            "ffmpeg_used": False
        }
        TASKS[task_id] = task_data
        return task_data

    duration = round(end_time - start_time, 2)
    output_filename = f"export_{task_id[:8]}_{aspect_ratio.replace(':', 'x')}.mp4"
    output_path = os.path.join(EXPORTS_DIR, output_filename)
    vf_filter = get_aspect_ratio_filter(aspect_ratio)
    
    # Run FFmpeg command synchronously or backgrounded
    cmd = [
        ffmpeg_bin,
        "-y",
        "-ss", str(start_time),
        "-to", str(end_time),
        "-i", input_path,
        "-vf", vf_filter,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "128k",
        output_path
    ]
    
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=120)
        if result.returncode == 0 and os.path.exists(output_path):
            file_size = os.path.getsize(output_path)
            task_data = {
                "task_id": task_id,
                "clip_id": clip_id,
                "status": "completed",
                "progress": 100.0,
                "output_filename": output_filename,
                "output_url": f"/exports/{output_filename}",
                "file_size_bytes": file_size,
                "duration_seconds": duration,
                "error_message": None,
                "ffmpeg_used": True
            }
        else:
            task_data = {
                "task_id": task_id,
                "clip_id": clip_id,
                "status": "failed",
                "progress": 0.0,
                "output_filename": None,
                "output_url": None,
                "file_size_bytes": 0,
                "duration_seconds": duration,
                "error_message": f"FFmpeg processing failed: {result.stderr[-200:] if result.stderr else 'Unknown error'}",
                "ffmpeg_used": True
            }
    except Exception as e:
        task_data = {
            "task_id": task_id,
            "clip_id": clip_id,
            "status": "failed",
            "progress": 0.0,
            "output_filename": None,
            "output_url": None,
            "file_size_bytes": 0,
            "duration_seconds": duration,
            "error_message": f"Execution exception: {str(e)}",
            "ffmpeg_used": True
        }

    TASKS[task_id] = task_data
    return task_data

def get_task_status(task_id: str) -> Optional[Dict[str, Any]]:
    return TASKS.get(task_id)
