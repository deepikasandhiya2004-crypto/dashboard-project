import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import { api } from "../lib/api.js";

const dealStages = ["prospecting", "negotiation", "won", "lost"];

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [error, setError] = useState("");

  // Client form
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");

  // Deal form
  const [dealTitle, setDealTitle] = useState("");
  const [dealClientId, setDealClientId] = useState("");
  const [dealValue, setDealValue] = useState("");

  function load() {
    Promise.all([api.getClients(), api.getDeals()])
      .then(([c, d]) => {
        setClients(c);
        setDeals(d);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  async function handleAddClient(e) {
    e.preventDefault();
    if (!clientName.trim()) return;
    try {
      const created = await api.createClient({ name: clientName, email: clientEmail, company: clientCompany });
      setClients((prev) => [created, ...prev]);
      setClientName("");
      setClientEmail("");
      setClientCompany("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeleteClient(id) {
    setError("");
    try {
      await api.deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      setDeals((prev) => prev.filter((d) => d.clientId !== id)); // deals cascade-delete on the backend too
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAddDeal(e) {
    e.preventDefault();
    if (!dealTitle.trim() || !dealClientId) return;
    try {
      const created = await api.createDeal({
        title: dealTitle,
        clientId: dealClientId,
        value: Number(dealValue) || 0,
        stage: "prospecting",
      });
      setDeals((prev) => [created, ...prev]);
      setDealTitle("");
      setDealClientId("");
      setDealValue("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleStageChange(id, stage) {
    const previous = deals;
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    try {
      await api.updateDeal(id, { stage });
    } catch (e) {
      setError(e.message);
      setDeals(previous);
    }
  }

  async function handleDeleteDeal(id) {
    setError("");
    try {
      await api.deleteDeal(id);
      setDeals((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  function clientName_(clientId) {
    return clients.find((c) => c.id === clientId)?.name || "—";
  }

  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Clients
      </h1>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleAddClient} className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Client name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <input
          type="email"
          placeholder="Email (optional)"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <input
          type="text"
          placeholder="Company (optional)"
          value={clientCompany}
          onChange={(e) => setClientCompany(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <button
          type="submit"
          className="rounded-full px-6 py-3 text-dark"
          style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
        >
          Add client
        </button>
      </form>

      <div className="mt-6">
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email", render: (r) => r.email || "—" },
            { key: "company", label: "Company", render: (r) => r.company || "—" },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <button onClick={() => handleDeleteClient(r.id)} className="text-dark/40 hover:text-dark">
                  Delete
                </button>
              ),
            },
          ]}
          rows={clients}
        />
      </div>

      <h2 className="mt-10 text-xl text-dark" style={{ fontWeight: 800 }}>
        Deals
      </h2>

      <form onSubmit={handleAddDeal} className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          placeholder="Deal title"
          value={dealTitle}
          onChange={(e) => setDealTitle(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />
        <select
          value={dealClientId}
          onChange={(e) => setDealClientId(e.target.value)}
          className="flex-1 rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        >
          <option value="">Select client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Value ($)"
          value={dealValue}
          onChange={(e) => setDealValue(e.target.value)}
          className="w-full rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark md:w-40"
        />
        <button
          type="submit"
          disabled={!clients.length}
          className="rounded-full px-6 py-3 text-dark disabled:opacity-50"
          style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
        >
          Add deal
        </button>
      </form>
      {!clients.length && (
        <p className="mt-2 text-xs text-dark/50">Add a client above before creating a deal.</p>
      )}

      <div className="mt-6">
        <DataTable
          columns={[
            { key: "title", label: "Deal" },
            { key: "clientId", label: "Client", render: (r) => r.client?.name || clientName_(r.clientId) },
            {
              key: "stage",
              label: "Stage",
              render: (r) => (
                <select
                  value={r.stage}
                  onChange={(e) => handleStageChange(r.id, e.target.value)}
                  className="rounded-full border border-dark/15 px-3 py-1.5 text-xs capitalize"
                >
                  {dealStages.map((s) => (
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
                <button onClick={() => handleDeleteDeal(r.id)} className="text-dark/40 hover:text-dark">
                  Delete
                </button>
              ),
            },
          ]}
          rows={deals}
        />
      </div>
    </div>
  );
}