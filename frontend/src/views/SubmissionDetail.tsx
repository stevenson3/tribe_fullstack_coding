import { Link, useParams } from "react-router-dom";
import { ApiError, getSubmission } from "../api";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAsyncData } from "../hooks/useAsyncData";
import { industryLabel } from "../industries";
import TriageTable from "./TriageTable";

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useAsyncData(() => getSubmission(id ?? ""), [id]);

  if (state.status === "loading") return <LoadingState label="Loading submission…" />;
  if (state.status === "error") {
    const notFound = state.error instanceof ApiError && state.error.status === 404;
    return notFound ? (
      <ErrorState title="Submission not found" message="It may have been removed, or the link is wrong." />
    ) : (
      <ErrorState title="Couldn't load submission" message={state.error.message} onRetry={reload} />
    );
  }

  const submission = state.data;
  return (
    <article className="fade-in">
      <p className="mb-4">
        <Link to="/submissions">← Back to list</Link>
      </p>
      <div className="box content">
        <h2 className="title is-4">{submission.title}</h2>
        <p>{submission.description}</p>
        <dl>
          <dt>Industry</dt>
          <dd>{industryLabel(submission.industry)}</dd>
          <dt>Start</dt>
          <dd>{new Date(submission.start_datetime).toLocaleString()}</dd>
          <dt>End</dt>
          <dd>{new Date(submission.end_datetime).toLocaleString()}</dd>
          <dt>Budget range</dt>
          <dd>{submission.budget_range}</dd>
          <dt>Created</dt>
          <dd>{new Date(submission.created_at).toLocaleString()}</dd>
        </dl>
      </div>

      <h3 className="title is-5">Triage</h3>
      <TriageTable submissionId={submission.id} />
    </article>
  );
}
