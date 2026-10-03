import logging
import math
import re
import threading
from typing import Any, Dict, List, Optional, Sequence, Tuple, TypedDict

from fastembed import TextEmbedding

MODEL_NAME = "BAAI/bge-small-en-v1.5"
MIN_WINDOW_SECONDS = 15.0
TARGET_WINDOW_SECONDS = 30.0
MAX_WINDOW_SECONDS = 60.0
WINDOW_STRIDE_SECONDS = 10.0
MIN_SEMANTIC_SCORE = 0.55
MAX_CANDIDATES_PER_SECTION = 3

_model: Optional[TextEmbedding] = None
_model_lock = threading.Lock()
_logger = logging.getLogger(__name__)
_STOP_WORDS = {
    "a", "about", "after", "all", "also", "an", "and", "are", "as", "at", "be",
    "because", "been", "before", "but", "by", "can", "do", "for", "from", "had",
    "has", "have", "he", "her", "his", "how", "i", "if", "in", "into", "is", "it",
    "its", "just", "more", "most", "my", "of", "on", "or", "our", "out", "she",
    "so", "than", "that", "the", "their", "them", "then", "there", "these", "they",
    "this", "to", "up", "was", "we", "were", "what", "when", "which", "who", "will",
    "with", "you", "your",
}


class TranscriptSegment(TypedDict):
    start: float
    end: float
    text: str


class TranscriptWindow(TypedDict):
    start_time: float
    end_time: float
    duration: float
    text: str


class MatchCandidate(TypedDict):
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
    visual_score: Optional[float]
    duration_score: float
    final_score: float
    reasons: List[str]
    status: str


class SemanticMatcherUnavailable(RuntimeError):
    """Raised when the local embedding model cannot be initialized or run."""


def _embed(texts: Sequence[str]) -> List[List[float]]:
    global _model
    try:
        with _model_lock:
            if _model is None:
                _model = TextEmbedding(model_name=MODEL_NAME)
            vectors = list(_model.embed(list(texts)))
        normalized_vectors: List[List[float]] = []
        for vector in vectors:
            normalized_vectors.append([float(value) for value in vector])
        if len(normalized_vectors) != len(texts) or any(
            not vector or any(not math.isfinite(value) for value in vector)
            for vector in normalized_vectors
        ):
            raise ValueError("Embedding model returned invalid vectors")
        if len({len(vector) for vector in normalized_vectors}) > 1:
            raise ValueError("Embedding model returned inconsistent vector dimensions")
        return normalized_vectors
    except Exception as exc:
        _logger.exception("Local semantic embedding failed")
        raise SemanticMatcherUnavailable(
            "Local semantic matching is unavailable. Check the embedding model installation and cache."
        ) from exc


def _split_script(script_text: str) -> List[str]:
    sections = [
        section.strip()
        for section in re.split(r"\n\s*\n", script_text)
        if section.strip()
    ]
    if not sections:
        sections = [line.strip() for line in script_text.splitlines() if line.strip()]
    return sections


def _transcript_windows(
    segments: Sequence[Dict[str, Any]],
) -> List[TranscriptWindow]:
    valid_segments: List[TranscriptSegment] = []
    for segment in segments:
        valid_segments.append({
            "start": float(segment["start"]),
            "end": float(segment["end"]),
            "text": str(segment["text"]).strip(),
        })
    valid_segments.sort(key=lambda segment: (segment["start"], segment["end"]))
    valid_segments = [
        segment
        for segment in valid_segments
        if segment["text"] and segment["end"] > segment["start"]
    ]
    windows: List[TranscriptWindow] = []
    start_index = 0
    while start_index < len(valid_segments):
        start_time = valid_segments[start_index]["start"]
        end_index = start_index
        while (
            end_index < len(valid_segments)
            and valid_segments[end_index]["end"] - start_time < TARGET_WINDOW_SECONDS
        ):
            end_index += 1
        if end_index < len(valid_segments):
            end_index += 1
        if end_index == start_index:
            end_index += 1

        window_segments = valid_segments[start_index:end_index]
        end_time = window_segments[-1]["end"]
        duration = end_time - start_time
        if MIN_WINDOW_SECONDS <= duration <= MAX_WINDOW_SECONDS:
            windows.append({
                "start_time": start_time,
                "end_time": end_time,
                "duration": duration,
                "text": " ".join(segment["text"] for segment in window_segments),
            })
        elif len(valid_segments) == 1 and duration < MIN_WINDOW_SECONDS:
            windows.append({
                "start_time": start_time,
                "end_time": end_time,
                "duration": duration,
                "text": window_segments[0]["text"],
            })

        next_start = start_index + 1
        while (
            next_start < len(valid_segments)
            and valid_segments[next_start]["start"] - start_time < WINDOW_STRIDE_SECONDS
        ):
            next_start += 1
        start_index = next_start
    return windows


