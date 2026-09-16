export default function Card({ title, action, children }) {
  return (
    <div
      style={{
        background: "#FAF9F0",
        border: "1px solid rgba(0,55,58,0.16)",
        borderRadius: "16px",
        padding: "16px",
      }}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="m-0 text-[18px] font-extrabold text-[#202020]">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}