import logging
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app import models, schemas, tasks
from app.config import Settings, settings
from app.routers import submissions
from tests.conftest import FakeOpenAI

VALID = {
    "title": "New CRM rollout",
    "description": "Replace the legacy CRM",
    "start_datetime": "2026-01-01T09:00:00Z",
    "end_datetime": "2026-03-01T17:00:00Z",
    "industry": "54",
    "budget_range": "$50k-$100k",
}


def test_create_submission(client: TestClient) -> None:
    res = client.post("/submissions", json=VALID)
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == VALID["title"]
    assert body["industry"] == "54"
    assert body["id"] and body["created_at"] and body["updated_at"]


def test_create_rejects_end_before_start(client: TestClient) -> None:
    payload = {**VALID, "start_datetime": VALID["end_datetime"], "end_datetime": VALID["start_datetime"]}
    assert client.post("/submissions", json=payload).status_code == 422


def test_create_rejects_unknown_industry(client: TestClient) -> None:
    assert client.post("/submissions", json={**VALID, "industry": "99"}).status_code == 422


def test_create_rejects_missing_field(client: TestClient) -> None:
    payload = {k: v for k, v in VALID.items() if k != "title"}
    assert client.post("/submissions", json=payload).status_code == 422


def test_list_submissions(client: TestClient) -> None:
    assert client.get("/submissions").json() == []
    client.post("/submissions", json=VALID)
    res = client.get("/submissions")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_submission(client: TestClient) -> None:
    created = client.post("/submissions", json=VALID).json()
    res = client.get(f"/submissions/{created['id']}")
    assert res.status_code == 200
    assert res.json() == created


def test_get_submission_not_found(client: TestClient) -> None:
    assert client.get(f"/submissions/{uuid4()}").status_code == 404


def test_get_submission_bad_id(client: TestClient) -> None:
    assert client.get("/submissions/not-a-uuid").status_code == 422


def test_create_triggers_triage_record(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    caplog.set_level(logging.INFO, logger="app.tasks")
    created = client.post("/submissions", json=VALID).json()  # background task runs before this returns

    res = client.get(f"/submissions/{created['id']}/triage")
    assert res.status_code == 200
    assert len(res.json()) == 1
    body = res.json()[0]
    assert body["intake_submission_id"] == created["id"]
    assert body["status"] == "success"
    assert body["summary"] == "A fake summary"
    assert body["tags"] == ["fake"]
    assert body["error"] is None
    assert f"Triage succeeded for triage record {body['id']}" in caplog.text


def test_triage_is_pending_before_task_runs(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(submissions, "run_triage", lambda _: None)
    created = client.post("/submissions", json=VALID).json()

    res = client.get(f"/submissions/{created['id']}/triage")
    assert res.status_code == 200
    assert res.json()[0]["status"] == "pending"
    assert res.json()[0]["summary"] is None


def test_triage_error_is_recorded_when_llm_fails(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def boom(_: models.IntakeSubmission) -> None:
        raise TimeoutError("LLM offline")

    monkeypatch.setattr(tasks, "generate_triage", boom)
    created = client.post("/submissions", json=VALID).json()

    assert created["id"]  # the submission itself is still created
    body = client.get(f"/submissions/{created['id']}/triage").json()[0]
    assert body["status"] == "error"
    assert "LLM offline" in body["error"]
    assert body["summary"] is None


def test_get_triage_not_found(client: TestClient) -> None:
    assert client.get(f"/submissions/{uuid4()}/triage").status_code == 404


def test_invalid_create_does_not_create_triage(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    client.post("/submissions", json={**VALID, "industry": "99"})
    with session_factory() as db:
        assert db.scalars(select(models.IntakeSubmissionTriageRecord)).all() == []


def test_run_triage_is_reusable_for_an_existing_record(
    client: TestClient, session_factory: sessionmaker[Session], monkeypatch: pytest.MonkeyPatch
) -> None:
    """run_triage only needs a triage record id, so it can re-run on its own"""
    monkeypatch.setattr(submissions, "run_triage", lambda _: None)
    created = client.post("/submissions", json=VALID).json()
    triage = client.get(f"/submissions/{created['id']}/triage").json()[0]
    assert triage["status"] == "pending"

    tasks.run_triage(UUID(triage["id"]))

    assert client.get(f"/submissions/{created['id']}/triage").json()[0]["status"] == "success"


def test_run_triage_unknown_record_does_not_raise(session_factory: sessionmaker[Session]) -> None:
    tasks.run_triage(uuid4())


def test_submission_can_have_multiple_triage_records(
    client: TestClient, session_factory: sessionmaker[Session]
) -> None:
    created = client.post("/submissions", json=VALID).json()
    with session_factory() as db:
        db.add(models.IntakeSubmissionTriageRecord(intake_submission_id=UUID(created["id"])))
        db.commit()

    res = client.get(f"/submissions/{created['id']}/triage")
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_generate_triage_uses_configured_model(client: TestClient) -> None:
    client.post("/submissions", json=VALID)

    (call,) = FakeOpenAI.calls
    assert call["model"] == settings.openai_model
    assert call["response_format"] is schemas.TriageResult
    assert "New CRM rollout" in call["messages"][1]["content"]


def test_model_comes_from_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_MODEL", "some-other-model")
    assert Settings().openai_model == "some-other-model"
