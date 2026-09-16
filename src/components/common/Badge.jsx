const colorMap = {
  success: "#00C853",
  warning: "#FF6A3D",
  info: "#5BA8EF",
  brand: "#7C3AED",
  danger: "#E00000",
};

export default function Badge({ children, color = "info" }) {
  const hex = colorMap[color] || color;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: "12px",
        background: `${hex}20`,
        color: hex,
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}