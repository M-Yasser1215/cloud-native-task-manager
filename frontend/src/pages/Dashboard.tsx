import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import type { Task } from "../types";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date) < today;
}

function formatDueDate(due_date: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(due_date);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

// ── Inline editable field ─────────────────────────────────────────────────────
function InlineEdit({ value, onSave, multiline = false, className = "", placeholder = "" }: {
  value: string; onSave: (val: string) => void; multiline?: boolean; className?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
 
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
 
  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };
 
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setDraft(value); setEditing(false); }
  };
 
  if (!editing) {
    return (
      <span className={`${className} inline-edit-trigger`} onClick={() => { setDraft(value); setEditing(true); }} title="Click to edit">
        {value || <span className="inline-edit-placeholder">{placeholder}</span>}
      </span>
    );
  }
 
  const props = { ref, value: draft, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value), onBlur: commit, onKeyDown: handleKey, className: `inline-edit-input ${multiline ? "inline-edit-textarea" : ""}` };
  return multiline ? <textarea {...props} rows={2} /> : <input {...props} type="text" />;
}

// ── Tag input chip component ───────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");
 
  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInput("");
  };
 
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input); }
    if (e.key === "Backspace" && !input && tags.length) onChange(tags.slice(0, -1));
  };
 
  return (
    <div className="tag-input-wrapper">
      {tags.map((tag) => (
        <span key={tag} className="tag-chip tag-chip-input">
          {tag}
          <button type="button" className="tag-chip-remove" onClick={() => onChange(tags.filter((t) => t !== tag))}>✕</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => input && addTag(input)}
        placeholder={tags.length === 0 ? "Add tags (press Enter or comma)" : ""}
        className="tag-input-field"
      />
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get<Task[]>("/tasks/");
      setTasks(data.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]));
    } finally { setLoading(false); }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post<Task>("/tasks/", { title, description, priority, due_date: dueDate || null });
      setTasks((prev) => [...prev, data].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]));
      setTitle(""); setDescription(""); setPriority("medium"); setDueDate("");
      setShowForm(false);
    } finally { setSubmitting(false); }
  };

  const updateTask = async (task: Task, changes: Partial<Task>) => {
    const { data } = await api.put<Task>(`/tasks/${task.id}`, changes);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? data : t)));
  };

  const toggleComplete = (task: Task) => updateTask(task, { completed: !task.completed });

  const deleteTask = async (id: number) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const handleFilterChange = (f: "all" | "active" | "done") => { setFilter(f); setSidebarOpen(false); };

  // All unique tags across all tasks
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags || []))).sort()

  const filtered = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.completed).length,
    high: tasks.filter((t) => t.priority === "high" && !t.completed).length,
    overdue: tasks.filter((t) => isOverdue(t)).length,
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="dashboard">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-logo">◈ Taskr</div>
        <nav className="sidebar-nav">
          <button className={filter === "all" ? "nav-item active" : "nav-item"} onClick={() => handleFilterChange("all")}>
            <span className="nav-icon">▦</span> All tasks <span className="nav-count">{stats.total}</span>
          </button>
          <button className={filter === "active" ? "nav-item active" : "nav-item"} onClick={() => handleFilterChange("active")}>
            <span className="nav-icon">◎</span> Active <span className="nav-count">{stats.total - stats.done}</span>
          </button>
          <button className={filter === "done" ? "nav-item active" : "nav-item"} onClick={() => handleFilterChange("done")}>
            <span className="nav-icon">✓</span> Completed <span className="nav-count">{stats.done}</span>
          </button>

          {allTags.length > 0 && (
            <>
              <div className="sidebar-section-label">Tags</div>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={activeTag === tag ? "nav-item active" : "nav-item"}
                  onClick={() => { setActiveTag(activeTag === tag ? null : tag); setSidebarOpen(false); }}
                >
                  <span className="nav-icon">#</span> {tag}
                  <span className="nav-count">{tasks.filter((t) => (t.tags || []).includes(tag)).length}</span>
                </button>
              ))}
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.username[0].toUpperCase()}</div>
            <span>{user?.username}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <main className="main">
        <header className="main-header">
          <div className="main-header-left">
            <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <span /><span /><span />
            </button>
            <div>
              <h1>
                {activeTag ? `#${activeTag}` : filter === "all" ? "All Tasks" : filter === "active" ? "Active" : "Completed"}
              </h1>
              {stats.overdue > 0 && <p className="header-sub overdue-sub">⚠ {stats.overdue} task{stats.overdue > 1 ? "s" : ""} overdue</p>}
              {stats.overdue === 0 && stats.high > 0 && <p className="header-sub">{stats.high} high priority task{stats.high > 1 ? "s" : ""} need attention</p>}
            </div>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ New task</button>
        </header>

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
          {stats.overdue > 0 && (
            <div className="stat">
              <span className="stat-value overdue-value">{stats.overdue}</span>
              <span className="stat-label">Overdue</span>
            </div>
          )}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }} />
          </div>
        </div>

        {showForm && (
          <div className="form-overlay" onClick={() => setShowForm(false)}>
            <div className="task-form-card" onClick={(e) => e.stopPropagation()}>
              <h2>New Task</h2>
              <form onSubmit={createTask}>
                <div className="field">
                  <label>Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required autoFocus />
                </div>
                <div className="field">
                  <label>Description <span className="optional">(optional)</span></label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add more details..." rows={3} />
                </div>
                <div className="field">
                  <label>Tags <span className="optional">(optional)</span></label>
                  <TagInput tags={newTags} onChange={setNewTags} />
                </div>
                <div className="field">
                  <label>Due date <span className="optional">(optional)</span></label>
                  <input type="date" value={dueDate} min={todayStr} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div className="field">
                  <label>Priority</label>
                  <div className="priority-picker">
                    {(["low", "medium", "high"] as const).map((p) => (
                      <button key={p} type="button" className={`priority-btn priority-${p} ${priority === p ? "selected" : ""}`} onClick={() => setPriority(p)}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Adding..." : "Add task"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◈</div>
            <p>{activeTag ? `No tasks tagged #${activeTag}` : filter === "done" ? "No completed tasks yet" : "No tasks yet - add one!"}</p>
          </div>
        ) : (
          <ul className="task-list">
            {filtered.map((task) => (
              <li key={task.id} className={`task-item ${task.completed ? "completed" : ""} ${isOverdue(task) ? "overdue" : ""}`}>
                <button className="task-check" onClick={() => toggleComplete(task)}>{task.completed ? "✓" : ""}</button>
                <div className="task-body">
                  <div className="task-top">
                    <InlineEdit
                      value={task.title}
                      onSave={(val) => val && updateTask(task, { title: val })}
                      className="task-title"
                      placeholder="Title"
                    />
                    <span className={`priority-tag priority-${task.priority}`}>{task.priority}</span>
                  </div>
                  <InlineEdit
                    value={task.description || ""}
                    onSave={(val) => updateTask(task, { description: val })}
                    multiline
                    className="task-desc"
                    placeholder="Add a description..."
                  />
                  {task.tags && task.tags.length > 0 && (
                    <div className="task-tags">
                      {task.tags.map((tag) => (
                        <span key={tag} className="tag-chip" onClick={() => setActiveTag(activeTag === tag ? null : tag)}>#{tag}</span>
                      ))}
                    </div>
                  )}
                  {task.due_date && (
                    <p className={`task-due ${isOverdue(task) ? "task-due-overdue" : ""}`}>
                      {isOverdue(task) ? "⚠ " : "📅 "}{formatDueDate(task.due_date)}
                    </p>
                  )}
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