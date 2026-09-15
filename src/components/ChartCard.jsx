import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";

const defaultData = [
  { label: "May 1", value: 320 },
  { label: "May 3", value: 450 },
  { label: "May 5", value: 410 },
  { label: "May 8", value: 520 },
  { label: "May 11", value: 480 },
  { label: "May 15", value: 740 },
  { label: "May 18", value: 590 },
  { label: "May 20", value: 750 },
  { label: "May 22", value: 920 },
  { label: "May 25", value: 750 },
  { label: "May 27", value: 1000 },
  { label: "May 29", value: 1248 },
];

export default function ChartCard({
  title = "Project Activity",
  data = defaultData,
  color = "#7C3AED",
}) {
  const chartData = data && data.length > 0 ? data : defaultData;

  const lastPoint = chartData[chartData.length - 1];

  return (
    <div
      style={{
        width: "100%",
        background: "#FAF9F0",
        border: "1px solid rgba(0,55,58,0.16)",
        borderRadius: "16px",
        padding: "14px 16px 10px",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "15px",
            lineHeight: "20px",
            color: "#00373A",
            fontWeight: 800,
          }}
        >
          {title}
        </h3>

        <span
          style={{
            fontSize: "8px",
            color: "rgba(0,55,58,0.42)",
          }}
        >
          Last 30 days
        </span>
      </div>

      {/* GRAPH */}
      <div
        style={{
          width: "100%",
          height: "180px",
          marginTop: "2px",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 8,
              left: -18,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id="purpleGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#7C3AED"
                  stopOpacity={0.28}
                />

                <stop
                  offset="100%"
                  stopColor="#7C3AED"
                  stopOpacity={0.06}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={true}
              horizontal={true}
              stroke="#00373A"
              strokeOpacity={0.10}
              strokeDasharray="2 3"
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tick={{
                fontSize: 8,
                fill: "#00373A",
                fillOpacity: 0.38,
              }}
            />

            <YAxis
              domain={[0, 1500]}
              ticks={[0, 250, 500, 750, 1000, 1250, 1500]}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 8,
                fill: "#00373A",
                fillOpacity: 0.38,
              }}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid rgba(0,55,58,0.15)",
                background: "#FAF9F0",
                fontSize: "11px",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill="url(#purpleGradient)"
              strokeWidth={2}
              dot={{
                r: 3,
                fill: "#FAF9F0",
                stroke: color,
                strokeWidth: 2,
              }}
              activeDot={{
                r: 4,
                fill: color,
                stroke: "#FAF9F0",
                strokeWidth: 2,
              }}
            />

            <ReferenceDot
              x={lastPoint.label}
              y={lastPoint.value}
              r={4}
              fill={color}
              stroke="#FAF9F0"
              strokeWidth={2}
              label={{
                value: lastPoint.value,
                position: "top",
                fill: "#FFFFFF",
                fontSize: 9,
                fontWeight: 700,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}