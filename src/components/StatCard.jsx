import {
  Users,
  UserPlus,
  PhoneCall,
  Crown,
  DollarSign,
} from "lucide-react";

const iconMap = {
  users: Users,
  new: UserPlus,
  contacted: PhoneCall,
  qualified: Crown,
  revenue: DollarSign,
};

export default function StatCard({
  label,
  value,
  change,
  type,
  color = "#7C3AED",
}) {
  const Icon = iconMap[type] || Users;

  return (
    <div
      style={{
        background: "#FAF9F0",
        border: "1px solid rgba(0,55,58,0.18)",
        borderRadius: "16px",
        padding: "16px 18px",
        minHeight: "92px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* ICON */}
        <div
          style={{
            width: "40px",
            height: "40px",
            minWidth: "40px",
            borderRadius: "10px",
            border: `3px solid ${color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
            background: "#FAF9F0",
          }}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>

        {/* LABEL + VALUE */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              lineHeight: "18px",
              color: "#161616",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop: "4px",
              fontSize: "19px",
              lineHeight: "22px",
              color: "#202020",
              fontWeight: 800,
            }}
          >
            {value}
          </div>
        </div>
      </div>

      {/* CHANGE */}
      {change && (
        <div
          style={{
            marginTop: "7px",
            marginLeft: "52px",
            fontSize: "11px",
            color: "#202020",
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          {change} from last month
        </div>
      )}
    </div>
  );
}