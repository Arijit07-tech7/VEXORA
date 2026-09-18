import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../lib/auth";
import { initials } from "../lib/utils";

export default function Navbar({ onMenu }) {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={onMenu}>☰</button>
      <div className="topbar-title">
        <span className="status-dot" /> SYSTEM ONLINE
      </div>
      <div className="topbar-user">
        <div className="avatar">{initials(user?.name)}</div>
        <div>
          <strong>{user?.name || user?.id}</strong>
          <small>{user?.role}</small>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
