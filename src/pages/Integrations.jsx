import { useEffect, useState } from "react";
import {
  Plug,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { api } from "../lib/api";

export default function Integrations() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    provider: "",
    description: "",
    enabled: false,
    configured: false,
  });

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getIntegrations();

      setIntegrations(response || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load integrations."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);

    setForm({
      name: "",
      provider: "",
      description: "",
      enabled: false,
      configured: false,
    });

    setModalOpen(true);
  }

  function openEditModal(integration) {
    setEditingId(integration.id);

    setForm({
      name: integration.name || "",
      provider: integration.provider || "",
      description: integration.description || "",
      enabled: Boolean(integration.enabled),
      configured: Boolean(integration.configured),
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.provider.trim()) {
      setError("Integration name and provider are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        name: form.name.trim(),
        provider: form.provider.trim(),
        description: form.description.trim(),
        enabled: form.enabled,
        configured: form.configured,
      };

      if (editingId) {
        await api.updateIntegration(editingId, data);
      } else {
        await api.createIntegration(data);
      }

      closeModal();
      await loadIntegrations();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save integration."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this integration?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deleteIntegration(id);

      await loadIntegrations();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to delete integration."
      );
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#E8F8ED" }}
          >
            <Plug size={22} className="text-dark" />
          </div>

          <div>
            <h1
              className="text-2xl text-dark"
              style={{ fontWeight: 800 }}
            >
              Integrations
            </h1>

            <p className="mt-1 text-sm text-dark/60">
              Manage connected services and integrations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm text-dark"
          style={{
            backgroundColor: "#00DC46",
            fontWeight: 700,
          }}
        >
          <Plus size={18} />
          Add Integration
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-dark/10 bg-white p-6">
            <p className="text-sm text-dark/60">
              Loading integrations...
            </p>
          </div>
        ) : integrations.length === 0 ? (
          <div className="rounded-2xl border border-dark/10 bg-white p-10 text-center">
            <Plug
              size={38}
              className="mx-auto text-dark/30"
            />

            <h2
              className="mt-4 text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              No integrations
            </h2>

            <p className="mt-1 text-sm text-dark/50">
              Add your first integration to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="rounded-2xl border border-dark/10 bg-white p-5"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: integration.enabled
                          ? "#E8F8ED"
                          : "#F3F3F3",
                      }}
                    >
                      <Plug
                        size={20}
                        className="text-dark"
                      />
                    </div>

                    <div>
                      <h3
                        className="text-base text-dark"
                        style={{ fontWeight: 700 }}
                      >
                        {integration.name}
                      </h3>

                      <p className="text-xs text-dark/50">
                        {integration.provider}
                      </p>
                    </div>
                  </div>

                  <span
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{
                      backgroundColor: integration.enabled
                        ? "#E8F8ED"
                        : "#F3F3F3",
                    }}
                  >
                    {integration.enabled
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-4 min-h-[40px] text-sm leading-5 text-dark/60">
                  {integration.description ||
                    "No description provided."}
                </p>

                {/* Status */}
                <div className="mt-5 flex items-center gap-2 text-sm">
                  {integration.configured ? (
                    <>
                      <CheckCircle2
                        size={17}
                        className="text-green-600"
                      />

                      <span className="text-green-600">
                        Configured
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle
                        size={17}
                        className="text-dark/40"
                      />

                      <span className="text-dark/50">
                        Not configured
                      </span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-2 border-t border-dark/10 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(integration)
                    }
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-dark/10 px-3 py-2 text-sm text-dark"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(integration.id)
                    }
                    className="flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
              <div>
                <h2
                  className="text-lg text-dark"
                  style={{ fontWeight: 700 }}
                >
                  {editingId
                    ? "Edit Integration"
                    : "Add Integration"}
                </h2>

                <p className="mt-1 text-xs text-dark/50">
                  Configure your integration details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-dark/50 hover:bg-dark/5"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label
                  className="text-sm text-dark"
                  style={{ fontWeight: 600 }}
                >
                  Integration Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Google Calendar"
                  className="mt-2 w-full rounded-xl border border-dark/15 px-4 py-3 text-sm outline-none focus:border-dark"
                />
              </div>

              <div>
                <label
                  className="text-sm text-dark"
                  style={{ fontWeight: 600 }}
                >
                  Provider
                </label>

                <input
                  type="text"
                  name="provider"
                  value={form.provider}
                  onChange={handleChange}
                  placeholder="e.g. Google"
                  className="mt-2 w-full rounded-xl border border-dark/15 px-4 py-3 text-sm outline-none focus:border-dark"
                />
              </div>

              <div>
                <label
                  className="text-sm text-dark"
                  style={{ fontWeight: 600 }}
                >
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe this integration..."
                  className="mt-2 w-full resize-none rounded-xl border border-dark/15 px-4 py-3 text-sm outline-none focus:border-dark"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-dark">
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={form.enabled}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  Enable this integration
                </label>

                <label className="flex items-center gap-3 text-sm text-dark">
                  <input
                    type="checkbox"
                    name="configured"
                    checked={form.configured}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  Mark as configured
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-dark/10 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-dark/10 px-5 py-3 text-sm text-dark"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-5 py-3 text-sm text-dark disabled:opacity-60"
                  style={{
                    backgroundColor: "#00DC46",
                    fontWeight: 700,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Integration"
                    : "Add Integration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}