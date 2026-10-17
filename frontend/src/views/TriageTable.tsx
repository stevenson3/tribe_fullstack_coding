import { useEffect, useState } from "react";
import { listTriageRecords, type TriageRecord, type TriageStatus } from "../api";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { waitForMinimumLoading } from "../hooks/useAsyncData";

const POLL_INTERVAL_MS = 1000;

const STATUS_TAG: Record<TriageStatus, string> = {
  pending: "is-warning",
  success: "is-success",
  error: "is-danger",
};

/**
 * Triage records for a submission, refreshed every second while any of them is
 * still pending. Polling stops once everything has finished (success or error).
 */
export default function TriageTable({ submissionId }: { submissionId: string }) {
  const [records, setRecords] = useState<TriageRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    let firstResponse = true;

    async function poll() {
      let keepPolling = true;
      try {
        const next = await listTriageRecords(submissionId);
        if (firstResponse) await waitForMinimumLoading(startedAt);
        if (cancelled) return;
        setRecords(next);
        setError(null);
        keepPolling = next.some((r) => r.status === "pending");
      } catch (e) {
        if (firstResponse) await waitForMinimumLoading(startedAt);
        if (cancelled) return;
        setError((e as Error).message); // keep the last good data and retry
      }
      firstResponse = false;
      if (keepPolling) timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    setRecords(null);
    setError(null);
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [submissionId, attempt]);

  if (records === null) {
    return error ? (
      <ErrorState
        title="Couldn't load triage"
        message={error}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    ) : (
      <LoadingState label="Loading triage…" />
    );
  }

  if (records.length === 0) {
    return (
      <EmptyState
        compact
        title="No triage records yet"
        message="Triage runs automatically when a submission is created."
      />
    );
  }

  return (
    <>
      {error && <ErrorState compact title="Connection problem" message={`${error} (retrying…)`} />}
      <div className="fade-in table-container">
        <table className="table is-fullwidth" aria-label="Triage records">
          <thead>
            <tr>
              <th>Created</th>
              <th>Status</th>
              <th>Summary</th>
              <th>Tags</th>
              <th>Risks</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>
                  <span key={r.status} className={`fade-in tag ${STATUS_TAG[r.status]}`}>
                    {r.status}
                    {r.status === "pending" && "…"}
                  </span>
                </td>
                {r.status === "pending" && (
                  <td colSpan={3}>
                    <div className="skeleton-lines" role="status" aria-label="Generating triage">
                      <div />
                      <div />
                      <div />
                    </div>
                  </td>
                )}
                {r.status === "error" && (
                  <td colSpan={3}>
                    <ErrorState
                      compact
                      title="Triage failed"
                      message={r.error ?? "The triage task failed for an unknown reason."}
                    />
                  </td>
                )}
                {r.status === "success" && (
                  <>
                    <td className="fade-in">{r.summary}</td>
                    <td className="fade-in">
                      <div className="tags">
                        {r.tags?.map((t) => (
                          <span key={t} className="tag is-info">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="fade-in" style={{ whiteSpace: "pre-wrap" }}>
                      {r.risk_checklist}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
