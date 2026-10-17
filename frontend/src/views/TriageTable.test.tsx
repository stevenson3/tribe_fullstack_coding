import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { TriageRecord } from "../api";
import { mockFetch } from "../testUtils";
import TriageTable from "./TriageTable";

const SUBMISSION_ID = "11111111-1111-1111-1111-111111111111";
const URL = `/api/submissions/${SUBMISSION_ID}/triage`;

const PENDING: TriageRecord = {
  id: "22222222-2222-2222-2222-222222222222",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  intake_submission_id: SUBMISSION_ID,
  status: "pending",
  summary: null,
  tags: null,
  risk_checklist: null,
  error: null,
};
const SUCCESS: TriageRecord = {
  ...PENDING,
  status: "success",
  summary: "A neat summary",
  tags: ["crm", "stub"],
  risk_checklist: "- Timeline risk",
};

it("polls until the record leaves pending, then stops", async () => {
  const fetchMock = mockFetch({
    [URL]: [
      { status: 200, body: [PENDING] },
      { status: 200, body: [SUCCESS] },
    ],
  });
  render(<TriageTable submissionId={SUBMISSION_ID} />);

  expect(await screen.findByText("pending…")).toBeInTheDocument();
  expect(await screen.findByText("A neat summary", {}, { timeout: 3000 })).toBeInTheDocument();
  expect(screen.getByText("success")).toBeInTheDocument();
  expect(screen.getByText("crm")).toBeInTheDocument();
  expect(screen.getByText("stub")).toBeInTheDocument();

  const callsWhenDone = fetchMock.mock.calls.length;
  await new Promise((r) => setTimeout(r, 1300));
  expect(fetchMock.mock.calls.length).toBe(callsWhenDone); // polling stopped
});

it("shows the error for a failed triage", async () => {
  mockFetch({ [URL]: { status: 200, body: [{ ...PENDING, status: "error", error: "TimeoutError: LLM offline" }] } });
  render(<TriageTable submissionId={SUBMISSION_ID} />);
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Triage failed");
  expect(alert).toHaveTextContent("LLM offline");
});

it("shows an empty state", async () => {
  mockFetch({ [URL]: { status: 200, body: [] } });
  render(<TriageTable submissionId={SUBMISSION_ID} />);
  expect(await screen.findByText("No triage records yet")).toBeInTheDocument();
});
