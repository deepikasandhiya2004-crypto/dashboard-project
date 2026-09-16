import { useEffect, useMemo, useState } from "react";

import {
  MoreHorizontal,
  Clock3,
  DollarSign,
  Plus,
  CalendarDays,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { api } from "../lib/api.js";

const statusColors = {
  new: "#7C3AED",
  contacted: "#5BA8EF",
  qualified: "#FF6A3D",
  proposal: "#00DC46",
  won: "#00C853",
  lost: "#E00000",
};

const projectStatusColors = {
  planning: "#5BA8EF",
  active: "#7C3AED",
  completed: "#00C853",
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getTasks(), api.getProjects(), api.getLeads()])
      .then(([t, p, l]) => {
        setTasks(t);
        setProjects(p);
        setLeads(l);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const openTasks = tasks.filter((t) => t.status !== "done").length;

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "new").length;
  const contactedLeads = leads.filter((l) => l.status === "contacted").length;
  const qualifiedLeads = leads.filter((l) => l.status === "qualified").length;
  const revenue = leads
    .filter((l) => l.status === "won")
    .reduce((sum, l) => sum + (l.value || 0), 0);

  // Lead pipeline breakdown for the donut — real counts per status, no invented buckets.
  const leadStatusOrder = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  const pipelineData = useMemo(() => {
    return leadStatusOrder
      .map((status) => ({
        name: status,
        value: leads.filter((l) => l.status === status).length,
      }))
      .filter((d) => d.value > 0);
  }, [leads]);

  // Project status breakdown — only the 3 statuses that actually exist on Project.
  const projectStatusData = useMemo(() => {
    return ["planning", "active", "completed"]
      .map((status) => ({
        name: status,
        value: projects.filter((p) => p.status === status).length,
      }));
  }, [projects]);

  // Trend of projects created, grouped by day, last 14 days with any activity.
  const trendData = useMemo(() => {
    const byDay = {};
    projects.forEach((p) => {
      const day = new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDay[day] = (byDay[day] || 0) + 1;
    });
    return Object.entries(byDay).map(([label, value]) => ({ label, value }));
  }, [projects]);

  // Recent activity — combine the 5 most recently created records across projects/tasks/leads.
  const activity = useMemo(() => {
    const items = [
      ...projects.map((p) => ({ text: `Project "${p.name}" created`, date: p.createdAt, icon: "project" })),
      ...tasks.map((t) => ({ text: `Task "${t.title}" created`, date: t.createdAt, icon: "task" })),
      ...leads.map((l) => ({ text: `Lead "${l.name}" added`, date: l.createdAt, icon: "lead" })),
    ];
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  }, [projects, tasks, leads]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
      .slice(0, 4);
  }, [tasks]);

  const recentLeads = useMemo(() => leads.slice(0, 4), [leads]);

  return (
    <div style={{ minHeight: "100%", background: "#F7F5E9", color: "#00373A", paddingBottom: "30px" }}>
      <div style={{ marginBottom: "18px" }}>
        <h1 style={{ margin: 0, fontSize: "34px", lineHeight: "40px", color: "#202020", fontWeight: 800, letterSpacing: "-0.8px" }}>
          Dashboard
        </h1>
        <p style={{ margin: "2px 0 0", fontSize: "15px", lineHeight: "20px", color: "rgba(0,55,58,0.40)" }}>
          Live data from your database
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "10px", background: "rgba(255,106,61,0.10)", fontSize: "13px", color: "#00373A" }}>
          Couldn't reach the API: {error}. Is the server running on port 4000?
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: "13px", color: "rgba(0,55,58,0.5)" }}>Loading dashboard...</p>
      ) : (
        <>
          {/* STAT CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "14px", marginBottom: "16px" }}>
            <StatCardSimple label="Total Leads" value={totalLeads} color="#7C3AED" />
            <StatCardSimple label="New Leads" value={newLeads} color="#00DC46" />
            <StatCardSimple label="Contacted" value={contactedLeads} color="#FF643F" />
            <StatCardSimple label="Qualified" value={qualifiedLeads} color="#7C3AED" />
            <StatCardSimple label="Revenue (Won)" value={`$${revenue.toLocaleString()}`} color="#00C853" />
          </div>

          {/* FIRST ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1.45fr) minmax(280px, 1.45fr)", gap: "10px", marginBottom: "10px" }}>
            {/* PROJECT ACTIVITY TREND */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Projects Created Over Time</h3>
              <div style={{ width: "100%", height: "220px", marginTop: "10px" }}>
                {trendData.length === 0 ? (
                  <EmptyState text="No projects yet — add one on the Projects page." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,55,58,0.1)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* LEAD PIPELINE DONUT */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={cardTitleStyle}>Lead Pipeline</h3>
                <MoreHorizontal size={20} strokeWidth={2} color="rgba(0,55,58,0.45)" />
              </div>

              {pipelineData.length === 0 ? (
                <EmptyState text="No leads yet." />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "145px 1fr", alignItems: "center", columnGap: "10px", marginTop: "8px" }}>
                  <div style={{ position: "relative", width: "145px", height: "175px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={70} startAngle={90} endAngle={-270} paddingAngle={1} stroke="#FAF9F0" strokeWidth={1}>
                          {pipelineData.map((entry) => (
                            <Cell key={entry.name} fill={statusColors[entry.name] || "#999"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <div style={{ fontSize: "13px", color: "#202020", fontWeight: 500 }}>{totalLeads}</div>
                      <div style={{ marginTop: "2px", fontSize: "11px", color: "#202020" }}>Total Leads</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
                    {pipelineData.map((item) => (
                      <div key={item.name} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <span style={{ width: "10px", height: "10px", minWidth: "10px", borderRadius: "50%", background: statusColors[item.name] || "#999", marginTop: "4px" }} />
                        <div>
                          <div style={{ fontSize: "13px", color: "#202020", fontWeight: 500, textTransform: "capitalize" }}>{item.name}</div>
                          <div style={{ fontSize: "11px", color: "#202020" }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* UPCOMING TASKS */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={cardTitleStyle}>Upcoming Tasks</h3>
                <Clock3 size={18} color="rgba(0,55,58,0.45)" />
              </div>
              <div style={{ marginTop: "17px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {upcomingTasks.length === 0 ? (
                  <EmptyState text="No open tasks." />
                ) : (
                  upcomingTasks.map((t) => (
                    <TaskItem
                      key={t.id}
                      title={t.title}
                      date={t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}
                      status={t.priority}
                      color={t.priority === "high" ? "#7C3AED" : t.priority === "low" ? "#FF643F" : "#00C853"}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* SECOND ROW */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1.45fr) minmax(280px, 1.45fr)", gap: "10px" }}>
            {/* RECENT LEADS */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Recent Leads</h3>
              {recentLeads.length === 0 ? (
                <EmptyState text="No leads yet." />
              ) : (
                <div style={{ width: "100%", overflowX: "auto", marginTop: "12px" }}>
                  <table style={{ width: "100%", minWidth: "560px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={tableHeadStyle}>LEAD NAME</th>
                        <th style={tableHeadStyle}>SOURCE</th>
                        <th style={tableHeadStyle}>STATUS</th>
                        <th style={{ ...tableHeadStyle, textAlign: "right" }}>VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLeads.map((l) => (
                        <LeadRow key={l.id} name={l.name} source={l.source || "—"} status={l.status} value={`$${(l.value || 0).toLocaleString()}`} color={statusColors[l.status] || "#999"} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PROJECT STATUS BREAKDOWN */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Project Status</h3>
              {projects.length === 0 ? (
                <EmptyState text="No projects yet." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "14px" }}>
                  {projectStatusData.map((s) => (
                    <div key={s.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{s.name}</span>
                        <span>{s.value}</span>
                      </div>
                      <div style={{ height: "8px", borderRadius: "4px", background: "rgba(0,55,58,0.08)" }}>
                        <div
                          style={{
                            height: "100%",
                            borderRadius: "4px",
                            width: `${projects.length ? (s.value / projects.length) * 100 : 0}%`,
                            background: projectStatusColors[s.name],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTIVITY FEED */}
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}>Activity Feed</h3>
              <div style={{ marginTop: "17px", display: "flex", flexDirection: "column", gap: "18px" }}>
                {activity.length === 0 ? (
                  <EmptyState text="No activity yet." />
                ) : (
                  activity.map((a, i) => (
                    <ActivityItem
                      key={i}
                      icon={a.icon === "lead" ? <DollarSign size={15} strokeWidth={1.8} /> : a.icon === "task" ? <Plus size={15} strokeWidth={1.8} /> : <CalendarDays size={15} strokeWidth={1.8} />}
                      text={a.text}
                      time={new Date(a.date).toLocaleString()}
                      color={a.icon === "lead" ? "#00C853" : a.icon === "task" ? "#7C3AED" : "#5BA8EF"}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCardSimple({ label, value, color }) {
  return (
    <div style={{ background: "#FAF9F0", border: "1px solid rgba(0,55,58,0.18)", borderRadius: "16px", padding: "16px 18px", minHeight: "92px", boxSizing: "border-box" }}>
      <div style={{ fontSize: "14px", color: "#161616", fontWeight: 500 }}>{label}</div>
      <div style={{ marginTop: "4px", fontSize: "22px", color, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding: "24px 0", textAlign: "center", fontSize: "12px", color: "rgba(0,55,58,0.4)" }}>
      {text}
    </div>
  );
}

function TaskItem({ title, date, status, color }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "4px 18px minmax(0,1fr) auto", alignItems: "center", columnGap: "9px" }}>
      <span style={{ width: "3px", height: "30px", borderRadius: "4px", background: color }} />
      <span style={{ width: "18px", height: "18px", borderRadius: "4px", border: "1px solid rgba(0,55,58,0.18)", boxSizing: "border-box" }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "12px", color: "#202020", fontWeight: 500 }}>{title}</div>
        <div style={{ marginTop: "2px", fontSize: "10px", color: "rgba(0,55,58,0.36)" }}>{date}</div>
      </div>
      <span style={{ padding: "4px 10px", borderRadius: "6px", background: `${color}18`, color, fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap", textTransform: "capitalize" }}>
        {status}
      </span>
    </div>
  );
}

function LeadRow({ name, source, status, value, color }) {
  return (
    <tr style={{ borderBottom: "1px solid rgba(0,55,58,0.10)" }}>
      <td style={{ padding: "8px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <span style={{ width: "25px", height: "25px", minWidth: "25px", borderRadius: "50%", background: color, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500 }}>
            {name.charAt(0).toUpperCase()}
          </span>
          <span style={{ fontSize: "12px", color: "#202020", fontWeight: 500 }}>{name}</span>
        </div>
      </td>
      <td style={{ padding: "8px 4px", fontSize: "11px", color: "rgba(0,55,58,0.42)" }}>{source}</td>
      <td style={{ padding: "8px 4px" }}>
        <span style={{ display: "inline-block", padding: "4px 11px", borderRadius: "12px", background: `${color}20`, color, fontSize: "10px", fontWeight: 600, textTransform: "capitalize" }}>
          {status}
        </span>
      </td>
      <td style={{ padding: "8px 4px", textAlign: "right", fontSize: "12px", color: "#202020", fontWeight: 500 }}>{value}</td>
    </tr>
  );
}

function ActivityItem({ icon, text, time, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "11px" }}>
      <div style={{ width: "25px", height: "25px", minWidth: "25px", borderRadius: "50%", border: `1px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", color, background: "#FAF9F0" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "12px", color: "#202020", fontWeight: 500 }}>{text}</div>
        <div style={{ marginTop: "2px", fontSize: "10px", color: "rgba(0,55,58,0.34)" }}>{time}</div>
      </div>
    </div>
  );
}

const cardStyle = { background: "#FAF9F0", border: "1px solid rgba(0,55,58,0.16)", borderRadius: "16px", padding: "16px", minHeight: "260px", boxSizing: "border-box" };
const cardTitleStyle = { margin: 0, fontSize: "18px", lineHeight: "23px", color: "#202020", fontWeight: 800 };
const tableHeadStyle = { padding: "0 4px 8px", borderBottom: "1px solid rgba(0,55,58,0.14)", fontSize: "10px", color: "rgba(0,55,58,0.55)", fontWeight: 600, textAlign: "left" };