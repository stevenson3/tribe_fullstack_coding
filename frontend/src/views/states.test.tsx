import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ui } from "../config";
import { mockFetch } from "../testUtils";
import SubmissionCreate from "./SubmissionCreate";
import SubmissionList from "./SubmissionList";

afterEach(() => {
  ui.minLoadingMs = 0;
});

it("holds the loading state for the minimum time even when the API is instant", async () => {
  ui.minLoadingMs = 800;
  mockFetch({ "/api/submissions": { status: 200, body: [] } });
  render(
    <MemoryRouter>
      <SubmissionList />
    </MemoryRouter>,
  );

  // getByText rather than getByRole: role queries are slow in jsdom and would eat into the timing
  expect(screen.getByText("Loading submissions…")).toBeInTheDocument();
  await new Promise((r) => setTimeout(r, 100));
  expect(screen.getByText("Loading submissions…")).toBeInTheDocument(); // data is back, but still loading
  expect(await screen.findByText("No submissions yet")).toBeInTheDocument();
  expect(screen.queryByText("Loading submissions…")).not.toBeInTheDocument();
});

it("offers a retry when loading fails", async () => {
  const fetchMock = mockFetch({
    "/api/submissions": [
      { status: 500, body: { detail: "db down" } },
      { status: 200, body: [] },
    ],
  });
  render(
    <MemoryRouter>
      <SubmissionList />
    </MemoryRouter>,
  );

  expect(await screen.findByRole("alert")).toHaveTextContent("db down");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No submissions yet")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("shows an error when saving a submission fails, keeping the form", async () => {
  mockFetch({
    "/api/submissions": { status: 422, body: { detail: [{ msg: "end_datetime must be after start_datetime" }] } },
  });
  render(
    <MemoryRouter>
      <SubmissionCreate />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "x" } });
  fireEvent.change(screen.getByLabelText("Description"), { target: { value: "x" } });
  fireEvent.change(screen.getByLabelText("Start"), { target: { value: "2026-03-01T09:00" } });
  fireEvent.change(screen.getByLabelText("End"), { target: { value: "2026-01-01T09:00" } });
  fireEvent.change(screen.getByLabelText("Budget range"), { target: { value: "1k" } });
  fireEvent.click(screen.getByRole("button", { name: "Create" }));

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Couldn't save your submission");
  expect(alert).toHaveTextContent("end_datetime must be after start_datetime");
  expect(screen.getByLabelText("Title")).toHaveValue("x");
});
