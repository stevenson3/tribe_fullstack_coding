import { Link } from "react-router-dom";
import { listSubmissions } from "../api";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { useAsyncData } from "../hooks/useAsyncData";
import { industryLabel } from "../industries";

export default function SubmissionList() {
  const { state, reload } = useAsyncData(listSubmissions, []);

  if (state.status === "loading") return <LoadingState label="Loading submissions…" />;
  if (state.status === "error") {
    return <ErrorState title="Couldn't load submissions" message={state.error.message} onRetry={reload} />;
  }

  const submissions = state.data;
  if (submissions.length === 0) {
    return (
      <EmptyState
        title="No submissions yet"
        message="Create the first intake submission to get started."
        action={
          <Link className="button is-primary" to="/submissions/new">
            Create submission
          </Link>
        }
      />
    );
  }

  return (
    <div className="fade-in table-container">
      <table className="table is-fullwidth is-hoverable">
        <thead>
          <tr>
            <th>Title</th>
            <th>Industry</th>
            <th>Start</th>
            <th>End</th>
            <th>Budget</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id}>
              <td>
                <Link to={`/submissions/${s.id}`}>{s.title}</Link>
              </td>
              <td>{industryLabel(s.industry)}</td>
              <td>{new Date(s.start_datetime).toLocaleDateString()}</td>
              <td>{new Date(s.end_datetime).toLocaleDateString()}</td>
              <td>{s.budget_range}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
