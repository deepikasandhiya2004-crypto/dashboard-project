import { useState } from "react";

export default function Settings() {
  const [name, setName] = useState("Your Name");
  const [email, setEmail] = useState("you@example.com");
  const [saved, setSaved] = useState(false);

  function handleSave(e) {
    e.preventDefault();
    // Wire this up to a real /api/settings or /api/users/:id endpoint later.
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <h1 className="text-2xl text-dark" style={{ fontWeight: 800 }}>
        Settings
      </h1>

      <form onSubmit={handleSave} className="mt-6 max-w-md rounded-2xl border border-dark/10 bg-white p-6">
        <label className="text-sm text-dark/60" style={{ fontWeight: 500 }}>
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 mb-4 w-full rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />

        <label className="text-sm text-dark/60" style={{ fontWeight: 500 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 mb-4 w-full rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
        />

        <button
          type="submit"
          className="rounded-full px-6 py-3 text-dark"
          style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
        >
          Save changes
        </button>
        {saved && <span className="ml-3 text-sm text-dark/60">Saved.</span>}
      </form>
    </div>
  );
}
