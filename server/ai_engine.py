import os
import re
import uuid
from typing import List, Dict, Any, Optional

from server.ai.clip_candidate import build_candidates
from server.ai.content_understanding import understand_content
from server.ai.semantic_matching import SemanticMatcher

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Default sample transcript data for demo fallback
DEFAULT_TRANSCRIPT = [
    {"start": 0.0, "end": 12.5, "text": "Welcome everyone to Kolkata Tech Talk 2026! Today we are discussing how AI is reshaping content creation."},
    {"start": 12.5, "end": 35.0, "text": "Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot."},
    {"start": 35.0, "end": 62.0, "text": "When you leverage script matching and automated clip extraction, your production speed increases tenfold without sacrificing creative quality."},
    {"start": 62.0, "end": 95.0, "text": "Here is the exact step-by-step workflow: first analyze long-form video transcript, identify key emotional peaks, and cut vertical 9:16 clips for Reels and Shorts."},
    {"start": 95.0, "end": 128.0, "text": "If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram."},
    {"start": 128.0, "end": 160.0, "text": "Thank you for listening, make sure to check out CreatorAI platform for automated video operations!"}
]

def analyze_video_potential(transcript_blocks: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    """Use the new transcript-first understanding and candidate models."""
    blocks = transcript_blocks or DEFAULT_TRANSCRIPT
    candidates = []

    for i, block in enumerate(blocks):
        text = block["text"]
        start_time = block["start"]
        end_time = block["end"]
        duration = round(end_time - start_time, 1)
        understanding = understand_content(text, context={"source": "backend_compat"})
        words = text.split()
        word_count = len(words)
        wpm = round((word_count / duration) * 60) if duration > 0 else 0
        hook_score = 60.0 + (30.0 if any(w in text.lower() for w in ["mistake", "huge", "never", "secret", "how to", "why"]) else 0.0) + (10.0 if "?" in text or "!" in text else 0.0)
        pacing_score = 85.0 if 120 <= wpm <= 180 else 65.0
        total_score = round(min(98.0, max(50.0, (hook_score * 0.5) + (pacing_score * 0.5))), 1)

        reasons = [
            understanding.summary,
            "Strong curiosity hook in opening statement" if hook_score > 75 else "Narrative structure is usable for short-form clips",
            f"Optimal short-form pacing (~{wpm} WPM)" if 120 <= wpm <= 180 else f"Pacing is {wpm} WPM; tune segment length",
            f"Self-contained narrative window ({duration}s)"
        ]
        suggested_hook = words[0:8] if len(words) >= 8 else words
        hook_text = " ".join(suggested_hook) + "..."

        candidates.append({
            "id": f"candidate_{i+1}",
            "title": f"Key Highlight #{i+1}: {text[:35]}...",
            "start_time": start_time,
            "end_time": end_time,
            "duration": duration,
            "transcript_excerpt": text,
            "potential_score": total_score,
            "rating_label": "High Potential" if total_score >= 85 else "Moderate Potential" if total_score >= 70 else "Needs Improvement",
            "suggested_hook": hook_text,
            "reasons": reasons,
        })

    candidates.sort(key=lambda x: x["potential_score"], reverse=True)
    return candidates


def match_script_to_transcript(script_text: str, transcript_blocks: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    """Compatibility wrapper over the new semantic matching layer."""
    blocks = transcript_blocks or DEFAULT_TRANSCRIPT
    paragraphs = [p.strip() for p in script_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in script_text.split("\n") if p.strip()]

    matches = []
    matcher = SemanticMatcher(blocks)

    for i, para in enumerate(paragraphs):
        best = matcher.find_best_match(para)
        matches.append({
            "id": f"match_{i+1}",
            "script_section": para,
            "matched_transcript_excerpt": best["matched_text"],
            "start_time": best["start_time"],
            "end_time": best["end_time"],
            "confidence_score": round(best["confidence"] * 100.0, 1),
            "explanation": f"Matched transcript using the semantic matcher against paragraph #{i+1}.",
        })

    return matches


def generate_ai_content(transcript_segment: str, platform: str = "instagram_reels") -> Dict[str, Any]:
    """Compatibility wrapper over the new content understanding + candidate models."""
    platform_names = {
        "instagram_reels": "Instagram Reels",
        "youtube_shorts": "YouTube Shorts",
        "tiktok": "TikTok",
        "linkedin": "LinkedIn"
    }
    target_platform = platform_names.get(platform, "Instagram Reels")
    understanding = understand_content(transcript_segment, context={"platform": platform})

    hooks = [
        f"🔥 Stop making this #1 mistake when using AI tools for {target_platform}!",
        f"💡 {understanding.summary}",
        f"🚀 The secret step-by-step strategy to boost video engagement tenfold."
    ]

    caption = (
        f"Ready to level up your content game on {target_platform}? 🚀\n\n"
        f"In this clip: \"{transcript_segment[:120]}...\"\n\n"
        f"Drop a comment with 'CREATOR' below to get our complete AI workflow guide!"
    )

    description = f"Short clip breakdown optimized for {target_platform} audience engagement."

    hashtags = [
        "#CreatorEconomy", "#AIWorkflow", "#ContentCreation",
        f"#{platform.replace('_', '').title()}", "#VideoEditing", "#TechTools"
    ]

    words = transcript_segment.split()
    subtitles = []
    chunk_size = 5
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i+chunk_size])
        subtitles.append({
            "id": i // chunk_size + 1,
            "start": round(i * 0.4, 2),
            "end": round((i + chunk_size) * 0.4, 2),
            "text": chunk
        })

    return {
        "hooks": hooks,
        "caption": caption,
        "description": description,
        "hashtags": hashtags,
        "subtitles": subtitles,
    }

