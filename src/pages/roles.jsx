import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, X } from "lucide-react";
import { api } from "../lib/api.js";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function loadRoles() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getRoles();
      setRoles(response || []);
    } catch (err) {
      console.error("Load roles error:", err);
      setError(
        err.response?.data?.error || "Failed to load roles."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  function openCreateModal() {
    setEditingRole(null);
    setName("");
    setDescription("");
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(role) {
    setEditingRole(role);
    setName(role.name || "");
    setDescription(role.description || "");
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingRole(null);
    setName("");
    setDescription("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }

    try {
      setError("");

      if (editingRole) {
        await api.updateRole(editingRole.id, {
          name: name.trim(),
          description: description.trim(),
        });

        setSuccess("Role updated successfully.");
      } else {
        await api.createRole({
          name: name.trim(),
          description: description.trim(),
        });

        setSuccess("Role created successfully.");
      }

      closeModal();
      await loadRoles();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Save role error:", err);

      setError(
        err.response?.data?.error || "Failed to save role."
      );
    }
  }

  async function handleDelete(role) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${role.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deleteRole(role.id);

      setSuccess("Role deleted successfully.");
      await loadRoles();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Delete role error:", err);

      setError(
        err.response?.data?.error || "Failed to delete role."
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Roles
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Manage user roles and access levels.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm text-dark transition hover:opacity-90"
          style={{
            backgroundColor: "#00DC46",
            fontWeight: 700,
          }}
        >
          <Plus size={18} />
          Add Role
        </button>
      </div>

      {/* Messages */}
      {error && !showModal && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Roles */}
      <div className="rounded-2xl border border-dark/10 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-dark/50">
            Loading roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="p-10 text-center">
            <ShieldCheck
              size={42}
              className="mx-auto text-dark/20"
            />

            <h3
              className="mt-4 text-base text-dark"
              style={{ fontWeight: 700 }}
            >
              No roles found
            </h3>

            <p className="mt-1 text-sm text-dark/50">
              Create your first role to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark/10">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-dark/[0.02] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: "#EFEBD8",
                    }}
                  >
                    <ShieldCheck
                      size={21}
                      className="text-dark"
                    />
                  </div>

                  <div>
                    <h3
                      className="text-base text-dark"
                      style={{ fontWeight: 700 }}
                    >
                      {role.name}
                    </h3>

                    <p className="mt-1 text-sm text-dark/55">
                      {role.description ||
                        "No description provided."}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-dark/45">
                      <span>
                        Users:{" "}
                        {role._count?.users ?? 0}
                      </span>

                      <span>
                        Permissions:{" "}
                        {role.permissions?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(role)}
                    className="inline-flex items-center gap-2 rounded-lg border border-dark/10 px-3 py-2 text-sm text-dark transition hover:bg-dark/5"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(role)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-dark/10 px-6 py-4">
              <div>
                <h2
                  className="text-lg text-dark"
                  style={{ fontWeight: 800 }}
                >
                  {editingRole
                    ? "Edit Role"
                    : "Create Role"}
                </h2>

                <p className="mt-1 text-xs text-dark/50">
                  Define the role name and description.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-dark/50 hover:bg-dark/5"
              >
                <X size={19} />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label
                  className="text-sm text-dark/70"
                  style={{ fontWeight: 600 }}
                >
                  Role Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="e.g. Manager"
                  className="mt-2 w-full rounded-xl border border-dark/15 px-4 py-3 text-sm outline-none transition focus:border-dark"
                />
              </div>

              <div>
                <label
                  className="text-sm text-dark/70"
                  style={{ fontWeight: 600 }}
                >
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe what this role is responsible for..."
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl border border-dark/15 px-4 py-3 text-sm outline-none transition focus:border-dark"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-dark/10 px-5 py-3 text-sm text-dark hover:bg-dark/5"
                  style={{ fontWeight: 600 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl px-5 py-3 text-sm text-dark hover:opacity-90"
                  style={{
                    backgroundColor: "#00DC46",
                    fontWeight: 700,
                  }}
                >
                  {editingRole
                    ? "Update Role"
                    : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}