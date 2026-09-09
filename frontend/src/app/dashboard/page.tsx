"use client";
import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowUpRight, Bell, Building2, CheckCircle2, ChevronLeft, ClipboardList, Clock, LayoutDashboard, LogOut, Menu, Moon, Pill, Plus, RefreshCw, Search, ShieldCheck, Sparkles, Sun, Users, X } from "lucide-react";
import { api, Agent, Dashboard, Employer, OperationRecord } from "../../lib/api";
import OperationDialog, { FormKind } from "../../components/OperationDialog";
import MotionSurface from "../../components/MotionSurface";

const tabs = [
  ["Overview", LayoutDashboard], ["Services", ClipboardList], ["Medications", Pill],
  ["Clients", Users], ["Agents", Sparkles], ["Audit trail", ShieldCheck], ["Insights", Activity],
] as const;
function Badge({ value }: { value: string }) { return <span className={`badge ${["given", "passed", "completed"].includes(value) ? "good" : ["missed", "refused", "failed", "overdue"].includes(value) ? "warn" : ""}`}>{value.replaceAll("_", " ")}</span>; }
export default function DashboardPage() {
  const [tab, setTab] = useState("Overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState("");
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [employerId, setEmployerId] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ kind: FormKind; record?: OperationRecord } | null>(null);
  const [updated, setUpdated] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const refresh = useCallback(async (id?: string) => {
    setError(""); setLoading(true);
    try {
      const [me, workspaces, topology] = await Promise.all([api<{ name: string }>("/api/me"), api<Employer[]>("/api/employers"), api<Agent[]>("/api/agents")]);
      setUser(me.name); setEmployers(workspaces); setAgents(topology);
      const preferred = id || employerId || sessionStorage.getItem("nexora-workspace");
      const selected = workspaces.find(w => w.id === preferred)?.id || workspaces[0]?.id || "";
      sessionStorage.setItem("nexora-workspace", selected);
      setEmployerId(selected);
      if (selected) setData(await api<Dashboard>(`/api/employers/${selected}/dashboard`));
      else setData(null);
      setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) { setData(null); setError(err instanceof Error ? err.message : "Could not connect to the local API."); }
    finally { setLoading(false); }
  }, [employerId]);
  useEffect(() => {
    if (!sessionStorage.getItem("nexora-token")) { window.location.replace("/auth"); return; }
    const saved = localStorage.getItem("nexora-theme") || "light";
    setTheme(saved); document.documentElement.dataset.theme = saved;
    void refresh();
    // Initial load; subsequent refreshes are explicit to preserve form state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function changeTheme() { const next = theme === "light" ? "dark" : "light"; setTheme(next); document.documentElement.dataset.theme = next; localStorage.setItem("nexora-theme", next); }
  const records = data?.records || [];
  const clients = records.filter(r => r.kind === "client");
  const jobs = records.filter(r => r.kind === "job");
  const medications = records.filter(r => r.kind === "medication");
  const outcome = (id: string) => records.find(r => r.kind === "administration" && r.medication_id === id);
  const clientName = (id?: string) => clients.find(c => c.id === id)?.name || "Client unavailable";
  const metrics = data?.metrics;
  const agentState = (id: string) => {
    if (loading) return "checking";
    if (!data) return "unavailable";
    if (id === "data_integrity_audit") return data.audit.status;
    if (id === "reporting_insights") return "report updated";
    const kinds: Record<string, string[]> = { employer_intake: ["employer", "client"], medication_compliance: ["medication", "administration"], service_execution: ["job"] };
    return data.events.some(event => kinds[id]?.includes(event.action.split(".")[0])) ? "last task completed" : "ready on request";
  };
  const matches = (r: OperationRecord) => [r.name, r.title, r.assignee, clientName(r.client_id)].some(s => s?.toLowerCase().includes(query.toLowerCase()));
  const medStatus = (r: OperationRecord) => outcome(r.id)?.outcome || (r.status === "cancelled" ? "cancelled" : r.scheduled_at && new Date(r.scheduled_at).getTime() < Date.now() ? "overdue" : "scheduled");
  const empty = (message: string) => <div className="empty"><ClipboardList size={28} /><p>{message}</p></div>;
  const serviceTable = (limit?: number) => <div className="table-scroll"><table><thead><tr><th>Service / client</th><th>Assigned to</th><th>Status</th><th>Action</th></tr></thead><tbody>{jobs.filter(matches).slice(0, limit).map(r => <tr key={r.id}><td><strong>{r.title}</strong><small>{clientName(r.client_id)}</small></td><td>{r.assignee}</td><td><Badge value={r.status || "scheduled"} /></td><td><button className="text-button" onClick={() => setDialog({ kind: "job", record: r })}>Manage <ArrowUpRight size={13} /></button></td></tr>)}</tbody></table>{jobs.filter(matches).length === 0 && empty("No services yet. Dispatch your first service to get started.")}</div>;
  const medicationList = (limit?: number) => <div>{medications.filter(matches).slice(0, limit).map(r => <div key={r.id} className="med-row"><div className="med-icon"><Pill size={19} /></div><div className="flex-1 min-w-0"><strong>{r.name}</strong><small>{clientName(r.client_id)} · {r.dose} {r.unit} · {r.route}</small><small>{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : ""}</small></div><div className="flex flex-col items-end gap-2"><Badge value={medStatus(r)} />{!outcome(r.id) && r.status !== "cancelled" && <div className="flex gap-3"><button className="text-button" onClick={() => setDialog({ kind: "medication", record: r })}>Edit</button><button className="text-button" onClick={() => setDialog({ kind: "administration", record: r })}>Record outcome</button></div>}</div></div>)}{medications.filter(matches).length === 0 && empty("No scheduled doses. Add a medication from a recorded prescription.")}</div>;
  return <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
    <a href="#main" className="skip-link">Skip to content</a>
    {mobile && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobile(false)} />}
    <aside onKeyDown={event => { if (event.key === "Escape") setMobile(false); }} className={`sidebar ${mobile ? "mobile-open" : ""}`}>
      <a href="/dashboard" className="brand"><div className="brand-mark">n<span>•</span></div><span className="nav-label">nexora<span className="brand-sub">SERVICE OPERATIONS</span></span></a>
      <div className="workspace nav-label"><span className="eyebrow">YOUR WORKSPACE</span><label className="sr-only" htmlFor="workspace">Employer workspace</label><select id="workspace" value={employerId} onChange={e => { setData(null); void refresh(e.target.value); }} disabled={loading || !employers.length}><option value="" disabled>Select workspace</option>{employers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
      <p className="eyebrow nav-label px-5 mt-6 mb-3">WORKSPACE</p>
      <nav aria-label="Main navigation">{tabs.map(([name, Icon]) => <button key={name} title={name} aria-current={tab === name ? "page" : undefined} className={`nav-item ${tab === name ? "selected" : ""}`} onClick={() => { setTab(name); setQuery(""); setMobile(false); }}><Icon size={19} /><span className="nav-label">{name}</span>{name === "Medications" && !!metrics?.attention_doses && <span className="nav-count nav-label">{metrics.attention_doses}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="local-card nav-label"><span className="status-dot" /> Local infrastructure<p>Five specialized agents.<br />Your data stays on your server.</p></div><button className="nav-item" onClick={() => setDialog({ kind: "employer" })} title="Add workspace"><Plus size={18} /><span className="nav-label">Add workspace</span></button><button className="nav-item desktop-only" title="Collapse navigation" aria-label="Collapse navigation" onClick={() => setCollapsed(!collapsed)}><ChevronLeft size={18} className={collapsed ? "rotate-180" : ""} /><span className="nav-label">Collapse sidebar</span></button></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="flex items-center gap-3"><button className="icon-button mobile-only" aria-label="Open navigation" onClick={() => setMobile(true)}><Menu size={20} /></button><span className="text-muted text-sm">Workspace</span><span className="text-muted">/</span><span className="text-sm font-medium">{tab}</span></div><div className="flex items-center gap-3"><span className="connection desktop-only"><span className={`status-dot ${error ? "offline" : ""}`} />{error ? "Connection needs attention" : loading ? "Connecting" : "Local API connected"}</span><button className="icon-button" onClick={changeTheme} aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button><button className="icon-button" aria-label="Sign out" onClick={() => { sessionStorage.removeItem("nexora-token"); window.location.assign("/auth"); }}><LogOut size={18} /></button><div className="avatar" title={user}>{user.slice(0, 2).toUpperCase() || "—"}</div></div></header>
      <MotionSurface revision={`${tab}-${employerId}`} busy={loading}>
        <div className="page-heading"><div><div className="eyebrow">EMPLOYER OPERATIONS</div><h1>{tab === "Overview" ? "A clearer view of every day." : tab}</h1><p>{tab === "Overview" ? "Your services, people, and compliance. Working together." : "Connected records. Clear ownership. Every change accounted for."}</p></div><div className="flex gap-2"><button className="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button><button className="button primary" disabled={loading || !employerId} onClick={() => setDialog({ kind: tab === "Medications" ? "medication" : tab === "Clients" ? "client" : "job" })}><Plus size={17} />{tab === "Medications" ? "Schedule dose" : tab === "Clients" ? "Add client" : "Dispatch service"}</button></div></div>
        {error && <div className="error mb-5" role="alert">{error} <button className="text-button" onClick={() => void refresh()}>Retry</button></div>}
        {!loading && !employerId && !error && <section className="panel welcome"><Building2 size={40} /><h2>Make room for better operations.</h2><p>Create your employer workspace, add clients, then coordinate your first service.</p><button className="button primary" onClick={() => setDialog({ kind: "employer" })}><Plus size={16} />Create workspace</button></section>}
        {loading && !data && <div className="grid md:grid-cols-4 gap-5" aria-label="Loading dashboard">{[1, 2, 3, 4].map(n => <div key={n} className="skeleton h-36" />)}</div>}
        {data && <>
          {(tab === "Overview" || tab === "Insights") && <>
            <div className="stats-grid">
              {[
                { name: "Active services", value: metrics!.active_jobs, detail: `${metrics!.total_jobs} total services`, icon: ClipboardList, tint: "blue" },
                { name: "Medication adherence", value: metrics!.adherence_percent === null ? "—" : `${metrics!.adherence_percent}%`, detail: `${metrics!.given_due_doses} of ${metrics!.due_doses} due doses recorded given`, icon: Pill, tint: "green" },
                { name: "Needs attention", value: metrics!.attention_doses, detail: "Due doses without a given outcome", icon: Clock, tint: "amber" },
                { name: "Data integrity", value: data.audit.status === "passed" ? "Verified" : "Review", detail: `${data.audit.events_checked} audit events checked`, icon: ShieldCheck, tint: "violet" },
              ].map(s => <section className="panel stat" key={s.name}><div className="flex justify-between items-center"><span>{s.name}</span><div className={`stat-icon ${s.tint}`}><s.icon size={17} /></div></div><div className="stat-value">{s.value}</div><small>{s.detail}</small></section>)}
            </div>
            <div className="integrity-banner"><ShieldCheck size={21} /><div><strong>{data.audit.status === "passed" ? "Every change has a trail." : "An integrity issue needs your attention."}</strong><p>{data.audit.status === "passed" ? "Schema, record history, and audit chain checks passed for this workspace." : data.audit.errors.join("; ")}</p></div><button className="text-button ml-auto" onClick={() => setTab("Audit trail")}>View audit <ArrowUpRight size={15} /></button></div>
          </>}
          {tab === "Overview" && <><div className="overview-grid"><section className="panel"><div className="panel-heading"><div><h2>Service activity</h2><p>Keep the day's work moving.</p></div><button className="text-button" onClick={() => setTab("Services")}>View all <ArrowUpRight size={14} /></button></div>{serviceTable(5)}</section><section className="panel"><div className="panel-heading"><div><h2>Medication watch</h2><p>Scheduled doses and recorded outcomes.</p></div><Pill size={18} className="text-muted" /></div>{medicationList(4)}</section></div><section className="panel mt-6"><div className="panel-heading"><div><h2>Your operations team</h2><p>Five specialized agents, one connected workflow.</p></div><Badge value="local rules" /></div><div className="agent-strip">{agents.map((a, i) => <button key={a.id} onClick={() => setTab("Agents")}><span className="agent-number">0{i + 1}</span><strong>{a.name.replace(" Agent", "")}</strong><small><span className="status-dot" /> {agentState(a.id)}</small></button>)}</div></section></>}
          {(tab === "Services" || tab === "Medications" || tab === "Clients") && <section className="panel"><div className="panel-heading"><div><h2>{tab === "Medications" ? "Medication schedule" : tab === "Clients" ? "Client directory" : "Service register"}</h2><p>{tab === "Medications" ? "One record per prescribed scheduled dose. Recorded outcomes are immutable." : "Persistent records for this employer workspace."}</p></div><label className="search-field"><Search size={16} /><span className="sr-only">Search records</span><input placeholder="Search records…" value={query} onChange={e => setQuery(e.target.value)} /></label></div>{tab === "Services" ? serviceTable() : tab === "Medications" ? medicationList() : <div className="table-scroll"><table><thead><tr><th>Client</th><th>Reference</th><th>Record version</th></tr></thead><tbody>{clients.filter(matches).map(c => <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.reference}</td><td>v{c.version}</td></tr>)}</tbody></table>{!clients.length && empty("Add a client before scheduling services or medication.")}</div>}</section>}
          {tab === "Agents" && <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{agents.map((a, i) => <section className="panel agent-card" key={a.id}><span className="agent-number">0{i + 1}</span><h2>{a.name}</h2><p>{a.responsibility}</p><div className="mt-4"><Badge value={agentState(a.id)} /></div><small className="mt-4">Bound tools</small><p className="font-mono text-xs">{a.tools.join(", ")}</p><small className="mt-4">Fallback</small><p>{a.fallback}</p></section>)}</div>}
          {tab === "Audit trail" && <section className="panel"><div className="panel-heading"><div><h2>Accountability, built in.</h2><p>Latest 50 events. Full history is retained and verified in the database.</p></div><Badge value={data.audit.status} /></div>{data.audit.errors.map(e => <p className="error m-4" key={e}>{e}</p>)}<div className="table-scroll"><table><thead><tr><th>Event</th><th>Time</th><th>Actor</th><th>Audit fingerprint</th></tr></thead><tbody>{data.events.map(e => <tr key={e.sequence}><td><strong>{e.action.replace(".", " · ")}</strong><small>#{e.sequence}</small></td><td>{new Date(e.occurred_at).toLocaleString()}</td><td>User {e.actor_id}</td><td><code title={e.digest}>{e.digest.slice(0, 16)}…</code></td></tr>)}</tbody></table></div></section>}
          {tab === "Insights" && <section className="panel p-7"><h2>Measured from your records.</h2><p className="text-muted mt-2">{metrics!.definition}</p><div className="mt-8 space-y-6">{[{ name: "Services completed", value: metrics!.completed_jobs, total: metrics!.total_jobs }, { name: "Due doses recorded given", value: metrics!.given_due_doses, total: metrics!.due_doses }].map(m => <div key={m.name}><div className="flex justify-between text-sm mb-2"><span>{m.name}</span><strong>{m.value} / {m.total}</strong></div><progress value={m.value} max={m.total || 1} className="w-full" aria-label={m.name} /></div>)}</div><p className="text-sm text-muted mt-8">No synthetic trends or benchmark comparisons. A dash means there is no denominator yet.</p></section>}
        </>}
        <footer className="page-footer"><span>© Nexora · Employer service operations</span><span>{updated ? `Last refreshed ${updated}` : "Local-first workspace"} · {agents.length || 5} agents</span></footer>
      </MotionSurface>
    </div>
    <div className="save-notification-region" role="status" aria-live="polite" aria-atomic="true">{savedNotice && <div className="save-notification"><CheckCircle2 size={20} /><div><strong>Record saved</strong><p>{savedNotice}</p></div><button className="icon-button" aria-label="Dismiss save confirmation" onClick={() => setSavedNotice("")}><X size={16} /></button></div>}</div>
    {dialog && <OperationDialog key={`${dialog.kind}-${dialog.record?.id || "new"}`} kind={dialog.kind} record={dialog.record} employerId={employerId} clients={clients} onClose={() => setDialog(null)} onSaved={async id => { setSavedNotice("Your change was stored with an audit record."); await refresh(id); }} />}
  </div>;
}
