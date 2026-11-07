import { createRoot } from "react-dom/client";
import App from "./app";
import AuthGate from "./components/auth-gate";
import { captureSetupLink } from "./lib/api";
import "./styles.css";
captureSetupLink();
window.addEventListener("hashchange", captureSetupLink);
createRoot(document.getElementById("root")!).render(<AuthGate><App/></AuthGate>);
