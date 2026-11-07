import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { activate, changePassword, logout, assetUrl, getAuthSnapshot, leaveSetup, login, subscribeAuth } from "@/lib/api";

export default function AuthGate({ children }: { children: ReactNode }) {
  const auth = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const isSetup = !!auth.setupToken;
  const mustChangePassword = auth.session?.mustChangePassword === true;
  const choosingPassword = isSetup || mustChangePassword;
  useEffect(() => { setPassword(""); setConfirmation(""); setError(""); }, [isSetup, mustChangePassword]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    if (choosingPassword && password !== confirmation) { setError("The passwords do not match."); return; }
    if (choosingPassword && (Array.from(password).length < 14 || Array.from(password).length > 128)) { setError("Use a password between 14 and 128 characters."); return; }
    setBusy(true); setError("");
    try { if (mustChangePassword) await changePassword(password); else if (isSetup) await activate(password); else await login(email, password); setPassword(""); setConfirmation(""); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Sign-in could not be completed."); }
    finally { setBusy(false); }
  };
  if (auth.session && !mustChangePassword) return <div key={auth.session.token}>{children}</div>;
  return <main className="access-gate independent-login"><section className="access-gate-card"><img src={assetUrl("iboss-logo.png")} alt="iboss" width="500" height="137"/><div className="eyebrow">IBOSS STAT PAGE</div><span className="access-gate-icon"><LockKeyhole size={26}/></span><h1>{mustChangePassword ? "Choose your private password." : isSetup ? "Set your workspace password." : "Welcome to your partner workspace."}</h1><p>{mustChangePassword ? "Your temporary password is for first sign-in. Choose a private password to open your workspace." : isSetup ? "Choose a password to activate your approved account. This setup link can be used once." : "Sign in with the email and password approved for your iBoss workspace."}</p>{auth.notice && <div className="auth-notice" role="status">{auth.notice}</div>}{error && <div className="auth-error" role="alert">{error}</div>}<form className="independent-auth-form" onSubmit={submit}>{!choosingPassword && <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={254} required autoComplete="username" disabled={busy} placeholder="you@company.com"/></label>}<label>{choosingPassword ? "Create password" : "Password"}<input type="password" value={password} onChange={event => setPassword(event.target.value)} maxLength={256} required autoComplete={choosingPassword ? "new-password" : "current-password"} disabled={busy}/>{choosingPassword && <small>14–128 characters. A long, unique passphrase works well.</small>}</label>{choosingPassword && <label>Confirm password<input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} maxLength={256} required autoComplete="new-password" disabled={busy}/></label>}<button className="button primary" type="submit" disabled={busy}>{busy ? mustChangePassword ? "Saving password…" : isSetup ? "Activating…" : "Signing in…" : mustChangePassword ? "Save password & open workspace" : isSetup ? "Set password & sign in" : "Sign in"}<ArrowRight size={15}/></button></form><div className="auth-help">{mustChangePassword ? <button onClick={() => { setPassword(""); setConfirmation(""); setError(""); logout(); }} disabled={busy}>Sign out</button> : isSetup ? <button onClick={() => { leaveSetup(); setPassword(""); setConfirmation(""); setError(""); }} disabled={busy}>Back to sign in</button> : <p>Need access or a password reset? Ask your workspace admin for a setup link.</p>}</div><div className="auth-private-note"><ShieldCheck size={13}/>Your account controls which workspace information you can see.</div></section></main>;
}
