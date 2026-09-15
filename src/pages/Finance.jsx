import StatCard from "../components/StatCard.jsx";
import ChartCard from "../components/ChartCard.jsx";

const revenue = [
  { label: "Jan", value: 4200 },
  { label: "Feb", value: 5100 },
  { label: "Mar", value: 4800 },
  { label: "Apr", value: 6300 },
  { label: "May", value: 7100 },
];

export default function Finance() {
  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Finance
      </h1>
      <p className="mt-1 text-dark/60">
        Sample layout — connect this to an invoices/payments table when you're ready.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Revenue (MTD)" value="$7,100" color="#00DC46" />
        <StatCard label="Outstanding invoices" value="$1,240" color="#FF6A3D" />
        <StatCard label="Expenses (MTD)" value="$2,860" color="#00373A" />
      </div>

      <div className="mt-6">
        <ChartCard title="Revenue trend (sample data)" data={revenue} />
      </div>
    </div>
  );
}
