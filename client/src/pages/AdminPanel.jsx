import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import Loading from "../components/Loading";
import { del, get, post, put } from "../lib/api";

const blank = { id: "", name: "", email: "", password: "", role: "member", active: true };

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await get("/api/users");
      setUsers(data.users || []);
    } catch (e) {
      setToast(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const change = (e) => setForm((current) => ({
    ...current,
    [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value
  }));

  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) {
        await put(`/api/users/${editing}`, {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          active: form.active,
          ...(form.password ? { password: form.password } : {})
        });
      } else {
        await post("/api/users", { ...form, id: form.id.trim(), name: form.name.trim(), email: form.email.trim() });
      }
      setOpen(false);
      setEditing(null);
      setForm(blank);
      setToast("User saved successfully.");
      load();
    } catch (e) {
      setToast(e.message);
    }
  }

  async function toggle(u) {
    if (u.id === "ARIJIT") {
      setToast("The primary admin must remain active.");
      return;
    }
    try {
      await put(`/api/users/${u.id}`, { active: !u.active });
      setToast("User status updated.");
      load();
    } catch (e) {
      setToast(e.message);
    }
  }

  async function remove(u) {
    if (u.id === "ARIJIT") {
      setToast("The primary admin cannot be deleted.");
      return;
    }
    if (!confirm(`Delete ${u.id}?`)) return;
    try {
      await del(`/api/users/${u.id}`);
      setToast("User deleted.");
      load();
    } catch (e) {
      setToast(e.message);
    }
  }

  function edit(u) {
    setEditing(u.id);
    setForm({ id: u.id, name: u.name, email: u.email || "", password: "", role: u.role, active: !!u.active });
    setOpen(true);
  }

  function createUser() {
    setEditing(null);
    setForm({ ...blank });
    setOpen(true);
  }

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h2>Identity & Access</h2>
          <p className="page-subtitle">Create and manage members manually. Credentials are never shown as demo data.</p>
        </div>
        <button className="primary-btn" onClick={createUser}>+ Create User</button>
      </div>

      {loading ? <Loading /> : (
        <div className="table-panel glass-card">
          <table>
            <thead><tr><th>USER</th><th>ROLE</th><th>STATUS</th><th>EMAIL</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong><small>{u.id}</small></td>
                  <td><span className="tag tag-active">{u.role}</span></td>
                  <td><span className={`tag ${u.active ? "tag-done" : "tag-critical"}`}>{u.active ? "active" : "inactive"}</span></td>
                  <td>{u.email || "—"}</td>
                  <td className="actions">
                    <button onClick={() => edit(u)}>Edit</button>
                    <button onClick={() => toggle(u)} disabled={u.id === "ARIJIT"}>{u.active ? "Deactivate" : "Activate"}</button>
                    <button className="danger-text" onClick={() => remove(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} title={editing ? "Edit User" : "Create User"} onClose={() => setOpen(false)}>
        <form className="modal-form" onSubmit={submit} autoComplete="off">
          <label>User ID<input name="user-id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!!editing} required /></label>
          <label>Name<input name="name" value={form.name} onChange={change} required /></label>
          <label>Email<input type="email" name="email" value={form.email} onChange={change} /></label>
          <div className="form-grid">
            <label>Role<select name="role" value={form.role} onChange={change} disabled={editing === "ARIJIT"}><option value="member">Member</option><option value="admin">Admin</option></select></label>
            <label>Password<input type="password" name="password" autoComplete="new-password" value={form.password} onChange={change} placeholder={editing ? "Leave blank to keep current" : "Enter password"} required={!editing} /></label>
          </div>
          <label className="checkbox"><input type="checkbox" name="active" checked={form.active} onChange={change} /> Account active</label>
          <button className="primary-btn full">{editing ? "Update User" : "Create User"}</button>
        </form>
      </Modal>
      <Toast message={toast} onClose={() => setToast("")} />
    </Layout>
  );
}
