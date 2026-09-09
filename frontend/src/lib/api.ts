export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem("nexora-token");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    signal: init.signal || AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  });
  if (response.status === 401) {
    sessionStorage.removeItem("nexora-token");
    window.location.assign("/auth");
    throw new Error("Session expired. Please sign in.");
  }
  const data = await response.json();
  if (!response.ok) {
    const detail = data.detail;
    throw new Error(typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((e: { msg: string }) => e.msg).join(". ") : "Request failed. Please retry.");
  }
  return data;
}

export interface OperationRecord {
  id: string; employer_id: string; kind: string; version: number;
  name?: string; reference?: string; client_id?: string; title?: string; assignee?: string;
  status?: string; dose?: string; unit?: string; route?: string; instructions?: string;
  prescribed_by?: string; scheduled_at?: string; medication_id?: string; outcome?: string; note?: string;
}
export interface Agent { id: string; name: string; responsibility: string; tools: string[]; fallback: string; }
export interface Employer { id: string; name: string; }
export interface Dashboard {
  records: OperationRecord[];
  metrics: { active_jobs: number; total_jobs: number; completed_jobs: number; due_doses: number; given_due_doses: number; adherence_percent: number | null; attention_doses: number; definition: string; };
  audit: { status: string; events_checked: number; errors: string[]; };
  events: { sequence: number; action: string; record_id: string; occurred_at: string; actor_id: number; digest: string; }[];
}
