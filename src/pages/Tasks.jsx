import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import { api } from "../lib/api.js";

const statuses = ["todo", "in_progress", "done"];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState("");

  function load() {
    api.getTasks().then(setTasks).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const created = await api.createTask({ title, assignee, status: "todo" });
      setTasks((prev) => [created, ...prev]);
      setTitle("");
      setAssignee("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleStatusChange(id, status) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    await api.updateTask(id, { status }).catch((e) => setError(e.message));
  }

  async function handleDelete(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api.deleteTask(id).catch((e) => setError(e.message));
  }

  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Tasks
      </h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <input
          type="text"
          placeholder="Assignee name"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <button
          type="submit"
          className="rounded-full px-6 py-3 text-dark"
          style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
        >
          Add task
        </button>
      </form>

      <div className="mt-6">
        <DataTable
          columns={[
            { key: "title", label: "Task" },
            { key: "assignee", label: "Assignee", render: (r) => r.assignee || "Unassigned" },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  className="rounded-full border border-dark/15 px-3 py-1.5 text-xs"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <button onClick={() => handleDelete(r.id)} className="text-dark/40 hover:text-dark">
                  Delete
                </button>
              ),
            },
          ]}
          rows={tasks}
        />
      </div>
    </div>
  );
}
