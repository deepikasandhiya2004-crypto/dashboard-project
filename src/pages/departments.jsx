import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  X,
  Users,
} from "lucide-react";
import { api } from "../lib/api";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [name, setName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getDepartments();

      setDepartments(response || []);
    } catch (err) {
      console.error("Load departments error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load departments."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingDepartment(null);
    setName("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(department) {
    setEditingDepartment(department);
    setName(department.name || "");
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingDepartment(null);
    setName("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Department name is required.");
      return;
    }

    try {
      setError("");

      const data = {
        name: name.trim(),
      };

      if (editingDepartment) {
        await api.updateDepartment(
          editingDepartment.id,
          data
        );

        setSuccess("Department updated successfully.");
      } else {
        await api.createDepartment(data);

        setSuccess("Department created successfully.");
      }

      closeModal();

      await loadDepartments();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Save department error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save department."
      );
    }
  }

  async function handleDelete(department) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${department.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deleteDepartment(department.id);

      setSuccess("Department deleted successfully.");

      await loadDepartments();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Delete department error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to delete department."
      );
    }
  }

  const filteredDepartments = departments.filter((department) =>
    department.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Departments
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Manage departments and team organization.
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
          Add Department
        </button>
      </div>

      {/* Success */}
      {success && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Error */}
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
          placeholder="Search departments..."
          className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
        />
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-dark/10 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-dark/50">
            Loading departments...
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-dark/5">
              <Building2
                size={24}
                className="text-dark/50"
              />
            </div>

            <h3
              className="mt-4 text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              No departments found
            </h3>

            <p className="mt-1 text-sm text-dark/50">
              Create your first department to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-dark/10 bg-dark/[0.02]">
                  <th className="px-6 py-4 text-left text-xs text-dark/50">
                    Department
                  </th>

                  <th className="px-6 py-4 text-center text-xs text-dark/50">
                    Users
                  </th>

                  <th className="px-6 py-4 text-left text-xs text-dark/50">
                    Created
                  </th>

                  <th className="px-6 py-4 text-right text-xs text-dark/50">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartments.map((department) => (
                  <tr
                    key={department.id}
                    className="border-b border-dark/5 last:border-0 hover:bg-dark/[0.015]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark/5">
                          <Building2
                            size={18}
                            className="text-dark/60"
                          />
                        </div>

                        <div>
                          <p
                            className="text-sm text-dark"
                            style={{ fontWeight: 700 }}
                          >
                            {department.name}
                          </p>

                          <p className="text-xs text-dark/40">
                            Department
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-dark/5 px-3 py-1 text-xs text-dark/70">
                        <Users size={13} />
                        {department._count?.users || 0}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-dark/60">
                      {department.createdAt
                        ? new Date(
                            department.createdAt
                          ).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(department)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark/10 text-dark/60 hover:bg-dark/5"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(department)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
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
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
              <div>
                <h2
                  className="text-lg text-dark"
                  style={{ fontWeight: 800 }}
                >
                  {editingDepartment
                    ? "Edit Department"
                    : "Add Department"}
                </h2>

                <p className="mt-1 text-xs text-dark/50">
                  {editingDepartment
                    ? "Update department details."
                    : "Create a new department."}
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
                Department Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Development"
                className="mt-2 w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
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
                  {editingDepartment
                    ? "Update Department"
                    : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}