import ChartCard from "../components/ChartCard.jsx";

const productivity = [
  { label: "Mon", value: 8 },
  { label: "Tue", value: 12 },
  { label: "Wed", value: 9 },
  { label: "Thu", value: 15 },
  { label: "Fri", value: 11 },
];

export default function Reports() {
  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Reports
      </h1>
      <p className="mt-1 text-dark/60">
        Sample layout — swap this chart for a real query once you know what you want to report on.
      </p>

      <div className="mt-6">
        <ChartCard title="Tasks completed per day (sample data)" data={productivity} color="#FF6A3D" />
      </div>
    </div>
  );
}
