import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Toast from "../components/Toast";
import Loading from "../components/Loading";
import { get, put } from "../lib/api";
import { formatDate } from "../lib/utils";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await get("/api/notifications");
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (error) {
      setToast(error.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function read(id) {
    try {
      await put(`/api/notifications/${id}/read`, {});
      setItems((current) => current.map((item) => (
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item
      )));
    } catch (error) {
      setToast(error.message || "Unable to update notification.");
    }
  }

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ALERTS / MESSAGES</p>
          <h2>Notifications</h2>
          <p className="page-subtitle">Assignment, task and workspace updates delivered to your account.</p>
        </div>
      </div>

      {loading ? <Loading label="Loading notifications…" /> : (
        <div className="notification-list">
          {items.length === 0 ? (
            <div className="panel empty">No notifications yet.</div>
          ) : items.map((notification) => (
            <article className={`notification ${notification.read_at ? "read" : ""}`} key={notification.id}>
              <div className="notification-mark">◌</div>
              <div className="notification-body">
                <div className="notification-head">
                  <strong>{notification.title}</strong>
                  <span>{formatDate(notification.created_at)}</span>
                </div>
                <p>{notification.message}</p>
                {!notification.read_at && (
                  <button className="ghost-btn" onClick={() => read(notification.id)}>Mark as read</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Toast message={toast} onClose={() => setToast("")} />
    </Layout>
  );
}
