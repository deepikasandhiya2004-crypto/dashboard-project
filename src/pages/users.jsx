import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Users as UsersIcon,
  X,
  UserPlus,
} from "lucide-react";

import { api } from "../lib/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    departmentId: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [usersResponse, rolesResponse] =
        await Promise.all([
          api.getUsers(),
          api.getRoles(),
        ]);

      setUsers(usersResponse || []);
      setRoles(rolesResponse || []);

      // Departments are loaded separately.
      try {
        const departmentsResponse =
          await api.getDepartments();

        setDepartments(departmentsResponse || []);
      } catch {
        setDepartments([]);
      }
    } catch (err) {
      console.error("Users load error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingUser(null);

    setForm({
      name: "",
      email: "",
      password: "",
      roleId: "",
      departmentId: "",
    });

    setError("");
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditingUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      roleId: user.roleId || "",
      departmentId: user.departmentId || "",
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingUser(null);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError("Name is required.");
        return;
      }

      if (!form.email.trim()) {
        setError("Email is required.");
        return;
      }

      if (!editingUser && form.password.length < 6) {
        setError(
          "Password must be at least 6 characters."
        );
        return;
      }

      const data = {
        name: form.name.trim(),
        email: form.email.trim(),
        roleId: form.roleId || null,
        departmentId: form.departmentId || null,
      };

      if (form.password.trim()) {
        data.password = form.password;
      }

      if (editingUser) {
        await api.updateUser(editingUser.id, data);
        setSuccess("User updated successfully.");
      } else {
        await api.createUser(data);
        setSuccess("User created successfully.");
      }

      closeModal();
      await loadData();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Save user error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save user."
      );
    }
  }

  async function handleDelete(user) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.deleteUser(user.id);

      setSuccess("User deleted successfully.");

      await loadData();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Delete user error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to delete user."
      );
    }
  }

  const filteredUsers = users.filter((user) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.roleRef?.name?.toLowerCase().includes(query) ||
      user.department?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-full">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dark text-white">
              <UsersIcon size={21} />
            </div>

            <div>
              <h1
                className="text-2xl text-dark"
                style={{ fontWeight: 800 }}
              >
                Users
              </h1>

              <p className="mt-1 text-sm text-dark/60">
                Manage users, roles and departments.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-dark transition hover:opacity-90"
          style={{
            backgroundColor: "#00DC46",
            fontWeight: 700,
          }}
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ERROR */}
      {error && !showModal && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* SEARCH */}
      <div className="mt-6 rounded-2xl border border-dark/10 bg-white p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name, email, role or department..."
          className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none transition focus:border-dark/30"
        />
      </div>

      {/* TABLE */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-dark/10 bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-dark/50">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center">
            <UsersIcon
              size={40}
              className="mx-auto text-dark/20"
            />

            <h3
              className="mt-4 text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              No users found
            </h3>

            <p className="mt-1 text-sm text-dark/50">
              Add a user to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-dark/10 bg-dark/[0.02] text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    User
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Role
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Department
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Joined
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-dark/5 last:border-0 hover:bg-dark/[0.015]"
                  >
                    {/* USER */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark text-sm font-bold text-white">
                          {user.name
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </div>

                        <div>
                          <p
                            className="text-sm text-dark"
                            style={{ fontWeight: 700 }}
                          >
                            {user.name}
                          </p>

                          <p className="mt-0.5 text-xs text-dark/50">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        {user.roleRef?.name ||
                          user.role ||
                          "Member"}
                      </span>
                    </td>

                    {/* DEPARTMENT */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-dark/70">
                        {user.department?.name ||
                          "Not assigned"}
                      </span>
                    </td>

                    {/* DATE */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-dark/60">
                        {user.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(user)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark/10 text-dark/60 transition hover:bg-dark/5 hover:text-dark"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(user)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark text-white">
                  <UserPlus size={19} />
                </div>

                <div>
                  <h2
                    className="text-lg text-dark"
                    style={{ fontWeight: 800 }}
                  >
                    {editingUser
                      ? "Edit User"
                      : "Add User"}
                  </h2>

                  <p className="text-xs text-dark/50">
                    {editingUser
                      ? "Update user details"
                      : "Create a new account"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-dark/50 hover:bg-dark/5 hover:text-dark"
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL BODY */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* NAME */}
              <div>
                <label className="text-sm font-semibold text-dark">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="mt-2 w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm font-semibold text-dark">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="mt-2 w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm font-semibold text-dark">
                  Password
                  {editingUser && (
                    <span className="ml-1 font-normal text-dark/40">
                      (leave blank to keep current)
                    </span>
                  )}
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editingUser
                      ? "Enter new password"
                      : "Minimum 6 characters"
                  }
                  className="mt-2 w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
                />
              </div>

              {/* ROLE + DEPARTMENT */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-dark">
                    Role
                  </label>

                  <select
                    name="roleId"
                    value={form.roleId}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-dark/10 bg-white px-4 py-3 text-sm outline-none focus:border-dark/30"
                  >
                    <option value="">
                      Select role
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-dark">
                    Department
                  </label>

                  <select
                    name="departmentId"
                    value={form.departmentId}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-dark/10 bg-white px-4 py-3 text-sm outline-none focus:border-dark/30"
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={department.id}
                          value={department.id}
                        >
                          {department.name}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 border-t border-dark/10 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-dark/10 px-5 py-3 text-sm font-semibold text-dark/70 hover:bg-dark/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl px-5 py-3 text-sm font-bold text-dark hover:opacity-90"
                  style={{
                    backgroundColor: "#00DC46",
                  }}
                >
                  {editingUser
                    ? "Update User"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}