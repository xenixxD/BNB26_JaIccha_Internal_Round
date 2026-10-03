from server.ai import AIConfig, AIProviderAdapter, SemanticMatcher, transcribe_audio, validate_structured_output


def test_ai_config_defaults_are_present():
    config = AIConfig()
    assert config.provider_name == "demo"
    assert config.max_retries >= 1


def test_transcribe_audio_returns_segments():
    segments = transcribe_audio("demo.wav")
    assert segments[0]["text"].startswith("Demo transcription")


def test_semantic_matcher_returns_confidence():
    matcher = SemanticMatcher([{"start": 0.0, "end": 10.0, "text": "hello world"}])
    result = matcher.find_best_match("hello world")
    assert "confidence" in result


def test_structured_output_validator_checks_fields():
    payload = {"hooks": ["a"], "caption": "b"}
    assert validate_structured_output(payload, ["hooks", "caption"]) is True


def test_ai_provider_adapter_handles_demo_generation():
    adapter = AIProviderAdapter()
    response = adapter.generate("hello prompt")
    assert response["mode"] == "demo"
