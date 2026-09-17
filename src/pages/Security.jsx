import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { api } from "../lib/api";

export default function Security() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setSuccess("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSuccess("");
    setError("");

    if (
      !form.currentPassword ||
      !form.newPassword ||
      !form.confirmPassword
    ) {
      setError("All password fields are required.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError(
        "New password and confirm password do not match."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.updatePassword(form);

      setSuccess(
        response?.message ||
          "Password updated successfully."
      );

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to update password."
      );
    } finally {
      setSaving(false);
    }
  }

  function PasswordInput({
    name,
    label,
    value,
    show,
    setShow,
    placeholder,
  }) {
    return (
      <div>
        <label
          className="text-sm text-dark"
          style={{ fontWeight: 600 }}
        >
          {label}
        </label>

        <div className="relative mt-2">
          <Lock
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/40"
          />

          <input
            type={show ? "text" : "password"}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full rounded-xl border border-dark/15 py-3 pl-11 pr-11 text-sm outline-none focus:border-dark"
          />

          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-dark/40"
          >
            {show ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#E8F8ED" }}
        >
          <ShieldCheck size={22} className="text-dark" />
        </div>

        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Security
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Manage your account security and password.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Change Password */}
      <div className="mt-6 max-w-2xl rounded-2xl border border-dark/10 bg-white">
        <div className="border-b border-dark/10 px-6 py-5">
          <h2
            className="text-lg text-dark"
            style={{ fontWeight: 700 }}
          >
            Change Password
          </h2>

          <p className="mt-1 text-sm text-dark/50">
            Update your password to keep your account secure.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <PasswordInput
            name="currentPassword"
            label="Current Password"
            value={form.currentPassword}
            show={showCurrent}
            setShow={setShowCurrent}
            placeholder="Enter current password"
          />

          <PasswordInput
            name="newPassword"
            label="New Password"
            value={form.newPassword}
            show={showNew}
            setShow={setShowNew}
            placeholder="Enter new password"
          />

          <PasswordInput
            name="confirmPassword"
            label="Confirm New Password"
            value={form.confirmPassword}
            show={showConfirm}
            setShow={setShowConfirm}
            placeholder="Confirm new password"
          />

          <div className="rounded-xl bg-dark/[0.03] p-4">
            <p
              className="text-sm text-dark"
              style={{ fontWeight: 600 }}
            >
              Password requirements
            </p>

            <ul className="mt-2 space-y-1 text-xs text-dark/50">
              <li>• At least 8 characters</li>
              <li>• New and confirm passwords must match</li>
              <li>• Your current password must be correct</li>
            </ul>
          </div>

          <div className="flex justify-end border-t border-dark/10 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl px-5 py-3 text-sm text-dark disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: "#00DC46",
                fontWeight: 700,
              }}
            >
              {saving
                ? "Updating..."
                : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}