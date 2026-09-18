import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { post } from "../lib/api";
import { saveAuth } from "../lib/auth";

export default function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await post("/api/auth/login", { id: id.trim(), password });
      saveAuth(data);
      setPassword("");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-orb login-orb-a" />
      <div className="login-orb login-orb-b" />
      <div className="login-grid" />
      <div className="login-card glass-card">
        <div className="login-card-glow" />
        <div className="login-logo">V</div>
        <p className="eyebrow">SECURE OPERATIONS PLATFORM</p>
        <h1>Welcome to <span>VEXORA</span></h1>
        <p className="login-sub">Sign in to your command center.</p>
        <form onSubmit={submit} autoComplete="off">
          <label>USER ID<input name="vexora-login-id" autoComplete="off" spellCheck="false" value={id} onChange={(e) => setId(e.target.value)} required /></label>
          <label>PASSWORD<input name="vexora-login-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-btn full" disabled={loading}>
            {loading ? "AUTHENTICATING…" : "ENTER COMMAND CENTER →"}
          </button>
        </form>
        <div className="login-security">
          <span className="security-dot" /> Credentials are private · Protected authentication
        </div>
      </div>
    </div>
  );
}
