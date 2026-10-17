import uuid
from datetime import datetime

from sqlalchemy import JSON, Enum, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, UTCDateTime
from app.enums import Naics2dIndustryCode, TriageStatus


class IntakeSubmission(Base):
    """An intake of a new initiative that tribe will be undertaking"""

    __tablename__ = "intake_submissions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, server_default=func.now(), onupdate=func.now()
    )

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    start_datetime: Mapped[datetime] = mapped_column(UTCDateTime)
    end_datetime: Mapped[datetime] = mapped_column(UTCDateTime)
    industry: Mapped[Naics2dIndustryCode] = mapped_column(
        Enum(Naics2dIndustryCode, values_callable=lambda e: [m.value for m in e])
    )
    budget_range: Mapped[str] = mapped_column(String(64))


class IntakeSubmissionTriageRecord(Base):
    """The results of our LLM triage of an individual submission"""

    __tablename__ = "intake_submission_triage_records"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        UTCDateTime, server_default=func.now(), onupdate=func.now()
    )

    # a submission can be triaged many times, so many records per submission
    intake_submission_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("intake_submissions.id"), index=True
    )
    status: Mapped[TriageStatus] = mapped_column(
        Enum(TriageStatus, values_callable=lambda e: [m.value for m in e]),
        default=TriageStatus.PENDING,
    )
    # the LLM-generated fields stay empty until status is success
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    risk_checklist: Mapped[str | None] = mapped_column(Text, nullable=True)
    # set when status is error
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
