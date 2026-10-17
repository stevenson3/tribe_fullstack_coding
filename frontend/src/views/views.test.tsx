import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { IntakeSubmission } from "../api";
import { mockFetch } from "../testUtils";
import SubmissionCreate from "./SubmissionCreate";
import SubmissionDetail from "./SubmissionDetail";
import SubmissionList from "./SubmissionList";

const SUBMISSION: IntakeSubmission = {
  id: "11111111-1111-1111-1111-111111111111",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  title: "New CRM rollout",
  description: "Replace the legacy CRM",
  start_datetime: "2026-01-01T09:00:00Z",
  end_datetime: "2026-03-01T17:00:00Z",
  industry: "54",
  budget_range: "$50k-$100k",
};

describe("SubmissionList", () => {
  it("renders submissions", async () => {
    mockFetch({ "/api/submissions": { status: 200, body: [SUBMISSION] } });
    render(
      <MemoryRouter>
        <SubmissionList />
      </MemoryRouter>,
    );
    expect(await screen.findByText("New CRM rollout")).toBeInTheDocument();
  });

  it("renders the empty state", async () => {
    mockFetch({ "/api/submissions": { status: 200, body: [] } });
    render(
      <MemoryRouter>
        <SubmissionList />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/No submissions yet/)).toBeInTheDocument();
  });

  it("renders an error", async () => {
    mockFetch({ "/api/submissions": { status: 500, body: { detail: "boom" } } });
    render(
      <MemoryRouter>
        <SubmissionList />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("boom");
  });
});

describe("SubmissionDetail", () => {
  function renderDetail() {
    render(
      <MemoryRouter initialEntries={[`/submissions/${SUBMISSION.id}`]}>
        <Routes>
          <Route path="/submissions/:id" element={<SubmissionDetail />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("renders a submission", async () => {
    mockFetch({
      [`/api/submissions/${SUBMISSION.id}`]: { status: 200, body: SUBMISSION },
      [`/api/submissions/${SUBMISSION.id}/triage`]: { status: 200, body: [] },
    });
    renderDetail();
    expect(await screen.findByRole("heading", { name: "New CRM rollout" })).toBeInTheDocument();
  });

  it("renders not found", async () => {
    mockFetch({
      [`/api/submissions/${SUBMISSION.id}`]: { status: 404, body: { detail: "Submission not found" } },
    });
    renderDetail();
    expect(await screen.findByRole("alert")).toHaveTextContent("Submission not found");
  });
});

describe("SubmissionCreate", () => {
  it("posts the form and navigates to the new submission", async () => {
    const fetchMock = mockFetch({ "/api/submissions": { status: 201, body: SUBMISSION } });
    render(
      <MemoryRouter initialEntries={["/submissions/new"]}>
        <Routes>
          <Route path="/submissions/new" element={<SubmissionCreate />} />
          <Route path="/submissions/:id" element={<p>detail page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New CRM rollout" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Replace it" } });
    fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2026-01-01T09:00" } });
    fireEvent.change(screen.getByLabelText("End"), { target: { value: "2026-03-01T17:00" } });
    fireEvent.change(screen.getByLabelText("Budget range"), { target: { value: "$50k-$100k" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(screen.getByText("detail page")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/submissions", expect.objectContaining({ method: "POST" }));
  });
});
