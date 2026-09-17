import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  BriefcaseBusiness,
  X,
} from "lucide-react";
import { api } from "../lib/api";

export default function ServicesSettings() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [price, setPrice] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getServices();

      setServices(response || []);
    } catch (err) {
      console.error("Load services error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load services."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingService(null);
    setName("");
    setDescription("");
    setCategory("general");
    setPrice("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(service) {
    setEditingService(service);

    setName(service.name || "");
    setDescription(service.description || "");
    setCategory(service.category || "general");
    setPrice(service.price ?? "");

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingService(null);
    setName("");
    setDescription("");
    setCategory("general");
    setPrice("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Service name is required.");
      return;
    }

    if (price !== "" && Number(price) < 0) {
      setError("Price cannot be negative.");
      return;
    }

    try {
      setError("");

      const data = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price: price === "" ? 0 : Number(price),
      };

      if (editingService) {
        await api.updateService(
          editingService.id,
          data
        );

        setSuccess("Service updated successfully.");
      } else {
        await api.createService(data);

        setSuccess("Service created successfully.");
      }

      closeModal();

      await loadServices();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Save service error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save service."
      );
    }
  }

  async function handleDelete(service) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deleteService(service.id);

      setSuccess("Service deleted successfully.");

      await loadServices();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Delete service error:", err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to delete service."
      );
    }
  }

  const filteredServices = services.filter((service) => {
    const value = search.toLowerCase();

    return (
      service.name?.toLowerCase().includes(value) ||
      service.category?.toLowerCase().includes(value) ||
      service.description?.toLowerCase().includes(value)
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
            Services
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Manage the services offered by your company.
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
          Add Service
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
          placeholder="Search services..."
          className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
        />
      </div>

      {/* Services */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-dark/10 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-dark/50">
            Loading services...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-dark/5">
              <BriefcaseBusiness
                size={24}
                className="text-dark/50"
              />
            </div>

            <h3
              className="mt-4 text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              No services found
            </h3>

            <p className="mt-1 text-sm text-dark/50">
              Create your first service to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-dark/10 bg-dark/[0.02]">
                  <th className="px-6 py-4 text-left text-xs text-dark/50">
                    Service
                  </th>

                  <th className="px-6 py-4 text-left text-xs text-dark/50">
                    Category
                  </th>

                  <th className="px-6 py-4 text-left text-xs text-dark/50">
                    Price
                  </th>

                  <th className="px-6 py-4 text-left text-xs text-dark/50">
                    Description
                  </th>

                  <th className="px-6 py-4 text-right text-xs text-dark/50">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-dark/5 last:border-0 hover:bg-dark/[0.015]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark/5">
                          <BriefcaseBusiness
                            size={18}
                            className="text-dark/60"
                          />
                        </div>

                        <div>
                          <p
                            className="text-sm text-dark"
                            style={{ fontWeight: 700 }}
                          >
                            {service.name}
                          </p>

                          <p className="text-xs text-dark/40">
                            Service
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-dark/5 px-3 py-1 text-xs text-dark/70">
                        {service.category || "general"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-dark">
                      ₹{Number(service.price || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="max-w-[280px] px-6 py-4 text-sm text-dark/60">
                      <span className="line-clamp-2">
                        {service.description || "No description"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(service)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark/10 text-dark/60 hover:bg-dark/5"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(service)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
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
            <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
              <div>
                <h2
                  className="text-lg text-dark"
                  style={{ fontWeight: 800 }}
                >
                  {editingService
                    ? "Edit Service"
                    : "Add Service"}
                </h2>

                <p className="mt-1 text-xs text-dark/50">
                  Manage service information.
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

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <label
                className="text-sm text-dark"
                style={{ fontWeight: 600 }}
              >
                Service Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="e.g. Website Development"
                className="mt-2 w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
              />

              <label
                className="mt-5 block text-sm text-dark"
                style={{ fontWeight: 600 }}
              >
                Category
              </label>

              <input
                type="text"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value)
                }
                placeholder="e.g. Development"
                className="mt-2 w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-dark/30"
              />

              <label
                className="mt-5 block text-sm text-dark"
                style={{ fontWeight: 600 }}
              >
                Price
              </label>

              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value)
                }
                placeholder="0"
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
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe this service..."
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
                  {editingService
                    ? "Update Service"
                    : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}