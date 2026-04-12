import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import type { Task } from "../types";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  // New task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get<Task[]>("/tasks/");
      setTasks(data.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]));
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post<Task>("/tasks/", { title, description, priority });
      setTasks((prev) =>
        [...prev, data].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      );
      setTitle("");
      setDescription("");
      setPriority("medium");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (task: Task) => {
    const { data } = await api.put<Task>(`/tasks/${task.id}`, { completed: !task.completed });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)));
  };

  const deleteTask = async (id: number) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filtered = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
    high: tasks.filter((t) => t.priority === "high" && !t.completed).length,
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">◈ Taskr</div>
        <nav className="sidebar-nav">
          <button className={filter === "all" ? "nav-item active" : "nav-item"} onClick={() => setFilter("all")}>
            <span className="nav-icon">▦</span> All tasks
            <span className="nav-count">{stats.total}</span>
          </button>
          <button className={filter === "active" ? "nav-item active" : "nav-item"} onClick={() => setFilter("active")}>
            <span className="nav-icon">◎</span> Active
            <span className="nav-count">{stats.total - stats.done}</span>
          </button>
          <button className={filter === "done" ? "nav-item active" : "nav-item"} onClick={() => setFilter("done")}>
            <span className="nav-icon">✓</span> Completed
            <span className="nav-count">{stats.done}</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.username[0].toUpperCase()}</div>
            <span>{user?.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        <header className="main-header">
          <div>
            <h1>{filter === "all" ? "All Tasks" : filter === "active" ? "Active" : "Completed"}</h1>
            {stats.high > 0 && (
              <p className="header-sub">{stats.high} high priority task{stats.high > 1 ? "s" : ""} need attention</p>
            )}
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ New task</button>
        </header>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.done}</span>
            <span className="stat-label">Done</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%</span>
            <span className="stat-label">Complete</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* New task form */}
        {showForm && (
          <div className="form-overlay" onClick={() => setShowForm(false)}>
            <div className="task-form-card" onClick={(e) => e.stopPropagation()}>
              <h2>New Task</h2>
              <form onSubmit={createTask}>
                <div className="field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    required
                    autoFocus
                  />
                </div>
                <div className="field">
                  <label>Description <span className="optional">(optional)</span></label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add more details..."
                    rows={3}
                  />
                </div>
                <div className="field">
                  <label>Priority</label>
                  <div className="priority-picker">
                    {(["low", "medium", "high"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`priority-btn priority-${p} ${priority === p ? "selected" : ""}`}
                        onClick={() => setPriority(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Adding..." : "Add task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✦</div>
            <p>{filter === "done" ? "No completed tasks yet" : "No tasks yet — add one!"}</p>
          </div>
        ) : (
          <ul className="task-list">
            {filtered.map((task) => (
              <li key={task.id} className={`task-item ${task.completed ? "completed" : ""}`}>
                <button className="task-check" onClick={() => toggleComplete(task)}>
                  {task.completed ? "✓" : ""}
                </button>
                <div className="task-body">
                  <div className="task-top">
                    <span className="task-title">{task.title}</span>
                    <span className={`priority-tag priority-${task.priority}`}>{task.priority}</span>
                  </div>
                  {task.description && <p className="task-desc">{task.description}</p>}
                </div>
                <button className="task-delete" onClick={() => deleteTask(task.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
