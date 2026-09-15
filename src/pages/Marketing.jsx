import StatCard from "../components/StatCard.jsx";
import ChartCard from "../components/ChartCard.jsx";

const campaignReach = [
  { label: "Week 1", value: 400 },
  { label: "Week 2", value: 620 },
  { label: "Week 3", value: 540 },
  { label: "Week 4", value: 810 },
];

export default function Marketing() {
  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Marketing
      </h1>
      <p className="mt-1 text-dark/60">
        Sample layout — connect this to a campaigns table when you're ready.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active campaigns" value={3} color="#7C3AED" />
        <StatCard label="Total reach" value="12.4k" color="#00DC46" />
        <StatCard label="Click-through rate" value="4.2%" color="#FF6A3D" />
      </div>

      <div className="mt-6">
        <ChartCard title="Campaign reach (sample data)" data={campaignReach} color="#7C3AED" />
      </div>
    </div>
  );
}
