import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
  X,
  ExternalLink,
  CheckSquare,
} from "lucide-react";
import { api } from "../lib/api.js";
import { getUser } from "../lib/auth.js";

const statuses = ["todo", "in_progress", "done"];
const priorities = ["low", "medium", "high", "urgent"];

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange/10 text-orange",
  urgent: "bg-red-50 text-red-700",
};

export default function Tasks({ tab: propTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeTaskId } = useParams();
  const currentUser = getUser();

  // Tab: 'all' | 'my' | 'team'
  const currentTab = propTab || (location.pathname.includes("/tasks/my") ? "my" : location.pathname.includes("/tasks/team") ? "team" : "all");

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  // Modals & details
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: "",
    projectId: "",
    assignee: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
  });

  const loadData = useCallback(() => {
    setLoading(true);
    setError("");

    const params = {
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      projectId: projectFilter !== "all" ? projectFilter : undefined,
      assignee: assigneeFilter !== "all" ? assigneeFilter : undefined,
    };

    if (currentTab === "my") {
      params.my = "true";
    } else if (currentTab === "team") {
      params.team = "true";
    }

    Promise.all([api.getTasks(params), api.getProjects()])
      .then(([tasksData, projectsData]) => {
        setTasks(tasksData || []);
        setProjects(projectsData || []);

        if (routeTaskId) {
          const found = tasksData.find((t) => t.id === routeTaskId);
          if (found) setSelectedTask(found);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, priorityFilter, projectFilter, assigneeFilter, currentTab, routeTaskId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Unique assignees for filter
  const uniqueAssignees = Array.from(
    new Set(tasks.map((t) => t.assignee).filter(Boolean))
  );

  // Create Task
  async function handleCreateTask(e) {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      await api.createTask({
        ...taskForm,
        projectId: taskForm.projectId || null,
        dueDate: taskForm.dueDate || null,
      });
      setTaskForm({
        title: "",
        projectId: "",
        assignee: "",
        priority: "medium",
        status: "todo",
        dueDate: "",
      });
      setShowCreateModal(false);
      loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  // Update Task
  async function handleUpdateTask(e) {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      const updated = await api.updateTask(selectedTask.id, {
        title: selectedTask.title,
        projectId: selectedTask.projectId || null,
        assignee: selectedTask.assignee || null,
        priority: selectedTask.priority,
        status: selectedTask.status,
        dueDate: selectedTask.dueDate || null,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTask(updated);
      setShowEditModal(false);
    } catch (e) {
      setError(e.message);
    }
  }

  // Toggle Status
  async function handleStatusChange(id, status) {
    try {
      const updated = await api.updateTask(id, { status });
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: updated.status } : t)));
      if (selectedTask?.id === id) {
        setSelectedTask((prev) => ({ ...prev, status: updated.status }));
      }
    } catch (e) {
      setError(e.message);
    }
  }

  // Delete Task
  async function handleDeleteTask(id, title) {
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (selectedTask?.id === id) setSelectedTask(null);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-dark/60">
            Organize personal to-dos, team deliverables, and project task boards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-dark transition-transform hover:brightness-95 active:scale-95"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Tabs: All Tasks / My Tasks / Team Tasks */}
      <div className="flex border-b border-dark/10">
        <Link
          to="/tasks"
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            currentTab === "all" ? "border-dark text-dark" : "border-transparent text-dark/50 hover:text-dark"
          }`}
        >
          All Tasks
        </Link>
        <Link
          to="/tasks/my"
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            currentTab === "my" ? "border-dark text-dark" : "border-transparent text-dark/50 hover:text-dark"
          }`}
        >
          My Tasks {currentUser?.name ? `(${currentUser.name})` : ""}
        </Link>
        <Link
          to="/tasks/team"
          className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            currentTab === "team" ? "border-dark text-dark" : "border-transparent text-dark/50 hover:text-dark"
          }`}
        >
          Team Tasks
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-dark/10 bg-white p-4 space-y-3 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40" />
          <input
            type="text"
            placeholder="Search tasks by title or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-dark/10 bg-cream/30 py-2.5 pl-10 pr-4 text-xs text-dark outline-none focus:border-dark"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5 text-dark/50 font-semibold mr-1">
            <Filter size={14} /> Filters:
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-dark/15 bg-white px-2.5 py-1.5 font-medium text-dark outline-none focus:border-dark"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-dark/15 bg-white px-2.5 py-1.5 font-medium text-dark outline-none focus:border-dark"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* Assignee Filter */}
          {currentTab === "all" && uniqueAssignees.length > 0 && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-dark/15 bg-white px-2.5 py-1.5 font-medium text-dark outline-none focus:border-dark"
            >
              <option value="all">All Assignees</option>
              {uniqueAssignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}

          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-lg border border-dark/15 bg-white px-2.5 py-1.5 font-medium text-dark outline-none focus:border-dark"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {(search || statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all" || projectFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setAssigneeFilter("all");
                setProjectFilter("all");
              }}
              className="ml-auto text-xs text-orange font-medium hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Task List Table */}
      {loading && tasks.length === 0 ? (
        <div className="rounded-2xl border border-dark/10 bg-white p-12 text-center text-sm text-dark/50">
          Loading tasks from database...
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-12 text-center">
          <CheckSquare size={36} className="mx-auto text-dark/30 mb-3" />
          <h3 className="text-base font-bold text-dark">No tasks found</h3>
          <p className="mt-1 text-xs text-dark/50">
            {currentTab === "my"
              ? "You do not have any tasks assigned to your name yet."
              : currentTab === "team"
              ? "No team tasks found matching current filters."
              : "No organization tasks found. Create a task to get started."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-dark hover:brightness-95"
          >
            <Plus size={14} /> Create Task
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark/10 text-xs font-semibold text-dark/50 bg-cream/20">
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5">TASK</th>
                <th className="px-5 py-3.5">PROJECT</th>
                <th className="px-5 py-3.5">ASSIGNEE</th>
                <th className="px-5 py-3.5">PRIORITY</th>
                <th className="px-5 py-3.5">DUE DATE</th>
                <th className="px-5 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-dark/5 last:border-none hover:bg-dark/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedTask(t)}
                >
                  {/* Status Toggle */}
                  <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="rounded-full border border-dark/15 px-2.5 py-1 text-xs font-semibold capitalize outline-none cursor-pointer"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Title & Clickable Details */}
                  <td className="px-5 py-4">
                    <span className={`font-semibold text-dark ${t.status === "done" ? "line-through text-dark/40" : ""}`}>
                      {t.title}
                    </span>
                  </td>

                  {/* Project */}
                  <td className="px-5 py-4 text-xs font-medium text-dark/70">
                    {t.project ? (
                      <Link
                        to={`/projects/${t.project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple hover:underline"
                      >
                        {t.project.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Assignee */}
                  <td className="px-5 py-4 text-xs font-medium text-dark/80">
                    {t.assignee || "Unassigned"}
                  </td>

                  {/* Priority */}
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${priorityColors[t.priority] || priorityColors.medium}`}>
                      {t.priority}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className="px-5 py-4 text-xs text-dark/60">
                    {t.dueDate ? (
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-orange" />
                        <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedTask(t)}
                        className="rounded-lg p-1.5 text-dark/50 hover:bg-dark/10 hover:text-dark"
                        title="View Task Details"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTask(t);
                          setShowEditModal(true);
                        }}
                        className="rounded-lg p-1.5 text-dark/50 hover:bg-dark/10 hover:text-dark"
                        title="Edit Task"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        className="rounded-lg p-1.5 text-dark/50 hover:bg-red-50 hover:text-red-600"
                        title="Delete Task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= TASK DETAILS MODAL / VIEW ================= */}
      {selectedTask && !showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-dark/40">Task Details</span>
                <h3 className="text-xl font-bold text-dark mt-1">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="rounded-lg p-1 text-dark/40 hover:bg-dark/5 hover:text-dark"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-cream/30 p-4 text-xs">
              <div>
                <span className="text-dark/50">Project</span>
                <div className="font-semibold text-dark mt-0.5">
                  {selectedTask.project ? selectedTask.project.name : "None (General)"}
                </div>
              </div>

              <div>
                <span className="text-dark/50">Assignee</span>
                <div className="font-semibold text-dark mt-0.5">
                  {selectedTask.assignee || "Unassigned"}
                </div>
              </div>

              <div>
                <span className="text-dark/50">Priority</span>
                <div className="mt-1">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${priorityColors[selectedTask.priority] || priorityColors.medium}`}>
                    {selectedTask.priority}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-dark/50">Status</span>
                <div className="mt-1">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => handleStatusChange(selectedTask.id, e.target.value)}
                    className="rounded-full border border-dark/15 px-2.5 py-1 text-xs font-semibold capitalize outline-none cursor-pointer"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <span className="text-dark/50">Due Date</span>
                <div className="font-semibold text-dark mt-0.5 flex items-center gap-1">
                  <Clock size={12} className="text-orange" />
                  {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "No deadline"}
                </div>
              </div>

              <div>
                <span className="text-dark/50">Created Date</span>
                <div className="font-semibold text-dark mt-0.5">
                  {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-dark/10 pt-4">
              <button
                type="button"
                onClick={() => handleDeleteTask(selectedTask.id, selectedTask.title)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
              >
                <Trash2 size={14} /> Delete Task
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  <Edit2 size={14} /> Edit Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= CREATE TASK MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Create New Task</h3>
            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build client billing summary"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-dark/70">Project</label>
                <select
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                >
                  <option value="">No Project (General)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Assignee</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Smith"
                    value={taskForm.assignee}
                    onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT TASK MODAL ================= */}
      {showEditModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Edit Task</h3>
            <form onSubmit={handleUpdateTask} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Task Title *</label>
                <input
                  type="text"
                  required
                  value={selectedTask.title}
                  onChange={(e) => setSelectedTask({ ...selectedTask, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-dark/70">Project</label>
                <select
                  value={selectedTask.projectId || ""}
                  onChange={(e) => setSelectedTask({ ...selectedTask, projectId: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                >
                  <option value="">No Project (General)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Assignee</label>
                  <input
                    type="text"
                    value={selectedTask.assignee || ""}
                    onChange={(e) => setSelectedTask({ ...selectedTask, assignee: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Priority</label>
                  <select
                    value={selectedTask.priority}
                    onChange={(e) => setSelectedTask({ ...selectedTask, priority: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) => setSelectedTask({ ...selectedTask, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Due Date</label>
                  <input
                    type="date"
                    value={selectedTask.dueDate ? selectedTask.dueDate.split("T")[0] : ""}
                    onChange={(e) => setSelectedTask({ ...selectedTask, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

