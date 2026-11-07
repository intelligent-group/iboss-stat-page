import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { activate, assetUrl, getAuthSnapshot, leaveSetup, login, subscribeAuth } from "@/lib/api";

export default function AuthGate({ children }: { children: ReactNode }) {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const isSetup = !!auth.setupToken;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    if (isSetup && password !== confirmation) { setError("The passwords do not match."); return; }
    if (isSetup && (Array.from(password).length < 14 || Array.from(password).length > 128)) { setError("Use a password between 14 and 128 characters."); return; }
    setBusy(true); setError("");
    try { if (isSetup) await activate(password); else await login(email, password); setPassword(""); setConfirmation(""); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Sign-in could not be completed."); }
    finally { setBusy(false); }
  };
  if (auth.session) return <div key={auth.session.token}>{children}</div>;
  return <main className="access-gate independent-login"><section className="access-gate-card"><img src={assetUrl("iboss-logo.png")} alt="iboss" width="500" height="137"/><div className="eyebrow">IBOSS STAT PAGE</div><span className="access-gate-icon"><LockKeyhole size={26}/></span><h1>{isSetup ? "Set your workspace password." : "Welcome to your partner workspace."}</h1><p>{isSetup ? "Choose a password to activate your approved account. This setup link can be used once." : "Sign in with the email and password approved for your iBoss workspace."}</p>{auth.notice && <div className="auth-notice" role="status">{auth.notice}</div>}{error && <div className="auth-error" role="alert">{error}</div>}<form className="independent-auth-form" onSubmit={submit}>{!isSetup && <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} required autoComplete="username" disabled={busy} placeholder="you@company.com"/></label>}<label>{isSetup ? "Create password" : "Password"}<input type="password" value={password} onChange={event => setPassword(event.target.value)} maxLength={256} required autoComplete={isSetup ? "new-password" : "current-password"} disabled={busy}/>{isSetup && <small>14–128 characters. A long, unique passphrase works well.</small>}</label>{isSetup && <label>Confirm password<input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} maxLength={256} required autoComplete="new-password" disabled={busy}/></label>}<button className="button primary" type="submit" disabled={busy}>{busy ? isSetup ? "Activating…" : "Signing in…" : isSetup ? "Set password & sign in" : "Sign in"}<ArrowRight size={15}/></button></form><div className="auth-help">{isSetup ? <button onClick={() => { leaveSetup(); setPassword(""); setConfirmation(""); setError(""); }} disabled={busy}>Back to sign in</button> : <p>Need access or a password reset? Ask your workspace admin for a setup link.</p>}</div><div className="auth-private-note"><ShieldCheck size={13}/>Your account controls which workspace information you can see.</div></section></main>;
}
