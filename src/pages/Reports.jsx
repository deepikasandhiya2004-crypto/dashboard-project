import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderKanban,
  LifeBuoy,
  IndianRupee,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
 
} from "recharts";
import { api } from "../lib/api.js";

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await api.getReports();

      setReport(data || null);
    } catch (err) {
      console.error("Reports error:", err);

      setError(
        err?.response?.data?.error ||
          "Failed to load reports."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  const revenueData = useMemo(() => {
    return report?.monthlyRevenue || [];
  }, [report]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Reports
          </h1>

          <p className="mt-1 text-dark/60">
            Overview of your business performance.
          </p>
        </div>

        <div className="rounded-2xl border border-dark/10 bg-white p-8 text-center text-dark/50">
          Loading reports...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Reports
          </h1>

          <p className="mt-1 text-dark/60">
            Overview of your business performance.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const sales = report?.sales || {};
  const leads = report?.leads || {};
  const projects = report?.projects || {};
  const revenue = report?.revenue || {};
  const support = report?.support || {};

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1
          className="text-2xl text-dark"
          style={{ fontWeight: 800 }}
        >
          Reports
        </h1>

        <p className="mt-1 text-dark/60">
          Overview of your business performance and activity.
        </p>
      </div>

      {/* REVENUE SUMMARY */}
      <div>
        <h2
          className="mb-3 text-base text-dark"
          style={{ fontWeight: 700 }}
        >
          Revenue
        </h2>

        <div className="grid gap-4 md:grid-cols-3">

          <ReportCard
            title="Total Invoiced"
            value={formatCurrency(revenue.totalInvoiced)}
            icon={IndianRupee}
          />

          <ReportCard
            title="Total Received"
            value={formatCurrency(revenue.totalReceived)}
            icon={TrendingUp}
          />

          <ReportCard
            title="Pending Amount"
            value={formatCurrency(revenue.totalPending)}
            icon={BarChart3}
          />

        </div>
      </div>

      {/* SALES + LEADS */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* SALES */}
        <div className="rounded-2xl border border-dark/10 bg-white p-6">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2.5 text-purple-700">
              <TrendingUp size={20} />
            </div>

            <div>
              <h2
                className="text-lg text-dark"
                style={{ fontWeight: 700 }}
              >
                Sales
              </h2>

              <p className="text-sm text-dark/50">
                Deal performance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <MiniStat
              label="Total Deals"
              value={sales.totalDeals || 0}
            />

            <MiniStat
              label="Won Deals"
              value={sales.wonDeals || 0}
            />

            <MiniStat
              label="Total Sales"
              value={formatCurrency(sales.totalSales)}
            />

            <MiniStat
              label="Won Sales"
              value={formatCurrency(sales.wonSales)}
            />

          </div>
        </div>

        {/* LEADS */}
        <div className="rounded-2xl border border-dark/10 bg-white p-6">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
              <Users size={20} />
            </div>

            <div>
              <h2
                className="text-lg text-dark"
                style={{ fontWeight: 700 }}
              >
                Leads
              </h2>

              <p className="text-sm text-dark/50">
                Lead pipeline overview
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <MiniStat
              label="Total"
              value={leads.total || 0}
            />

            <MiniStat
              label="New"
              value={leads.new || 0}
            />

            <MiniStat
              label="Contacted"
              value={leads.contacted || 0}
            />

            <MiniStat
              label="Qualified"
              value={leads.qualified || 0}
            />

            <MiniStat
              label="Converted"
              value={leads.converted || 0}
            />

            <MiniStat
              label="Lost"
              value={leads.lost || 0}
            />

          </div>
        </div>

      </div>

      {/* MONTHLY REVENUE */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6">

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2
              className="text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              Monthly Revenue
            </h2>

            <p className="mt-1 text-sm text-dark/50">
              Revenue received over the last 6 months
            </p>
          </div>

          <span className="text-xs text-dark/40">
            Last 6 months
          </span>
        </div>

        <div className="h-[300px] w-full">

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E1D2"
              />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  `₹${value.toLocaleString("en-IN")}`
                }
              />

              <Tooltip
                formatter={(value) => [
                  formatCurrency(value),
                  "Revenue",
                ]}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6B46C1"
                strokeWidth={3}
                dot={{
                  r: 4,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                }}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>
      </div>

      {/* PROJECTS + SUPPORT */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* PROJECTS */}
        <div className="rounded-2xl border border-dark/10 bg-white p-6">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-2.5 text-green-700">
              <FolderKanban size={20} />
            </div>

            <div>
              <h2
                className="text-lg text-dark"
                style={{ fontWeight: 700 }}
              >
                Projects
              </h2>

              <p className="text-sm text-dark/50">
                Project status overview
              </p>
            </div>
          </div>

          <div className="space-y-4">

            <StatusRow
              label="Planning"
              value={projects.planning || 0}
            />

            <StatusRow
              label="Active"
              value={projects.active || 0}
            />

            <StatusRow
              label="Completed"
              value={projects.completed || 0}
            />

            <StatusRow
              label="On Hold"
              value={projects.onHold || 0}
            />

          </div>
        </div>

        {/* SUPPORT */}
        <div className="rounded-2xl border border-dark/10 bg-white p-6">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-2.5 text-orange-700">
              <LifeBuoy size={20} />
            </div>

            <div>
              <h2
                className="text-lg text-dark"
                style={{ fontWeight: 700 }}
              >
                Support
              </h2>

              <p className="text-sm text-dark/50">
                Support ticket status
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <MiniStat
              label="Total"
              value={support.total || 0}
            />

            <MiniStat
              label="Open"
              value={support.open || 0}
            />

            <MiniStat
              label="In Progress"
              value={support.inProgress || 0}
            />

            <MiniStat
              label="Resolved"
              value={support.resolved || 0}
            />

            <MiniStat
              label="Closed"
              value={support.closed || 0}
            />

          </div>
        </div>

      </div>

    </div>
  );
}


/* =========================
   REPORT CARD
========================= */

function ReportCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-dark/10 bg-white p-5">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-dark/50">
            {title}
          </p>

          <p
            className="mt-2 text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-purple-100 p-2.5 text-purple-700">
          <Icon size={20} />
        </div>

      </div>

    </div>
  );
}


/* =========================
   MINI STAT
========================= */

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-dark/10 bg-[#FAF9F2] p-4">

      <p className="text-xs text-dark/50">
        {label}
      </p>

      <p
        className="mt-1 text-lg text-dark"
        style={{ fontWeight: 700 }}
      >
        {value}
      </p>

    </div>
  );
}


/* =========================
   STATUS ROW
========================= */

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-dark/10 bg-[#FAF9F2] px-4 py-3">

      <span className="text-sm text-dark/70">
        {label}
      </span>

      <span
        className="text-base text-dark"
        style={{ fontWeight: 700 }}
      >
        {value}
      </span>

    </div>
  );
}