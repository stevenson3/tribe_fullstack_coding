import type { IndustryCode } from "./industries";

const BASE = "/api";

export interface IntakeSubmissionCreate {
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  industry: IndustryCode;
  budget_range: string;
}

export interface IntakeSubmission extends IntakeSubmissionCreate {
  id: string;
  created_at: string;
  updated_at: string;
}

export type TriageStatus = "pending" | "success" | "error";

export interface TriageRecord {
  id: string;
  created_at: string;
  updated_at: string;
  intake_submission_id: string;
  status: TriageStatus;
  summary: string | null;
  tags: string[] | null;
  risk_checklist: string | null;
  error: string | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((d: { msg: string }) => d.msg).join("; ");
    }
  } catch {
    // fall through to the generic message
  }
  return `Request failed (${res.status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.json() as Promise<T>;
}

export function listSubmissions(): Promise<IntakeSubmission[]> {
  return request("/submissions");
}

export function getSubmission(id: string): Promise<IntakeSubmission> {
  return request(`/submissions/${id}`);
}

export function createSubmission(payload: IntakeSubmissionCreate): Promise<IntakeSubmission> {
  return request("/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function listTriageRecords(submissionId: string): Promise<TriageRecord[]> {
  return request(`/submissions/${submissionId}/triage`);
}
