export default function StatCard({ label, value, change, color = "#00DC46" }) {
  return (
    <div className="rounded-2xl border border-dark/10 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-dark/60" style={{ fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div className="mt-3 text-3xl text-dark" style={{ fontWeight: 800 }}>
        {value}
      </div>
      {change && (
        <div className="mt-1 text-sm text-dark/50" style={{ fontWeight: 500 }}>
          {change}
        </div>
      )}
    </div>
  );
}
