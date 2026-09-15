const upcoming = [
  { date: "Mon, 9:00 AM", title: "Sprint planning" },
  { date: "Tue, 2:00 PM", title: "Client check-in" },
  { date: "Thu, 11:00 AM", title: "Design review" },
];

export default function Calendar() {
  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Calendar
      </h1>
      <p className="mt-1 text-dark/60">
        Sample layout — wire this up to a real events table or a calendar API when needed.
      </p>

      <div className="mt-6 rounded-2xl border border-dark/10 bg-white p-5">
        <h3 className="text-dark" style={{ fontWeight: 700 }}>
          Upcoming
        </h3>
        <ul className="mt-4 flex flex-col gap-4">
          {upcoming.map((event) => (
            <li key={event.title} className="flex items-center justify-between border-b border-dark/5 pb-3 last:border-none last:pb-0">
              <span className="text-dark" style={{ fontWeight: 600 }}>
                {event.title}
              </span>
              <span className="text-sm text-dark/50">{event.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
