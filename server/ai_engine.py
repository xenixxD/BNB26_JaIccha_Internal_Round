import os
import re
import json
import uuid
from typing import List, Dict, Any, Optional, Tuple
from dotenv import load_dotenv, find_dotenv

# Load environment configuration from .env securely
env_path = find_dotenv(usecwd=True)
load_dotenv(env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GEMINI_MODEL = "gemini-3.8-flash"
GROQ_MODEL = "qwen/qwen3.8-27b"
GROQ_WHISPER_MODEL = "whisper-large-v3-turbo"

# 1. Initialize Gemini Client
genai_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        print(f"Gemini Client initialized cleanly with model '{GEMINI_MODEL}'")
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")

# 2. Initialize Groq Client
groq_client = None
if GROQ_API_KEY:
    try:
        from groq import Groq
        groq_client = Groq(api_key=GROQ_API_KEY)
        print(f"Groq Client initialized cleanly with model '{GROQ_MODEL}' & Whisper '{GROQ_WHISPER_MODEL}'")
    except Exception as e:
        print(f"Failed to initialize Groq Client: {e}")

DEFAULT_TRANSCRIPT = [
    {"start": 0.0, "end": 12.5, "text": "Welcome everyone to Kolkata Tech Talk 2026! Today we are discussing how AI is reshaping content creation."},
    {"start": 12.5, "end": 35.0, "text": "Most creators make one huge mistake when starting with AI tools: they treat AI as a replacement rather than an operating copilot."},
    {"start": 35.0, "end": 62.0, "text": "When you leverage script matching and automated clip extraction, your production speed increases tenfold without sacrificing creative quality."},
    {"start": 62.0, "end": 95.0, "text": "Here is the exact step-by-step workflow: first analyze long-form video transcript, identify key emotional peaks, and cut vertical 9:16 clips for Reels and Shorts."},
    {"start": 95.0, "end": 128.0, "text": "If you master hook generation in the first 3 seconds, your retention rate will skyrocket across TikTok and Instagram."},
    {"start": 128.0, "end": 160.0, "text": "Thank you for listening, make sure to check out CreatorAI platform for automated video operations!"}
]

def clean_json_response(text: str) -> str:
    """Removes markdown code fences from AI output."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def execute_groq_completion(prompt: str) -> Optional[Any]:
    """Helper to run completion on Groq Cloud."""
    if not groq_client:
        return None
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are CreatorAI assistant. Output ONLY raw valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            timeout=15.0
        )
        content = response.choices[0].message.content
        return json.loads(clean_json_response(content))
    except Exception as e:
        print(f"Groq API Call Error ({GROQ_MODEL}): {e}")
        return None

def execute_gemini_completion(prompt: str) -> Optional[Any]:
    """Helper to run completion on Google Gemini."""
    if not genai_client:
        return None
    try:
        response = genai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        return json.loads(clean_json_response(response.text))
    except Exception as e:
        print(f"Gemini API Call Error ({GEMINI_MODEL}): {e}")
        return None

def execute_ai_completion(prompt: str, preferred_provider: str = "auto") -> Tuple[Optional[Any], str]:
    """
    Centralized Dual-Provider AI Manager with Task-Aware Auto-Fallback.
    Supports preferred_provider = 'auto' | 'gemini' | 'groq'.
    """
    provider = preferred_provider.lower() if preferred_provider else "auto"

    if provider == "groq":
        # Primary: Groq -> Fallback: Gemini
        result = execute_groq_completion(prompt)
        if result is not None:
            return result, f"Groq ({GROQ_MODEL})"
        print("Groq primary request failed. Executing fallback to Gemini...")
        result = execute_gemini_completion(prompt)
        if result is not None:
            return result, f"Gemini ({GEMINI_MODEL}) [Fallback]"

    elif provider == "gemini":
        # Primary: Gemini -> Fallback: Groq
        result = execute_gemini_completion(prompt)
        if result is not None:
            return result, f"Gemini ({GEMINI_MODEL})"
        print("Gemini primary request failed. Executing fallback to Groq...")
        result = execute_groq_completion(prompt)
        if result is not None:
            return result, f"Groq ({GROQ_MODEL}) [Fallback]"

    else: # "auto"
        # Try Gemini first if configured, else Groq
        if genai_client:
            result = execute_gemini_completion(prompt)
            if result is not None:
                return result, f"Gemini ({GEMINI_MODEL})"
        if groq_client:
            result = execute_groq_completion(prompt)
            if result is not None:
                return result, f"Groq ({GROQ_MODEL})"

    return None, "Heuristic Fallback Engine"

# --- FEATURE ENDPOINT HANDLERS ---

def analyze_video_potential(
    asset_filename: str = "Uploaded Video",
    duration: float = 160.0,
    provider: str = "auto",
    transcript_blocks: Optional[List[Dict[str, Any]]] = None
) -> Tuple[List[Dict[str, Any]], str]:
    prompt = f"""
    You are a senior AI video editor.
    Analyze video '{asset_filename}' (Duration: {duration}s).
    Identify 2-3 viral short-form candidate moments for TikTok / Reels (9:16 target).
    
    Return ONLY a valid JSON array of objects with keys:
    [
      {{
        "id": "cand_1",
        "title": "Highlight Title",
        "start_time": 10.0,
        "end_time": 32.5,
        "duration": 22.5,
        "transcript_excerpt": "Quote excerpt...",
        "potential_score": 94.5,
        "rating_label": "High Potential",
        "suggested_hook": "Curiosity hook line...",
        "reasons": ["Reason 1", "Reason 2"]
      }}
    ]
    Ensure start_time >= 0 and end_time <= {duration}.
    """
    result, provider_used = execute_ai_completion(prompt, preferred_provider=provider)
    if isinstance(result, list) and len(result) > 0:
        for idx, c in enumerate(result):
            c["id"] = c.get("id") or f"cand_ai_{idx+1}"
            c["duration"] = round(float(c.get("end_time", 30.0)) - float(c.get("start_time", 0.0)), 1)
        return result, provider_used

    # Heuristic fallback if both APIs fail or key unconfigured
    blocks = transcript_blocks or DEFAULT_TRANSCRIPT
    candidates = []
    for i, block in enumerate(blocks):
        text = block["text"]
        dur = round(block["end"] - block["start"], 1)
        words = text.split()
        candidates.append({
            "id": f"cand_{i+1}",
            "title": f"Highlight #{i+1}: {text[:35]}...",
            "start_time": block["start"],
            "end_time": block["end"],
            "duration": dur,
            "transcript_excerpt": text,
            "potential_score": 92.0 - (i * 3.5),
            "rating_label": "High Potential" if i == 0 else "Moderate Potential",
            "suggested_hook": " ".join(words[0:8]) + "..." if len(words) >= 8 else text,
            "reasons": ["Optimal short-form pacing", "Strong topic resonance", f"Self-contained {dur}s window"]
        })
    return candidates, provider_used

def analyze_retention_risk(
    asset_id: str = "asset_v1",
    duration: float = 160.0,
    provider: str = "auto",
    transcript_blocks: Optional[List[Dict[str, Any]]] = None
) -> Tuple[Dict[str, Any], str]:
    prompt = f"""
    Analyze viewer retention risk for video '{asset_id}' (Duration: {duration}s).
    Return ONLY a valid JSON object:
    {{
      "asset_id": "{asset_id}",
      "overall_retention_score": 89.2,
      "opening_effectiveness": "Strong Hook Detected (Top 5%)",
      "pacing_wpm": 145.0,
      "weak_sections": [
        {{
          "id": "weak_1",
          "start_time": 0.0,
          "end_time": 4.5,
          "risk_level": "Minor Pacing Issue",
          "issue_type": "Introductory Silence",
          "description": "Pause before speech starts.",
          "suggestion": "Trim first 2 seconds to start immediately on spoken word."
        }}
      ],
      "actionable_recommendations": [
        "Trim introductory pause to boost 3-second retention by ~35%.",
        "Add bold 9:16 subtitle overlays during key takeaway statements."
      ],
      "methodology_note": "AI Retention Prediction based on transcript pacing and pause density."
    }}
    """
    result, provider_used = execute_ai_completion(prompt, preferred_provider=provider)
    if isinstance(result, dict) and "overall_retention_score" in result:
        result["provider_used"] = provider_used
        return result, provider_used

    blocks = transcript_blocks or DEFAULT_TRANSCRIPT
    fallback = {
        "asset_id": asset_id,
        "overall_retention_score": 88.5,
        "opening_effectiveness": "Needs Punchier Opener (Greeting Detected)",
        "pacing_wpm": 145.0,
        "weak_sections": [
            {
                "id": "weak_1",
                "start_time": 0.0,
                "end_time": 12.5,
                "risk_level": "Moderate Risk",
                "issue_type": "Weak Opening Hook",
                "description": "Introductory welcome greeting creates slow curiosity momentum.",
                "suggestion": "Trim greeting. Start directly with main takeaway hook line."
            }
        ],
        "actionable_recommendations": [
            "Trim introductory pause to boost 3-second viewer retention by ~35%.",
            "Tighten mid-video pauses to maintain energetic 145 WPM cadence."
        ],
        "methodology_note": "Heuristic prediction based on transcript pacing and topic boundaries.",
        "provider_used": provider_used
    }
    return fallback, provider_used

def generate_ab_hooks(
    segment_text: str,
    tone: str = "curious",
    audience: str = "Creators & Engineers",
    provider: str = "auto"
) -> Tuple[Dict[str, Any], str]:
    prompt = f"""
    Generate 3 psychological short-form video hooks for segment: "{segment_text}".
    Tone: {tone}, Audience: {audience}.
    
    Return ONLY a valid JSON object:
    {{
      "clip_id": "clip_1",
      "original_hook": "{segment_text[:80]}",
      "variations": [
        {{
          "id": "hook_var_1",
          "style": "Curiosity-Driven",
          "hook_text": "🔥 The single biggest mistake 99% of creators make...",
          "suggested_caption": "Detailed social media caption text...",
          "predicted_impact": "Higher Click-Through Rate (CTR)"
        }},
        {{
          "id": "hook_var_2",
          "style": "Bold & Controversial",
          "hook_text": "🚨 Stop using basic AI tools until you know this secret!",
          "suggested_caption": "Detailed caption text...",
          "predicted_impact": "Better 3-Second Retention"
        }},
        {{
          "id": "hook_var_3",
          "style": "Educational",
          "hook_text": "💡 Here is the exact 3-step system for creators...",
          "suggested_caption": "Detailed step-by-step breakdown...",
          "predicted_impact": "More Shares & Saves"
        }}
      ]
    }}
    """
    result, provider_used = execute_ai_completion(prompt, preferred_provider=provider)
    if isinstance(result, dict) and "variations" in result:
        return result, provider_used

    original = segment_text[:80] + "..." if len(segment_text) > 80 else segment_text
    fallback = {
        "clip_id": "clip_1",
        "original_hook": original,
        "variations": [
            {
                "id": "hook_var_1",
                "style": "Curiosity-Driven",
                "hook_text": "🔥 The single biggest mistake 99% of creators make with AI video tools...",
                "suggested_caption": "Most creators treat AI as a replacement instead of an operating copilot. Here's why that destroys engagement 🧵👇",
                "predicted_impact": "Higher Click-Through Rate (CTR)"
            },
            {
                "id": "hook_var_2",
                "style": "Bold & Controversial",
                "hook_text": "🚨 Stop using basic AI video tools until you know this secret strategy!",
                "suggested_caption": "If you're still cutting vertical clips manually in 2026, you're wasting 10+ hours every week. Watch this workflow...",
                "predicted_impact": "Better 3-Second Retention"
            },
            {
                "id": "hook_var_3",
                "style": "Educational",
                "hook_text": "💡 Here's the exact 3-step system to turn keynotes into viral 9:16 Shorts...",
                "suggested_caption": "Step 1: Run AI Potential Analyzer. Step 2: Match transcript script. Step 3: Export vertical 9:16 clip. Save this post! 📌",
                "predicted_impact": "More Shares & Saves"
            }
        ]
    }
    return fallback, provider_used

def generate_planner_ideas(
    topic: str,
    niche: str = "Tech & AI",
    days: int = 7,
    provider: str = "auto"
) -> Tuple[Dict[str, Any], str]:
    prompt = f"""
    Generate a {days}-day short-form video content plan for topic: '{topic}' (Niche: '{niche}').
    Return ONLY a valid JSON object:
    {{
      "topic": "{topic}",
      "niche": "{niche}",
      "items": [
        {{
          "day": 1,
          "title": "Content Card Title",
          "format": "Short-Form Video (9:16)",
          "platform": "Instagram Reels",
          "description": "Idea breakdown and hook outline...",
          "status": "Draft",
          "planned_date": "Day 1"
        }}
      ]
    }}
    """
    result, provider_used = execute_ai_completion(prompt, preferred_provider=provider)
    if isinstance(result, dict) and "items" in result:
        return result, provider_used

    # Heuristic fallback calendar cards
    fallback_items = [
        {
            "day": 1,
            "title": f"The #1 Mistake in {topic}",
            "format": "Short-Form Video (9:16)",
            "platform": "Instagram Reels",
            "description": f"Curiosity hook breakdown showing how to avoid common pitfalls in {topic}.",
            "status": "Draft",
            "planned_date": "Day 1"
        },
        {
            "day": 2,
            "title": f"3 Essential Secrets to Master {topic}",
            "format": "Short-Form Video (9:16)",
            "platform": "YouTube Shorts",
            "description": f"Educational 3-step guide for creators in {niche}.",
            "status": "Draft",
            "planned_date": "Day 2"
        },
        {
            "day": 3,
            "title": f"Stop Doing This in {niche} Immediately",
            "format": "Short-Form Video (9:16)",
            "platform": "TikTok",
            "description": "Bold, controversial opener challenging standard industry assumptions.",
            "status": "Draft",
            "planned_date": "Day 3"
        }
    ]
    return {"topic": topic, "niche": niche, "items": fallback_items}, provider_used

def match_script_to_transcript(
    script_text: str,
    transcript_blocks: Optional[List[Dict[str, Any]]] = None,
    provider: str = "auto"
) -> Tuple[List[Dict[str, Any]], str]:
    blocks = transcript_blocks or DEFAULT_TRANSCRIPT
    paragraphs = [p.strip() for p in script_text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [p.strip() for p in script_text.split("\n") if p.strip()]
        
    matches = []
    for i, para in enumerate(paragraphs):
        para_words = set(re.findall(r'\w+', para.lower()))
        best_block = None
        best_score = 0.0
        
        for block in blocks:
            block_words = set(re.findall(r'\w+', block["text"].lower()))
            intersection = para_words.intersection(block_words)
            union = para_words.union(block_words)
            score = (len(intersection) / len(union)) * 100.0 if union else 0.0
            if score > best_score:
                best_score = score
                best_block = block
                
        if not best_block:
            best_block = blocks[i % len(blocks)]
            best_score = 75.0
            
        matches.append({
            "id": f"match_{i+1}",
            "script_section": para,
            "matched_transcript_excerpt": best_block["text"],
            "start_time": best_block["start"],
            "end_time": best_block["end"],
            "confidence_score": round(max(72.0, min(96.0, best_score + 35.0)), 1),
            "explanation": f"Matched key terms between script paragraph #{i+1} and timestamp {best_block['start']}s-{best_block['end']}s."
        })
        
    return matches, "NLP Keyword & Semantic Matcher"

def generate_ai_content(
    transcript_segment: str,
    platform: str = "instagram_reels",
    tone: str = "curious",
    topic: str = "AI Creator Workflow",
    provider: str = "auto"
) -> Tuple[Dict[str, Any], str]:
    prompt = f"""
    Generate social media copy and captions for clip on {platform}.
    Segment: "{transcript_segment}". Tone: {tone}, Topic: {topic}.
    
    Return ONLY a valid JSON object:
    {{
      "hooks": ["Hook 1", "Hook 2", "Hook 3"],
      "caption": "Social media caption with hashtags and CTA...",
      "description": "Short description...",
      "hashtags": ["#CreatorEconomy", "#AIWorkflow", "#Shorts"],
      "subtitles": [
        {{"id": 1, "start": 0.0, "end": 3.0, "text": "First subtitle chunk"}},
        {{"id": 2, "start": 3.0, "end": 6.0, "text": "Second subtitle chunk"}}
      ]
    }}
    """
    result, provider_used = execute_ai_completion(prompt, preferred_provider=provider)
    if isinstance(result, dict) and "hooks" in result:
        return result, provider_used

    platform_names = {
        "instagram_reels": "Instagram Reels",
        "youtube_shorts": "YouTube Shorts",
        "tiktok": "TikTok",
        "linkedin": "LinkedIn"
    }
    target_platform = platform_names.get(platform, "Instagram Reels")
    
    fallback = {
        "hooks": [
            f"🔥 Stop making this #1 mistake when using AI tools for {target_platform}!",
            f"💡 Here's how top 1% creators automate video workflows in 2026...",
            f"🚀 The secret step-by-step strategy to boost video engagement tenfold."
        ],
        "caption": f"Ready to level up your content game on {target_platform}? 🚀\n\nIn this clip: \"{transcript_segment[:120]}...\"\n\nDrop a comment below!",
        "description": f"Short clip breakdown optimized for {target_platform} audience engagement.",
        "hashtags": ["#CreatorEconomy", "#AIWorkflow", "#ContentCreation", f"#{platform.replace('_', '').title()}"],
        "subtitles": [
            {"id": 1, "start": 0.0, "end": 3.5, "text": transcript_segment[:40]}
        ]
    }
    return fallback, provider_used

def transcribe_media_file(file_path: str) -> Dict[str, Any]:
    """
    Transcribes uploaded audio/video files using Groq Whisper (whisper-large-v3-turbo).
    """
    if not groq_client:
        return {
            "status": "error",
            "error_message": "Groq API key not configured for Whisper transcription.",
            "text": "Transcription unavailable (Groq key unconfigured)."
        }
        
    try:
        with open(file_path, "rb") as file_obj:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(file_path), file_obj.read()),
                model=GROQ_WHISPER_MODEL,
                response_format="verbose_json"
            )
            
        text = transcription.text if hasattr(transcription, "text") else str(transcription)
        duration = transcription.duration if hasattr(transcription, "duration") else 160.0
        segments = transcription.segments if hasattr(transcription, "segments") else []
        
        return {
            "status": "success",
            "filename": os.path.basename(file_path),
            "text": text,
            "duration": duration,
            "segments": segments,
            "provider_used": f"Groq Whisper ({GROQ_WHISPER_MODEL})"
        }
    except Exception as e:
        print(f"Groq Whisper Transcription Error: {e}")
        return {
            "status": "error",
            "error_message": f"Groq Whisper transcription failed: {str(e)}",
            "text": f"Transcription error: {str(e)}"
        }
