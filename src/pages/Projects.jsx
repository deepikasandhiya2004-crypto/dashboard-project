import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import { api } from "../lib/api.js";

const statuses = ["planning", "active", "completed"];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [error, setError] = useState("");

  function load() {
    api.getProjects().then(setProjects).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await api.createProject({ name, client, status: "planning", progress: 0 });
      setProjects((prev) => [created, ...prev]);
      setName("");
      setClient("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleStatusChange(id, status) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    await api.updateProject(id, { status }).catch((e) => setError(e.message));
  }

  async function handleDelete(id) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await api.deleteProject(id).catch((e) => setError(e.message));
  }

  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Projects
      </h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <input
          type="text"
          placeholder="Client (optional)"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <button
          type="submit"
          className="rounded-full px-6 py-3 text-dark"
          style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
        >
          Add project
        </button>
      </form>

      <div className="mt-6">
        <DataTable
          columns={[
            { key: "name", label: "Project" },
            { key: "client", label: "Client", render: (r) => r.client || "—" },
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
                      {s}
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
          rows={projects}
        />
      </div>
    </div>
  );
}
