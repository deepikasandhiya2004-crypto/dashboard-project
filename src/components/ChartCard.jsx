import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function ChartCard({ title, data, dataKey = "value", color = "#00DC46" }) {
  return (
    <div className="rounded-2xl border border-dark/10 bg-white p-5">
      <h3 className="text-dark" style={{ fontWeight: 700 }}>
        {title}
      </h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#00373A10" />
            <XAxis dataKey="label" stroke="#00373A60" fontSize={12} />
            <YAxis stroke="#00373A60" fontSize={12} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #00373A20", fontSize: 13 }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill="url(#chartFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
