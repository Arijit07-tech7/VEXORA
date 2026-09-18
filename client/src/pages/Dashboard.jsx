import { useMemo } from "react";
import Layout from "../components/Layout";
import Loading from "../components/Loading";
import { useApi } from "../hooks/useApi";
import { getUser } from "../lib/auth";
import { formatDate } from "../lib/utils";

const cards = [
  ["users", "USERS", "totalUsers", "◉"],
  ["active", "ACTIVE USERS", "activeUsers", "●"],
  ["tasks", "TASKS", "tasks", "✓"],
  ["assignments", "ASSIGNMENTS", "assignments", "▣"],
  ["hackathons", "HACKATHONS", "hackathons", "◇"],
  ["notifications", "NOTIFICATIONS", "notifications", "◌"]
];

export default function Dashboard() {
  const user = getUser();
  const admin = user?.role === "admin";
  const { data, loading, error } = useApi("/api/dashboard");

  const stats = data?.stats || {};
  const recentActivity = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const myWork = useMemo(
    () => (Array.isArray(data?.myWork) ? [...data.myWork].sort((a, b) => b.id - a.id) : []),
    [data?.myWork]
  );
  const snapshot = data?.snapshot || { openTasks: 0, pendingAssignments: 0, unreadNotifications: 0 };

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{admin ? "OVERVIEW / LIVE" : "PERSONAL WORKSPACE / LIVE"}</p>
          <h2>{admin ? "Command Dashboard" : "My Workspace"}</h2>
          <p className="page-subtitle">
            {admin
              ? "Manage users, assignments, tasks, hackathons and workspace updates."
              : "Everything assigned to you appears here. Open Tasks, Assignments or Hackathons for the complete brief and latest details."}
          </p>
        </div>
        <div className="live-badge"><span /> LIVE DATA</div>
      </div>

      {loading && <Loading label="Syncing workspace data…" />}
      {error && <div className="error-box">{error}</div>}

      {data && !error && (
        <>
          <section className="stat-grid">
            {cards.map(([key, label, prop, icon]) => (
              <div className={`stat-card ${!admin && key === "users" ? "member-hidden-stat" : ""}`} key={key}>
                <div className="stat-icon">{icon}</div>
                <div>
                  <span>{label}</span>
                  <strong>{Number(stats[prop] ?? 0)}</strong>
                </div>
              </div>
            ))}
          </section>

          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-head">
                <h3>{admin ? "Recent Activity" : "Recent Workspace Updates"}</h3>
                <span>{admin ? "LAST 10" : "FROM ADMIN"}</span>
              </div>
              {recentActivity.length === 0 ? (
                <div className="empty">No updates yet.</div>
              ) : (
                <div className="activity-list">
                  {recentActivity.map((item) => (
                    <div className="activity" key={item.id}>
                      <div className="activity-mark" />
                      <div>
                        <strong>{item.title || "Workspace update"}</strong>
                        {item.message && <p>{item.message}</p>}
                        <p>{item.actor || "System"} · {formatDate(item.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-head"><h3>{admin ? "System Snapshot" : "My Work Snapshot"}</h3></div>
              <div className="snapshot">
                <div><span>Open tasks</span><strong>{Number(snapshot.openTasks || 0)}</strong></div>
                <div><span>Pending assignments</span><strong>{Number(snapshot.pendingAssignments || 0)}</strong></div>
                <div><span>Unread updates</span><strong>{Number(snapshot.unreadNotifications || 0)}</strong></div>
              </div>
            </div>
          </section>

          {!admin && (
            <section className="panel assigned-panel">
              <div className="panel-head"><h3>Assigned Work</h3><span>FULL DETAILS AVAILABLE</span></div>
              {myWork.length === 0 ? (
                <div className="empty">No task, assignment or hackathon has been assigned to you yet.</div>
              ) : (
                <div className="assigned-list">
                  {myWork.map((work) => (
                    <div className="assigned-row" key={`${work.kind}-${work.id}`}>
                      <span className="work-kind">{work.kind}</span>
                      <div>
                        <strong>{work.title}</strong>
                        <small>{String(work.status || "pending").replace("_", " ")} · {formatDate(work.deadline)}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </Layout>
  );
}
