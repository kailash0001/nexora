"use client";
import { FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck, ClipboardList, Pill, BarChart3, Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
export default function AuthPage() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (register) await api("/api/auth/register", { method: "POST", body: JSON.stringify(values) });
      const result = await api<{ access_token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: values.email, password: values.password }) });
      sessionStorage.setItem("nexora-token", result.access_token);
      window.location.assign("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not sign in."); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell">
    <section className="auth-story" aria-label="About Nexora">
      <div className="auth-wordmark"><span className="brand-mark" aria-hidden="true">n<span>•</span></span>nexora<span className="auth-wordmark-dot">.</span></div>
      <div className="auth-story-body">
        <div className="auth-kicker">PEOPLE FIRST. OPERATIONS CONNECTED.</div>
        <h2>Great service.<br /><span>Clearer every day.</span></h2>
        <p>One workspace for the people, services, and medication records you look after.</p>
        <div className="workflow-preview" aria-label="Five-agent workflow overview, not live activity">
          <div className="workflow-caption"><span>ONE CONNECTED WORKFLOW</span><span>5 agents</span></div>
          {[
            { Icon: Building2, title: "Employer intake & routing", detail: "Give every request a clear starting point." },
            { Icon: Pill, title: "Medication & compliance", detail: "Keep prescribed doses and outcomes together." },
            { Icon: ClipboardList, title: "Service execution", detail: "Connect the right people to the day's work." },
            { Icon: ShieldCheck, title: "Data integrity & audit", detail: "Account for each recorded change." },
            { Icon: BarChart3, title: "Reporting & insights", detail: "See the picture behind your operations." },
          ].map(({ Icon, title, detail }, i) => <div className="workflow-step" key={title}><span className="workflow-icon"><Icon size={18} /></span><div><strong>{title}</strong><p>{detail}</p></div><span className="workflow-index">0{i + 1}</span></div>)}
        </div>
      </div>
      <div className="auth-story-footer"><ShieldCheck size={17} /> Local infrastructure. Purpose-built accountability.</div>
    </section>
    <section className="auth-form-side">
      <div className="auth-form-card">
        <div className="auth-form-icon" aria-hidden="true"><ArrowRight size={23} /></div>
        <div className="eyebrow mb-4">YOUR NEXT CHAPTER OF OPERATIONS</div>
        <h1>{register ? "Create your account." : "Welcome back."}</h1>
        <p className="auth-intro">{register ? "A connected workspace starts with you." : "A little less complexity. A lot more clarity. Sign in to your workspace."}</p>
        <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
          {register && <label className="field auth-name">Full name<input name="name" required maxLength={120} autoComplete="name" placeholder="Your full name" disabled={busy} /></label>}
          <label className="field">Work email<input name="email" type="email" required autoComplete="email" placeholder="you@company.com" disabled={busy} /></label>
          <div className="field"><label htmlFor="auth-password">Password</label><div className="password-control"><input id="auth-password" name="password" type={showPassword ? "text" : "password"} required minLength={8} maxLength={72} autoComplete={register ? "new-password" : "current-password"} placeholder={register ? "At least 8 characters" : "Enter your password"} disabled={busy} /><button type="button" className="icon-button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="button primary auth-submit" disabled={busy}>{busy ? <><Loader2 size={17} className="animate-spin" />{register ? "Creating your account…" : "Signing in…"}</> : <>{register ? "Create account" : "Sign in to workspace"}<ArrowRight size={17} /></>}</button>
        </form>
        <p className="auth-switch">{register ? "Already have an account? " : "New to Nexora? "}<button className="text-button" disabled={busy} onClick={() => { setRegister(!register); setShowPassword(false); setError(""); }}>{register ? "Sign in" : "Create an account"}</button></p>
        <div className="auth-form-footer"><ShieldCheck size={15} /><span>Your workspace. Your infrastructure.</span></div>
      </div>
      <p className="auth-bottom-note">Built for the people behind every service.</p>
    </section>
  </main>;
}