def _cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    if len(left) != len(right):
        raise ValueError("Embedding vector dimensions do not match")
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return sum(a * b for a, b in zip(left, right)) / (left_norm * right_norm)


def _completeness_score(script_section: str, transcript_text: str) -> float:
    script_terms = {
        term for term in re.findall(r"\w+", script_section.lower())
        if len(term) > 2 and term not in _STOP_WORDS
    }
    if not script_terms:
        return 0.0
    transcript_terms = set(re.findall(r"\w+", transcript_text.lower()))
    return len(script_terms & transcript_terms) / len(script_terms)


def _duration_score(duration: float) -> float:
    if duration <= 0:
        return 0.0
    if MIN_WINDOW_SECONDS <= duration <= TARGET_WINDOW_SECONDS:
        return 1.0
    if duration < MIN_WINDOW_SECONDS:
        return max(0.0, duration / MIN_WINDOW_SECONDS)
    return max(
        0.0,
        (MAX_WINDOW_SECONDS - duration) / (MAX_WINDOW_SECONDS - TARGET_WINDOW_SECONDS),
    )


def _overlap_ratio(
    left_start: float,
    left_end: float,
    right_start: float,
    right_end: float,
) -> float:
    intersection = max(
        0.0,
        min(left_end, right_end) - max(left_start, right_start),
    )
    union = max(left_end, right_end) - min(left_start, right_start)
    return intersection / union if union > 0 else 0.0


def match_script_to_transcript(
    script_text: str,
    transcript_segments: Sequence[Dict[str, Any]],
    project_id: str,
    source_asset_id: str,
    script_version_id: str,
    transcript_id: str,
) -> List[MatchCandidate]:
    sections = _split_script(script_text)
    windows = _transcript_windows(transcript_segments)
    if not sections or not windows:
        return []

    # Prefix the script query with the BGE retrieval instruction; transcript windows
    # remain unprefixed passages so their vectors share the model's retrieval space.
    embedding_inputs = [
        f"Represent this sentence for searching relevant passages: {section}"
        for section in sections
    ] + [window["text"] for window in windows]
    embeddings = _embed(embedding_inputs)
    section_embeddings = embeddings[:len(sections)]
    window_embeddings = embeddings[len(sections):]

    candidates: List[MatchCandidate] = []
    for section_index, (section, section_embedding) in enumerate(
        zip(sections, section_embeddings)
    ):
        ranked: List[Tuple[float, MatchCandidate]] = []
        for window, window_embedding in zip(windows, window_embeddings):
            semantic_score = max(
                0.0,
                min(1.0, _cosine_similarity(section_embedding, window_embedding)),
            )
            if semantic_score < MIN_SEMANTIC_SCORE:
                continue
            completeness_score = _completeness_score(section, window["text"])
            duration_score = _duration_score(window["duration"])
            final_score = (
                0.60 * semantic_score
                + 0.25 * completeness_score
                + 0.15 * duration_score
            )
            ranked.append((final_score, {
                "project_id": project_id,
                "source_asset_id": source_asset_id,
                "script_version_id": script_version_id,
                "transcript_id": transcript_id,
                "script_section_index": section_index,
                "script_section": section,
                "start_time": window["start_time"],
                "end_time": window["end_time"],
                "transcript_text": window["text"],
                "semantic_score": round(semantic_score * 100, 2),
                "completeness_score": round(completeness_score * 100, 2),
                "visual_score": None,
                "duration_score": round(duration_score * 100, 2),
                "final_score": round(final_score * 100, 2),
                "reasons": [
                    f"Semantic similarity: {semantic_score * 100:.1f}/100",
                    f"Script detail coverage: {completeness_score * 100:.1f}/100",
                    f"Clip duration fit: {duration_score * 100:.1f}/100",
                ],
                "status": "suggested",
            }))

        ranked.sort(key=lambda item: item[0], reverse=True)
        selected: List[MatchCandidate] = []
        for _, candidate in ranked:
            if any(
                _overlap_ratio(
                    candidate["start_time"],
                    candidate["end_time"],
                    existing["start_time"],
                    existing["end_time"],
                ) >= 0.65
                for existing in selected
            ):
                continue
            selected.append(candidate)
            if len(selected) == MAX_CANDIDATES_PER_SECTION:
                break
        candidates.extend(selected)

    candidates.sort(key=lambda candidate: candidate["final_score"], reverse=True)
    return candidates
