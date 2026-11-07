const API_ORIGIN = "https://iboss-conversation-desk.manuelruiz3.chatgpt.site";
export const APP_BASE = import.meta.env.BASE_URL;
export const assetUrl = (name: string) => `${APP_BASE}${name.replace(/^\/+/, "")}`;
export const appSignInUrl = () => new URL(APP_BASE, window.location.origin).href;
type Session = { token: string; expiresAt: string; email: string };
type AuthSnapshot = { session: Session | null; notice: string; setupToken: string };
let state: AuthSnapshot = { session: null, notice: "", setupToken: "" };
const listeners = new Set<() => void>();
let authRevision = 0;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
const notify = () => { for (const listener of listeners) listener(); };
export const getAuthSnapshot = () => state;
export const subscribeAuth = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
export function captureSetupLink() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const token = hash.get("setup");
  if (token !== null) {
    authRevision++;
    if (expiryTimer) clearTimeout(expiryTimer);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    state = { session: null, notice: token ? "" : "This setup link is incomplete. Ask the admin for a new link.", setupToken: token || "" };
    notify();
  }
}
export function clearSession(notice = "") { authRevision++; if (expiryTimer) clearTimeout(expiryTimer); state = { session: null, notice, setupToken: "" }; notify(); }
export function leaveSetup() { clearSession(); }
function saveSession(session: Session) {
  if (typeof session.token !== "string" || !session.token || typeof session.email !== "string" || !session.email || typeof session.expiresAt !== "string" || !Number.isFinite(Date.parse(session.expiresAt))) throw new Error("Sign-in returned an invalid session.");
  const duration = Date.parse(session.expiresAt) - Date.now();
  if (duration <= 0) throw new Error("This session has already expired. Please sign in again.");
  if (expiryTimer) clearTimeout(expiryTimer);
  state = { session, notice: "", setupToken: "" }; notify();
  expiryTimer = setTimeout(() => { if (state.session?.token === session.token) clearSession("Your session expired. Please sign in again."); }, Math.min(duration, 2147483647));
}
export async function apiFetch(path: string, init: RequestInit = {}) {
  if (!path.startsWith("/api/") || path.includes("\\") || path.startsWith("//")) throw new Error("Invalid application request.");
  const token = state.session?.token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`); else headers.delete("Authorization");
  let response: Response;
  try { response = await fetch(`${API_ORIGIN}${path}`, { ...init, headers, credentials: "omit", mode: "cors", cache: "no-store", redirect: "error" }); }
  catch (error) { if (init.signal?.aborted) throw error; throw new Error("Unable to reach the workspace service. Check your connection and try again."); }
  if (response.status === 401 && token && state.session?.token === token) clearSession("Your session ended. Please sign in again.");
  return response;
}
async function authenticate(path: string, payload: unknown) {
  const revision = ++authRevision;
  let response: Response;
  try { response = await fetch(`${API_ORIGIN}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), credentials: "omit", mode: "cors", cache: "no-store", redirect: "error" }); }
  catch { throw new Error("Unable to reach the sign-in service. Check your connection and try again."); }
  const result = await response.json() as Session & { error?: string };
  if (!response.ok) throw new Error(result.error || (response.status === 429 ? "Too many attempts. Please wait and try again." : "Sign-in could not be completed."));
  if (revision !== authRevision) throw new Error("The sign-in request changed. Please try again.");
  saveSession(result);
}
export const login = (email: string, password: string) => authenticate("/api/auth/login", { email: email.trim().toLowerCase(), password });
export const activate = (password: string) => authenticate("/api/auth/activate", { token: state.setupToken, password });
export async function logout() {
  const token = state.session?.token;
  clearSession("Signed out.");
  if (!token) return;
  try { const response = await fetch(`${API_ORIGIN}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}", credentials: "omit", mode: "cors", cache: "no-store", redirect: "error" }); if (!response.ok && response.status !== 401) throw new Error("Logout failed"); }
  catch { if (!state.session) { state = { ...state, notice: "Signed out on this page. The server could not confirm sign-out; the previous session will expire automatically." }; notify(); } }
}
