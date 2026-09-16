import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import { api } from "../lib/api.js";

const statuses = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  function load() {
    api.getLeads().then(setLeads).catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const created = await api.createLead({ name, email, source, status: "new", value: 0 });
      setLeads((prev) => [created, ...prev]);
      setName("");
      setEmail("");
      setSource("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleStatusChange(id, status) {
    const previous = leads;
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await api.updateLead(id, { status });
    } catch (e) {
      setError(e.message);
      setLeads(previous);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Leads
      </h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Lead name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <input
          type="text"
          placeholder="Source (optional)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <button
          type="submit"
          className="rounded-full px-6 py-3 text-dark"
          style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
        >
          Add lead
        </button>
      </form>

      <div className="mt-6">
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email", render: (r) => r.email || "—" },
            { key: "source", label: "Source", render: (r) => r.source || "—" },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  className="rounded-full border border-dark/15 px-3 py-1.5 text-xs capitalize"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ),
            },
            { key: "value", label: "Value", render: (r) => `$${(r.value || 0).toLocaleString()}` },
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
          rows={leads}
        />
      </div>
    </div>
  );
}