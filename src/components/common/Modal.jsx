export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-cream p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="m-0 text-lg font-bold text-dark">{title}</h3>
          <button onClick={onClose} className="text-dark/50 hover:text-dark">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}