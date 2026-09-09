"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { api, OperationRecord } from "../lib/api";

export type FormKind = "employer" | "client" | "job" | "medication" | "administration";
export default function OperationDialog({ kind, employerId, clients, record, onClose, onSaved }: {
  kind: FormKind; employerId: string; clients: OperationRecord[]; record?: OperationRecord;
  onClose: () => void; onSaved: (employerId?: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState("given");
  const [requestId] = useState(() => crypto.randomUUID());
  const title = kind === "administration" ? "Record medication outcome" : `${record ? "Update" : "Add"} ${kind === "employer" ? "employer workspace" : kind}`;
  const input = (label: string, name: string, initial = "", type = "text") => <label className="field">{label}<input name={name} type={type} required defaultValue={initial} maxLength={type === "text" ? 1000 : undefined} /></label>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      let payload: Record<string, unknown> = data;
      if (kind === "medication") payload = { ...data, scheduled_at: new Date(String(data.scheduled_at)).toISOString() };
      if (kind === "administration") payload = { ...data, medication_id: record!.id, medication_version: record!.version, dose: outcome === "given" ? record!.dose : "0", unit: record!.unit };
      const result = await api<{ record: { id: string } }>("/api/operations", { method: "POST", body: JSON.stringify({
        request_id: requestId, employer_id: kind === "employer" ? null : employerId,
        action: `${kind}.${record && kind !== "administration" ? "update" : "create"}`,
        ...(record && kind !== "administration" ? { record_id: record.id, expected_version: record.version } : {}), payload,
      }) });
      await onSaved(kind === "employer" ? result.record.id : undefined); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save. Refresh records before retrying."); }
    finally { setBusy(false); }
  }
  const localDate = record?.scheduled_at ? new Date(new Date(record.scheduled_at).getTime() - new Date(record.scheduled_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  return <Dialog.Root open onOpenChange={open => !open && !busy && onClose()}><Dialog.Portal>
    <Dialog.Overlay className="dialog-overlay" />
    <Dialog.Content className="dialog-content" onEscapeKeyDown={e => busy && e.preventDefault()} onPointerDownOutside={e => busy && e.preventDefault()}>
      <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
      <Dialog.Description className="text-sm text-muted mt-2">Changes are validated and saved with an audit record.</Dialog.Description></div>
      <Dialog.Close className="icon-button" aria-label="Close dialog" disabled={busy}><X size={18} /></Dialog.Close></div>
      <form onSubmit={submit} className="space-y-4 mt-6">
        {(kind === "employer" || kind === "client") && input("Name", "name")}
        {kind === "client" && input("Client reference", "reference")}
        {(kind === "job" || kind === "medication") && <label className="field">Client<select name="client_id" required defaultValue={record?.client_id || ""}><option value="" disabled>Select client</option>{clients.filter(c => !record || c.id === record.client_id).map(c => <option key={c.id} value={c.id}>{c.name} · {c.reference}</option>)}</select></label>}
        {kind === "job" && <>{input("Service title", "title", record?.title)}{input("Assigned worker", "assignee", record?.assignee)}<label className="field">Status<select name="status" defaultValue={record?.status || "scheduled"}>{(record ? ["scheduled", "active", "completed", "cancelled"] : ["scheduled"]).map(s => <option key={s}>{s}</option>)}</select></label></>}
        {kind === "medication" && <>
          <p className="notice">Record one scheduled dose from an existing prescription. This platform does not determine or recommend dosages.</p>
          {input("Medication name", "name", record?.name)}
          <div className="grid grid-cols-2 gap-4">{input("Prescribed dose", "dose", record?.dose)}<label className="field">Unit<select name="unit" defaultValue={record?.unit || "mg"}>{["mg", "mcg", "g", "mL", "tablet", "capsule", "unit"].map(u => <option key={u}>{u}</option>)}</select></label></div>
          {input("Route", "route", record?.route)}{input("Prescriber", "prescribed_by", record?.prescribed_by)}
          {input("Scheduled date & time (your timezone)", "scheduled_at", localDate, "datetime-local")}
          {input("Prescription instructions", "instructions", record?.instructions)}
          <label className="field">Status<select name="status" defaultValue={record?.status || "scheduled"}><option>scheduled</option><option>cancelled</option></select></label>
        </>}
        {kind === "administration" && <><div className="notice">{record?.name} · {record?.dose} {record?.unit} · {record?.route}<br />{record?.instructions}</div><label className="field">Outcome<select name="outcome" value={outcome} onChange={e => setOutcome(e.target.value)}><option value="given">Given — exact prescribed dose</option><option value="missed">Missed — no dose given</option><option value="refused">Refused — no dose given</option></select></label>{input("Clinical log note", "note")}</>}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button primary w-full" disabled={busy}>{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Validating & saving…" : "Save record"}</button>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
