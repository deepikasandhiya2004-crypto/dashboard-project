import { useEffect, useState } from "react";
import StatCard from "../components/StatCard.jsx";
import ChartCard from "../components/ChartCard.jsx";
import DataTable from "../components/DataTable.jsx";
import { api } from "../lib/api.js";

// Sample trend data for the chart — swap for a real /api/stats endpoint
// once you're tracking revenue or signups in the database.
const sampleTrend = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 19 },
  { label: "Wed", value: 14 },
  { label: "Thu", value: 26 },
  { label: "Fri", value: 22 },
  { label: "Sat", value: 30 },
  { label: "Sun", value: 27 },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getTasks(), api.getProjects()])
      .then(([t, p]) => {
        setTasks(t);
        setProjects(p);
      })
      .catch((e) => setError(e.message));
  }, []);

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Dashboard
      </h1>

      {error && (
        <p className="mt-4 rounded-lg bg-orange/10 px-4 py-3 text-sm text-dark">
          Couldn't reach the API ({error}). Is the server running on port 4000?
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active projects" value={projects.length} color="#00DC46" />
        <StatCard label="Open tasks" value={tasks.length - doneCount} color="#7C3AED" />
        <StatCard label="Completed tasks" value={doneCount} color="#FF6A3D" />
        <StatCard label="Team members" value={5} change="Set this up in Settings" color="#00373A" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Weekly activity (sample data)" data={sampleTrend} />
        </div>
        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <h3 className="text-dark" style={{ fontWeight: 700 }}>
            Recent projects
          </h3>
          <ul className="mt-4 flex flex-col gap-3">
            {projects.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-dark" style={{ fontWeight: 600 }}>
                  {p.name}
                </span>
                <span className="text-dark/50">{p.status}</span>
              </li>
            ))}
            {projects.length === 0 && <li className="text-sm text-dark/40">No projects yet.</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-dark" style={{ fontWeight: 700 }}>
          Recent tasks
        </h3>
        <DataTable
          columns={[
            { key: "title", label: "Task" },
            { key: "assignee", label: "Assignee" },
            { key: "status", label: "Status" },
            { key: "dueDate", label: "Due", render: (r) => (r.dueDate ? r.dueDate.slice(0, 10) : "—") },
          ]}
          rows={tasks.slice(0, 6)}
        />
      </div>
    </div>
  );
}
