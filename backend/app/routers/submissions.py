from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.tasks import run_triage

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("", response_model=schemas.IntakeSubmission, status_code=status.HTTP_201_CREATED)
def create_submission(
    payload: schemas.IntakeSubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> models.IntakeSubmission:
    submission = models.IntakeSubmission(**payload.model_dump())
    db.add(submission)
    db.flush()  # assigns submission.id
    # the triage record exists (as pending) from the start, so pollers never see a gap
    triage_record = models.IntakeSubmissionTriageRecord(intake_submission_id=submission.id)
    db.add(triage_record)
    db.commit()
    db.refresh(submission)  # pick up server-generated timestamps
    # only queued once everything is committed; runs after the response is sent
    background_tasks.add_task(run_triage, triage_record.id)
    return submission


@router.get("", response_model=list[schemas.IntakeSubmission])
def list_submissions(db: Session = Depends(get_db)) -> list[models.IntakeSubmission]:
    stmt = select(models.IntakeSubmission).order_by(models.IntakeSubmission.created_at.desc())
    return list(db.scalars(stmt))


@router.get("/{submission_id}", response_model=schemas.IntakeSubmission)
def get_submission(submission_id: UUID, db: Session = Depends(get_db)) -> models.IntakeSubmission:
    submission = db.get(models.IntakeSubmission, submission_id)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return submission


@router.get("/{submission_id}/triage", response_model=list[schemas.IntakeSubmissionTriageRecord])
def list_submission_triage(
    submission_id: UUID, db: Session = Depends(get_db)
) -> list[models.IntakeSubmissionTriageRecord]:
    """All triage records for a submission, newest first"""
    if db.get(models.IntakeSubmission, submission_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    stmt = (
        select(models.IntakeSubmissionTriageRecord)
        .where(models.IntakeSubmissionTriageRecord.intake_submission_id == submission_id)
        .order_by(models.IntakeSubmissionTriageRecord.created_at.desc())
    )
    return list(db.scalars(stmt))
