from collections.abc import Iterator
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models, schemas, tasks  # noqa: F401  (models registers tables on Base.metadata)
from app.database import Base, get_db
from app.main import app


class FakeOpenAI:
    """Stands in for openai.OpenAI; `calls` records the kwargs sent to parse()"""

    calls: list[dict[str, Any]] = []

    def __init__(self, **_: Any) -> None:
        self.beta = SimpleNamespace(chat=SimpleNamespace(completions=self))

    def parse(self, **kwargs: Any) -> SimpleNamespace:
        FakeOpenAI.calls.append(kwargs)
        parsed = schemas.TriageResult(
            summary="A fake summary", tags=["fake"], risk_checklist="- fake risk"
        )
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(parsed=parsed, refusal=None))]
        )


@pytest.fixture
def session_factory(monkeypatch: pytest.MonkeyPatch) -> sessionmaker[Session]:
    # in-memory SQLite, fresh for every test
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    # the background task opens its own session, so point it at the test DB too
    monkeypatch.setattr(tasks, "SessionLocal", factory)
    monkeypatch.setattr(tasks, "OpenAI", FakeOpenAI)  # never hit the real API in tests
    FakeOpenAI.calls = []
    return factory


@pytest.fixture
def client(session_factory: sessionmaker[Session]) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
