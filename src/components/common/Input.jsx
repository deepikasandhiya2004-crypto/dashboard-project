export default function Input({ label, error, ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium text-dark">{label}</span>}
      <input
        {...props}
        className="rounded-lg border border-[rgba(0,55,58,0.25)] px-3 py-2 text-sm outline-none focus:border-purple"
      />
      {error && <span className="text-xs text-orange">{error}</span>}
    </label>
  );
}