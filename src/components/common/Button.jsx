export default function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: "bg-purple text-white hover:opacity-90",
    outline: "border border-[rgba(0,55,58,0.25)] text-dark hover:bg-black/5",
    danger: "bg-orange text-white hover:opacity-90",
  };
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}