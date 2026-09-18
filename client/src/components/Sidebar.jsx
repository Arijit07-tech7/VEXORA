import { NavLink } from "react-router-dom";
import { getUser } from "../lib/auth";

const links = [
  ["dashboard", "◈", "Dashboard"],
  ["tasks", "✓", "Tasks"],
  ["assignments", "▣", "Assignments"],
  ["hackathons", "◇", "Hackathons"],
  ["notifications", "◌", "Notifications"]
];

export default function Sidebar({ open, onClose }) {
  const user = getUser();
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">V</div>
        <div>
          <h1>VEXORA</h1>
          <span>COMMAND CENTER</span>
        </div>
      </div>

      <nav>
        <p className="nav-label">OPERATIONS</p>
        {links.map(([to, icon, label]) => (
          <NavLink key={to} to={`/${to}`} onClick={onClose}>
            <span>{icon}</span>{label}
          </NavLink>
        ))}
        {user?.role === "admin" && (
          <>
            <p className="nav-label">CONTROL</p>
            <NavLink to="/admin" onClick={onClose}>
              <span>⚙</span>Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-foot">
        <span className="pulse-line" />
        Secure workspace
      </div>
    </aside>
  );
}
