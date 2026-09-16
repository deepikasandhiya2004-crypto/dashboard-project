import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const types = ["call", "email", "meeting", "note"];

export default function ActivityLog({ leadId, clientId, dealId }) {
  const [activities, setActivities] = useState([]);
  const [type, setType] = useState("note");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function load() {
    api
      .getActivities()
      .then((all) =>
        setActivities(
          all.filter(
            (a) =>
              (leadId && a.leadId === leadId) ||
              (clientId && a.clientId === clientId) ||
              (dealId && a.dealId === dealId)
          )
        )
      )
      .catch((e) => setError(e.message));
  }

  useEffect(load, [leadId, clientId, dealId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!subject.trim()) return;
    try {
      const created = await api.createActivity({ type, subject, notes, leadId, clientId, dealId });
      setActivities((prev) => [created, ...prev]);
      setSubject("");
      setNotes("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="rounded-2xl border border-dark/10 bg-white p-4">
      <h3 className="text-sm font-bold text-dark">Activity Log</h3>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <form onSubmit={handleAdd} className="mt-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-dark/15 px-2 py-1.5 text-xs capitalize"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Subject (e.g. Called about pricing)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 rounded-lg border border-dark/15 px-2 py-1.5 text-xs"
          />
        </div>
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-lg border border-dark/15 px-2 py-1.5 text-xs"
        />
        <button
          type="submit"
          className="self-start rounded-full px-4 py-1.5 text-xs text-dark"
          style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
        >
          Log activity
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-3">
        {activities.length === 0 && <p className="text-xs text-dark/40">No activity logged yet.</p>}
        {activities.map((a) => (
          <div key={a.id} className="flex items-start justify-between border-b border-dark/5 pb-2 text-xs">
            <div>
              <span className="capitalize font-semibold text-dark">{a.type}</span> — {a.subject}
              {a.notes && <div className="mt-0.5 text-dark/50">{a.notes}</div>}
              <div className="mt-0.5 text-dark/35">{new Date(a.createdAt).toLocaleString()}</div>
            </div>
            <button onClick={() => handleDelete(a.id)} className="text-dark/30 hover:text-dark">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}