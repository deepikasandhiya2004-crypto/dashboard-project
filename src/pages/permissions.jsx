import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  X,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api";

export default function Permissions() {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getPermissions();
      setPermissions(response || []);
    } catch (err) {
      console.error("Load permissions error:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load permissions."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingPermission(null);
    setName("");
    setDescription("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(permission) {
    setEditingPermission(permission);
    setName(permission.name || "");
    setDescription(permission.description || "");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingPermission(null);
    setName("");
    setDescription("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Permission name is required.");
      return;
    }

    try {
      setError("");

      const data = {
        name: name.trim(),
        description: description.trim(),
      };

      if (editingPermission) {
        await api.updatePermission(editingPermission.id, data);
        setSuccess("Permission updated successfully.");
      } else {
        await api.createPermission(data);
        setSuccess("Permission created successfully.");
      }

      closeModal();
      await loadPermissions();

      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("Save permission error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save permission."
      );
    }
  }

  async function handleDelete(permission) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${permission.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deletePermission(permission.id);

      setSuccess("Permission deleted successfully.");
      await loadPermissions();

      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error("Delete permission error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to delete permission."
      );
    }
  }

  const filteredPermissions = permissions.filter((permission) => {
    const value = search.toLowerCase();

    return (
      permission.name?.toLowerCase().includes(value) ||
      permission.description?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Permissions
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Manage permissions available for roles.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm text-dark transition hover:opacity-90"
          style={{
            backgroundColor: "#00DC46",
            fontWeight: 700,
          }}
        >
          <Plus size={18} />
          Add Permission
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mt-6 rounded-2xl border border-dark/10 bg-white p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search permissions..."
          className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none transition focus:border-dark/30"
        />
      </div>

      {/* Permission List */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-dark/10 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-dark/50">
            Loading permissions...
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-dark/5">
              <KeyRound size={24} className="text-dark/50" />
            </div>

            <h3
              className="mt-4 text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              No permissions found
            </h3>

            <p className="mt-1 text-sm text-dark/50">
              Create your first permission to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-dark/10 bg-dark/[0.02]">
                  <th className="px-6 py-4 text-left text-xs text-dark/50">
                    Permission
                  </th>

                  <th className="px-6 py-4 text-left text-xs text-dark/50">
                    Description
                  </th>

                  <th className="px-6 py-4 text-center text-xs text-dark/50">
                    Assigned Roles
                  </th>

                  <th className="px-6 py-4 text-right text-xs text-dark/50">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPermissions.map((permission) => (
                  <tr
                    key={permission.id}
                    className="border-b border-dark/5 last:border-0 hover:bg-dark/[0.015]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark/5">
                          <ShieldCheck
                            size={18}
                            className="text-dark/60"
                          />
                        </div>

                        <div>
                          <p
                            className="text-sm text-dark"
                            style={{ fontWeight: 700 }}
                          >
                            {permission.name}
                          </p>

                          <p className="text-xs text-dark/40">
                            Permission
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-dark/60">
                      {permission.description || "No description"}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex rounded-full bg-dark/5 px-3 py-1 text-xs text-dark/70">
                        {permission._count?.roles || 0}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(permission)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark/10 text-dark/60 transition hover:bg-dark/5 hover:text-dark"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(permission)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
              <div>
                <h2
                  className="text-lg text-dark"
                  style={{ fontWeight: 800 }}
                >
                  {editingPermission
                    ? "Edit Permission"
                    : "Add Permission"}
                </h2>

                <p className="mt-1 text-xs text-dark/50">
                  {editingPermission
                    ? "Update permission details."
                    : "Create a new permission."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-dark/5"
              >
                <X size={19} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <label
                className="text-sm text-dark"
                style={{ fontWeight: 600 }}
              >
                Permission Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. create_invoice"
                className="mt-2 w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
              />

              <label
                className="mt-5 block text-sm text-dark"
                style={{ fontWeight: 600 }}
              >
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What can users with this permission do?"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-dark/10 px-5 py-3 text-sm text-dark/70"
                  style={{ fontWeight: 600 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl px-5 py-3 text-sm text-dark"
                  style={{
                    backgroundColor: "#00DC46",
                    fontWeight: 700,
                  }}
                >
                  {editingPermission
                    ? "Update Permission"
                    : "Create Permission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}