import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import { api } from "../lib/api.js";

const proposalStatuses = ["draft", "sent", "accepted", "rejected"];

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [dealId, setDealId] = useState("");
  const [value, setValue] = useState("");

  function load() {
    Promise.all([api.getProposals(), api.getClients(), api.getDeals()])
      .then(([p, c, d]) => {
        setProposals(p);
        setClients(c);
        setDeals(d);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim() || !clientId) return;
    try {
      const created = await api.createProposal({
        title,
        clientId,
        dealId: dealId || null,
        value: Number(value) || 0,
        status: "draft",
      });
      setProposals((prev) => [created, ...prev]);
      setTitle("");
      setClientId("");
      setDealId("");
      setValue("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleStatusChange(id, status) {
    const previous = proposals;
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await api.updateProposal(id, { status });
    } catch (e) {
      setError(e.message);
      setProposals(previous);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await api.deleteProposal(id);
      setProposals((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  function clientName(id) {
    return clients.find((c) => c.id === id)?.name || "—";
  }

  const dealsForClient = deals.filter((d) => d.clientId === clientId);

  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Proposals
      </h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Proposal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <select
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setDealId("");
          }}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        >
          <option value="">Select client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={dealId}
          onChange={(e) => setDealId(e.target.value)}
          disabled={!clientId}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark disabled:opacity-50"
        >
          <option value="">Link to deal (optional)</option>
          {dealsForClient.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Value ($)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark md:w-40"
        />
        <button
          type="submit"
          disabled={!clients.length}
          className="rounded-full px-6 py-3 text-dark disabled:opacity-50"
          style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
        >
          Add proposal
        </button>
      </form>
      {!clients.length && (
        <p className="mt-2 text-xs text-dark/50">Add a client on the Clients page first.</p>
      )}

      <div className="mt-6">
        <DataTable
          columns={[
            { key: "title", label: "Proposal" },
            { key: "clientId", label: "Client", render: (r) => r.client?.name || clientName(r.clientId) },
            { key: "dealId", label: "Deal", render: (r) => r.deal?.title || "—" },
            { key: "value", label: "Value", render: (r) => `$${(r.value || 0).toLocaleString()}` },
            {
              key: "status",
              label: "Status",
              render: (r) => (
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value)}
                  className="rounded-full border border-dark/15 px-3 py-1.5 text-xs capitalize"
                >
                  {proposalStatuses.map((s) => (
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
          rows={proposals}
        />
      </div>
    </div>
  );
}