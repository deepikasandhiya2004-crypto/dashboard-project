import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Users,
  FileText,
  MessageSquare,
  Activity as ActivityIcon,
  CheckSquare,
  Flag,
  Star,
  ExternalLink,
} from "lucide-react";
import { api } from "../lib/api.js";

const statusColors = {
  planning: "bg-purple/10 text-purple border-purple/20",
  active: "bg-brand/10 text-emerald-700 border-brand/20",
  completed: "bg-dark/10 text-dark border-dark/20",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange/10 text-orange",
  urgent: "bg-red-50 text-red-700",
};

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("milestones");

  // Modals / forms
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", client: "", status: "planning", progress: 0, startDate: "", dueDate: "" });

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDue, setMilestoneDue] = useState("");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", assignee: "", priority: "medium", status: "todo", dueDate: "" });

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", role: "Developer" });

  const [showFileModal, setShowFileModal] = useState(false);
  const [fileForm, setFileForm] = useState({ name: "", size: "1.2 MB", type: "PDF" });

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ clientName: "", rating: 5, comment: "" });

  const loadProject = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .getProject(id)
      .then((data) => {
        setProject(data);
        setEditForm({
          name: data.name,
          client: data.client || "",
          status: data.status,
          progress: data.progress || 0,
          startDate: data.startDate ? data.startDate.split("T")[0] : "",
          dueDate: data.dueDate ? data.dueDate.split("T")[0] : "",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Project update
  async function handleUpdateProject(e) {
    e.preventDefault();
    try {
      await api.updateProject(id, editForm);
      setShowEditModal(false);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete project
  async function handleDeleteProject() {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) return;
    try {
      await api.deleteProject(id);
      navigate("/projects");
    } catch (err) {
      setError(err.message);
    }
  }

  // Milestone actions
  async function handleAddMilestone(e) {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    try {
      await api.addMilestone(id, { title: milestoneTitle, dueDate: milestoneDue || null, status: "pending" });
      setMilestoneTitle("");
      setMilestoneDue("");
      setShowMilestoneModal(false);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleMilestone(m) {
    const nextStatus = m.status === "completed" ? "pending" : "completed";
    try {
      await api.updateMilestone(m.id, { status: nextStatus });
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteMilestone(mId) {
    if (!window.confirm("Delete this milestone?")) return;
    try {
      await api.deleteMilestone(mId);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  // Task actions
  async function handleAddTask(e) {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    try {
      await api.createTask({ ...taskForm, projectId: id });
      setTaskForm({ title: "", assignee: "", priority: "medium", status: "todo", dueDate: "" });
      setShowTaskModal(false);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleTaskStatus(tId, currentStatus) {
    const nextStatus = currentStatus === "done" ? "todo" : "done";
    try {
      await api.updateTask(tId, { status: nextStatus });
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTask(tId) {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.deleteTask(tId);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  // Team actions
  async function handleAddTeam(e) {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    try {
      await api.addTeamMember(id, teamForm);
      setTeamForm({ name: "", role: "Developer" });
      setShowTeamModal(false);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTeam(memberId) {
    if (!window.confirm("Remove this team member from the project?")) return;
    try {
      await api.deleteTeamMember(id, memberId);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  // File actions
  async function handleAddFile(e) {
    e.preventDefault();
    if (!fileForm.name.trim()) return;
    try {
      await api.addProjectFile(id, fileForm);
      setFileForm({ name: "", size: "1.2 MB", type: "PDF" });
      setShowFileModal(false);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteFile(fileId) {
    if (!window.confirm("Remove this file entry?")) return;
    try {
      await api.deleteProjectFile(id, fileId);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  // Feedback actions
  async function handleAddFeedback(e) {
    e.preventDefault();
    if (!feedbackForm.clientName.trim() || !feedbackForm.comment.trim()) return;
    try {
      await api.addClientFeedback(id, feedbackForm);
      setFeedbackForm({ clientName: "", rating: 5, comment: "" });
      setShowFeedbackModal(false);
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-dark/60">Loading project details...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div>
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-dark/60 hover:text-dark mb-4">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Unable to load project</p>
          <p className="text-sm mt-1">{error || "Project not found in database."}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "milestones", label: "Milestones", count: project.milestones?.length || 0, icon: Flag },
    { id: "tasks", label: "Tasks", count: project.tasks?.length || 0, icon: CheckSquare },
    { id: "team", label: "Team", count: project.team?.length || 0, icon: Users },
    { id: "files", label: "Files", count: project.files?.length || 0, icon: FileText },
    { id: "feedback", label: "Client Feedback", count: project.feedbacks?.length || 0, icon: MessageSquare },
    { id: "activity", label: "Activity", count: project.activities?.length || 0, icon: ActivityIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar / Back */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-dark/60 hover:text-dark">
          <ArrowLeft size={16} /> Back to Projects
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 rounded-full border border-dark/15 px-4 py-2 text-xs font-semibold text-dark hover:bg-black/5"
          >
            <Edit2 size={14} /> Edit Project
          </button>
          <button
            onClick={handleDeleteProject}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-dark">{project.name}</h1>
              <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-semibold capitalize ${statusColors[project.status] || statusColors.planning}`}>
                {project.status}
              </span>
            </div>
            {project.client && (
              <p className="mt-1 text-sm text-dark/60">
                Client: <span className="font-medium text-dark">{project.client}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-dark/70">
            {project.startDate && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-dark/40" />
                <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
              </div>
            )}
            {project.dueDate && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange" />
                <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 border-t border-dark/5 pt-4">
          <div className="flex items-center justify-between text-xs text-dark/60 mb-2">
            <span>Overall Progress</span>
            <span className="font-bold text-dark">{project.progress || 0}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-dark/10">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(Math.max(project.progress || 0, 0), 100)}%`,
                backgroundColor: project.progress === 100 ? "#00DC46" : "#7C3AED",
              }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-dark/10 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                isActive ? "border-dark text-dark" : "border-transparent text-dark/50 hover:text-dark"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${isActive ? "bg-dark text-white" : "bg-dark/10 text-dark/70"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* ================= MILESTONES ================= */}
        {activeTab === "milestones" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark">Project Milestones</h2>
              <button
                onClick={() => setShowMilestoneModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-dark hover:brightness-95"
              >
                <Plus size={14} /> Add Milestone
              </button>
            </div>

            {(!project.milestones || project.milestones.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-8 text-center text-dark/50">
                No milestones added yet. Add key targets and roadmap phases for this project.
              </div>
            ) : (
              <div className="space-y-2">
                {project.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-dark/10 bg-white p-4 transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleMilestone(m)}
                        title={m.status === "completed" ? "Mark pending" : "Mark completed"}
                        className={`rounded-full p-1 transition-colors ${
                          m.status === "completed" ? "text-emerald-600 bg-emerald-50" : "text-dark/30 hover:text-dark"
                        }`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <div>
                        <div className={`text-sm font-semibold text-dark ${m.status === "completed" ? "line-through text-dark/50" : ""}`}>
                          {m.title}
                        </div>
                        {m.dueDate && (
                          <div className="text-xs text-dark/40 mt-0.5">
                            Target Date: {new Date(m.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          m.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-purple/10 text-purple"
                        }`}
                      >
                        {m.status}
                      </span>
                      <button
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="text-dark/30 hover:text-red-600"
                        title="Delete milestone"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= PROJECT TASKS ================= */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark">Project Tasks</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-dark hover:brightness-95"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>

            {(!project.tasks || project.tasks.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-8 text-center text-dark/50">
                No tasks assigned to this project yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-dark/10 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-dark/10 text-xs font-semibold text-dark/50">
                      <th className="px-5 py-3">STATUS</th>
                      <th className="px-5 py-3">TITLE</th>
                      <th className="px-5 py-3">ASSIGNEE</th>
                      <th className="px-5 py-3">PRIORITY</th>
                      <th className="px-5 py-3">DUE DATE</th>
                      <th className="px-5 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.tasks.map((t) => (
                      <tr key={t.id} className="border-b border-dark/5 last:border-none hover:bg-dark/5">
                        <td className="px-5 py-3">
                          <button
                            onClick={() => handleToggleTaskStatus(t.id, t.status)}
                            className="inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2
                              size={18}
                              className={t.status === "done" ? "text-emerald-600" : "text-dark/30 hover:text-dark"}
                            />
                            <span className="text-xs capitalize font-medium text-dark/70">
                              {t.status.replace("_", " ")}
                            </span>
                          </button>
                        </td>
                        <td className="px-5 py-3 font-semibold text-dark">
                          <Link to={`/tasks`} className="hover:underline">
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-dark/70">{t.assignee || "Unassigned"}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${priorityColors[t.priority] || priorityColors.medium}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-dark/60 text-xs">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="text-dark/30 hover:text-red-600"
                            title="Delete task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TEAM ================= */}
        {activeTab === "team" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark">Team Members</h2>
              <button
                onClick={() => setShowTeamModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-dark hover:brightness-95"
              >
                <Plus size={14} /> Add Member
              </button>
            </div>

            {(!project.team || project.team.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-8 text-center text-dark/50">
                No team members assigned to this project yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {project.team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-xl border border-dark/10 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark text-white font-bold text-sm">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-dark">{member.name}</div>
                        <div className="text-xs text-dark/50">{member.role}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTeam(member.id)}
                      className="text-dark/30 hover:text-red-600"
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= FILES ================= */}
        {activeTab === "files" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-dark">Project Files</h2>
                <p className="text-xs text-dark/50">Manage document and attachment metadata for this project.</p>
              </div>
              <button
                onClick={() => setShowFileModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-dark hover:brightness-95"
              >
                <Plus size={14} /> Add File Record
              </button>
            </div>

            {(!project.files || project.files.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-8 text-center text-dark/50">
                No file records linked to this project yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-dark/10 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-dark/10 text-xs font-semibold text-dark/50">
                      <th className="px-5 py-3">FILE NAME</th>
                      <th className="px-5 py-3">TYPE</th>
                      <th className="px-5 py-3">SIZE</th>
                      <th className="px-5 py-3">DATE ADDED</th>
                      <th className="px-5 py-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.files.map((file) => (
                      <tr key={file.id} className="border-b border-dark/5 last:border-none hover:bg-dark/5">
                        <td className="px-5 py-3 font-semibold text-dark flex items-center gap-2">
                          <FileText size={16} className="text-purple" />
                          {file.name}
                        </td>
                        <td className="px-5 py-3 text-xs uppercase font-medium text-dark/60">{file.type || "DOC"}</td>
                        <td className="px-5 py-3 text-xs text-dark/60">{file.size || "—"}</td>
                        <td className="px-5 py-3 text-xs text-dark/50">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-dark/30 hover:text-red-600"
                            title="Remove file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= CLIENT FEEDBACK ================= */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-dark">Client Feedback</h2>
                <p className="text-xs text-dark/50">Review client ratings, testimonials, and delivery evaluations.</p>
              </div>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-dark hover:brightness-95"
              >
                <Plus size={14} /> Add Feedback
              </button>
            </div>

            {(!project.feedbacks || project.feedbacks.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-8 text-center text-dark/50">
                No client feedback recorded yet for this project.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {project.feedbacks.map((fb) => (
                  <div key={fb.id} className="rounded-xl border border-dark/10 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-dark text-sm">{fb.clientName}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < fb.rating ? "currentColor" : "none"}
                            className={i < fb.rating ? "text-amber-500" : "text-gray-300"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-dark/80 italic">&ldquo;{fb.comment}&rdquo;</p>
                    <div className="text-xs text-dark/40 flex items-center justify-between border-t border-dark/5 pt-2">
                      <span>Status: {fb.status}</span>
                      <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= ACTIVITY ================= */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-dark">Project Activity & History</h2>

            {(!project.activities || project.activities.length === 0) ? (
              <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-8 text-center text-dark/50">
                No activity logged yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark/10">
                {project.activities.map((act) => (
                  <div key={act.id} className="relative flex items-start gap-4">
                    <span className="absolute -left-6 mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-dark text-white ring-4 ring-cream" />
                    <div>
                      <div className="text-sm font-semibold text-dark">{act.action}</div>
                      <div className="text-xs text-dark/50 mt-0.5">
                        By <span className="font-medium text-dark/70">{act.user}</span> &bull;{" "}
                        {new Date(act.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Edit Project</h3>
            <form onSubmit={handleUpdateProject} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Project Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/70">Client</label>
                <input
                  type="text"
                  value={editForm.client}
                  onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Progress ({editForm.progress}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(e) => setEditForm({ ...editForm, progress: e.target.value })}
                    className="mt-3 w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Start Date</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Due Date</label>
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
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

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Add Milestone</h3>
            <form onSubmit={handleAddMilestone} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Approval"
                  value={milestoneTitle}
                  onChange={(e) => setMilestoneTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/70">Target Date</label>
                <input
                  type="date"
                  value={milestoneDue}
                  onChange={(e) => setMilestoneDue(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Create Project Task</h3>
            <form onSubmit={handleAddTask} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireframe responsive layouts"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">Assignee</label>
                  <input
                    type="text"
                    placeholder="Assignee name"
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
              <div>
                <label className="text-xs font-semibold text-dark/70">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
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

      {/* Add Team Member Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Add Team Member</h3>
            <form onSubmit={handleAddTeam} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Member Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/70">Project Role</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Designer / Tech Lead"
                  value={teamForm.role}
                  onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add File Record Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Add Project File Record</h3>
            <p className="text-xs text-dark/50 mt-1">Record metadata for project document, specifications, or asset.</p>
            <form onSubmit={handleAddFile} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project_Brief_v1.pdf"
                  value={fileForm.name}
                  onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-dark/70">File Type</label>
                  <input
                    type="text"
                    placeholder="PDF, Figma, DOCX"
                    value={fileForm.type}
                    onChange={(e) => setFileForm({ ...fileForm, type: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-dark/70">Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 2.4 MB"
                    value={fileForm.size}
                    onChange={(e) => setFileForm({ ...fileForm, size: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-dark">Add Client Feedback</h3>
            <form onSubmit={handleAddFeedback} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-dark/70">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins (Acme Corp)"
                  value={feedbackForm.clientName}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, clientName: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/70">Rating (1 to 5 Stars)</label>
                <select
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: parseInt(e.target.value, 10) })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                >
                  <option value={5}>5 Stars - Outstanding</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Satisfactory</option>
                  <option value={2}>2 Stars - Needs Improvement</option>
                  <option value={1}>1 Star - Unsatisfactory</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-dark/70">Feedback Comments</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share feedback on delivery quality, milestones, or responsiveness..."
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-dark/15 px-3 py-2 text-sm outline-none focus:border-dark"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-dark/10">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-dark/60 hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-6 py-2 text-xs font-bold text-dark hover:brightness-95"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
