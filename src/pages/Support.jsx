const tickets = [
  { id: 1, subject: "Can't reset my password", status: "open" },
  { id: 2, subject: "Billing question", status: "pending" },
  { id: 3, subject: "Feature request: dark mode", status: "closed" },
];

export default function Support() {
  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Support
      </h1>
      <p className="mt-1 text-dark/60">
        Sample layout — connect this to a tickets table when you're ready.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {tickets.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-2xl border border-dark/10 bg-white p-4">
            <span className="text-dark" style={{ fontWeight: 600 }}>
              {t.subject}
            </span>
            <span className="rounded-full bg-dark/5 px-3 py-1 text-xs text-dark/60">{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
