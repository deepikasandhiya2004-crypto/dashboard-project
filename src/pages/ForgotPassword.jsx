import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl text-dark" style={{ fontWeight: 800 }}>
          Forgot password
        </h1>
        <p className="mt-2 text-dark/70">
          Enter your account email and we'll send you a reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-dark/15 px-4 py-3 outline-none focus:border-dark"
          />
          {message && <p className="text-sm text-dark">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full px-6 py-3 text-dark disabled:opacity-60"
            style={{ backgroundColor: "#00DC46", fontWeight: 700 }}
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-dark/70">
          <Link to="/login" className="underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}