import logging
from uuid import UUID

from openai import OpenAI

from app import models, schemas
from app.config import settings
from app.database import SessionLocal
from app.enums import TriageStatus

logger = logging.getLogger("app.tasks")


SYSTEM_PROMPT = (
    "You triage newly submitted project intakes for Tribe. For the submission you are given, "
    "write a short summary of the project, a few tags that help filter and search, and a "
    "bullet-point checklist of the risks associated with the initiative."
)


def generate_triage(submission: models.IntakeSubmission) -> schemas.TriageResult:
    """Ask the LLM to triage a submission, returning structured output."""
    client = OpenAI(api_key=settings.openai_api_key, timeout=settings.openai_timeout_seconds)
    completion = client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _describe(submission)},
        ],
        response_format=schemas.TriageResult,
    )
    message = completion.choices[0].message
    if message.parsed is None:
        raise ValueError(f"LLM returned no structured triage result (refusal: {message.refusal})")
    return message.parsed


def _describe(submission: models.IntakeSubmission) -> str:
    return (
        f"Title: {submission.title}\n"
        f"Description: {submission.description}\n"
        f"Industry (NAICS): {submission.industry.name} ({submission.industry.value})\n"
        f"Start: {submission.start_datetime.isoformat()}\n"
        f"End: {submission.end_datetime.isoformat()}\n"
        f"Budget range: {submission.budget_range}"
    )


def run_triage(triage_record_id: UUID) -> None:
    """
    Background task: (re)generate the triage for an existing triage record.

    Keyed on the triage record rather than the submission so it can be reused
    by anything that has a record to (re)run, e.g. creating a submission or
    re-triaging after an edit. Hydrates the submission from the record, calls
    the LLM, and records the outcome on the record.

    Runs after the response is sent, so it opens its own DB session and must
    never raise (nobody is awaiting it).
    """
    logger.info("Triage started for triage record %s", triage_record_id)
    try:
        with SessionLocal() as db:
            record = db.get(models.IntakeSubmissionTriageRecord, triage_record_id)
            if record is None:
                logger.error("Triage aborted: triage record %s not found", triage_record_id)
                return
            submission = db.get(models.IntakeSubmission, record.intake_submission_id)
            if submission is None:
                logger.error(
                    "Triage aborted: submission %s for triage record %s not found",
                    record.intake_submission_id,
                    triage_record_id,
                )
                return

            try:
                result = generate_triage(submission)
            except Exception as exc:
                logger.exception("Triage failed for triage record %s", triage_record_id)
                record.status = TriageStatus.ERROR
                record.error = f"{type(exc).__name__}: {exc}"
            else:
                record.status = TriageStatus.SUCCESS
                record.summary = result.summary
                record.tags = result.tags
                record.risk_checklist = result.risk_checklist
                record.error = None
                logger.info(
                    "Triage succeeded for triage record %s (submission %s)",
                    triage_record_id,
                    submission.id,
                )
            db.commit()
    except Exception:
        # e.g. the DB itself is unavailable; nothing more we can record
        logger.exception("Triage task crashed for triage record %s", triage_record_id)
