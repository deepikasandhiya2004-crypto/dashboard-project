import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  ExternalLink,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";
import { api } from "../lib/api.js";

const statuses = ["planning", "active", "completed"];

const statusBadge = {
  planning: "bg-purple/10 text-purple border-purple/20",
  active: "bg-brand/10 text-emerald-700 border-brand/20",
  completed: "bg-dark/10 text-dark border-dark/20",
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create project form/modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    status: "planning",
    progress: 0,
    startDate: "",
    dueDate: "",
  });

  // Edit project modal
  const [editingProject, setEditingProject] = useState(null);

  const loadProjects = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .getProjects({ search, status: statusFilter !== "all" ? statusFilter : undefined })
      .then((data) => setProjects(data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjects();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadProjects]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    try {
      const created = await api.createProject(newProject);
      setProjects((prev) => [created, ...prev]);
      setNewProject({
        name: "",
        client: "",
        status: "planning",
        progress: 0,
        startDate: "",
        dueDate: "",
      });
      setShowCreateModal(false);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editingProject) return;
    try {
      const updated = await api.updateProject(editingProject.id, editingProject);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      setEditingProject(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      const updated = await api.updateProject(id, { status });
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Are you sure you want to delete project "${name}"?`)) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark tracking-tight">Project / Delivery</h1>
          <p className="mt-1 text-sm text-dark/60">
            Track client delivery roadmaps, milestones, tasks, team members, and deliverables.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-dark transition-transform hover:brightness-95 active:scale-95"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dark/10 bg-white p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/40" />
          <input
            type="text"
            placeholder="Search by project or client name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-dark/10 bg-cream/30 py-2 pl-10 pr-4 text-xs text-dark outline-none focus:border-dark"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "planning", "active", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                statusFilter === st
                  ? "bg-dark text-white"
                  : "bg-dark/5 text-dark/60 hover:bg-dark/10 hover:text-dark"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      {loading && projects.length === 0 ? (
        <div className="rounded-2xl border border-dark/10 bg-white p-12 text-center text-sm text-dark/50">
          Loading projects from database...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-12 text-center">
          <FolderKanban size={36} className="mx-auto text-dark/30 mb-3" />
          <h3 className="text-base font-bold text-dark">No projects found</h3>
          <p className="mt-1 text-xs text-dark/50">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or status filter."
              : "Create your first project to start tracking milestones and delivery tasks."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-dark hover:brightness-95"
          >
            <Plus size={14} /> Create Project
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-dark/10 text-xs font-semibold text-dark/50 bg-cream/20">
                <th className="px-5 py-3.5">PROJECT</th>
                <th className="px-5 py-3.5">CLIENT</th>
                <th className="px-5 py-3.5">PROGRESS</th>
                <th className="px-5 py-3.5">TIMELINE</th>
                <th className="px-5 py-3.5">STATUS</th>
                <th className="px-5 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-dark/5 last:border-none hover:bg-dark/5 transition-colors">
                  {/* Name & Details Link */}
                  <td className="px-5 py-4">
                    <Link
                      to={`/projects/${p.id}`}
                      className="font-bold text-dark hover:text-purple flex items-center gap-1.5"
                    >
                      {p.name}
                      <ExternalLink size={13} className="text-dark/40" />
                    </Link>
                    <div className="text-xs text-dark/40 mt-0.5 flex gap-3">
                      <span>{p._count?.milestones || 0} milestones</span>
                      <span>{p._count?.tasks || 0} tasks</span>
                      <span>{p._count?.team || 0} team</span>
                    </div>
                  </td>

                  {/* Client */}
                  <td className="px-5 py-4 text-xs font-medium text-dark/70">
                    {p.client || "—"}
                  </td>

                  {/* Progress */}
                  <td className="px-5 py-4 min-w-[130px]">
                    <div className="flex items-center justify-between text-xs text-dark/60 mb-1">
                      <span>{p.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-dark/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(Math.max(p.progress || 0, 0), 100)}%`,
                          backgroundColor: p.progress === 100 ? "#00DC46" : "#7C3AED",
                        }}
                      />
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="px-5 py-4 text-xs text-dark/60">
                    {p.startDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-dark/40" />
                        <span>Start: {new Date(p.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {p.dueDate && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={12} className="text-orange" />
                        <span>Due: {new Date(p.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {!p.startDate && !p.dueDate && <span>—</span>}
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-5 py-4">
                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize outline-none cursor-pointer ${
                        statusBadge[p.status] || statusBadge.planning
                      }`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/projects/${p.id}`}
                        className="rounded-lg p-1.5 text-dark/50 hover:bg-dark/10 hover:text-dark"
                        title="Open Project Details"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        onClick={() =>
                          setEditingProject({
                            ...p,
                            startDate: p.startDate ? p.startDate.split("T")[0] : "",
                            dueDate: p.dueDate ? p.dueDate.split("T")[0] : "",
                          })
                        }
                        className="rounded-lg p-1.5 text-dark/50 hover:bg-dark/10 hover:text-dark"
                        title="Edit Project"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="rounded-lg p-1.5 text-dark/50 hover:bg-red-50 hover:text-red-600"
                        title="Delete Project"
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

      {/* ================= CREATE MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Create New Project</h3>
            <p className="text-xs text-dark/50 mt-1">Set up a new client delivery project with dates and milestones.</p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Redesign"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-dark/70">Client (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  value={newProject.client}
                  onChange={(e) => setNewProject({ ...newProject, client: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Initial Progress ({newProject.progress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newProject.progress}
                    onChange={(e) => setNewProject({ ...newProject, progress: e.target.value })}
                    className="mt-3 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Start Date</label>
                  <input
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Due Date</label>
                  <input
                    type="date"
                    value={newProject.dueDate}
                    onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
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
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Edit Project</h3>
            <form onSubmit={handleUpdate} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Project Name *</label>
                <input
                  type="text"
                  required
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-dark/70">Client</label>
                <input
                  type="text"
                  value={editingProject.client || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, client: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={editingProject.status}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Progress ({editingProject.progress || 0}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editingProject.progress || 0}
                    onChange={(e) => setEditingProject({ ...editingProject, progress: e.target.value })}
                    className="mt-3 w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Start Date</label>
                  <input
                    type="date"
                    value={editingProject.startDate || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Due Date</label>
                  <input
                    type="date"
                    value={editingProject.dueDate || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, dueDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
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

