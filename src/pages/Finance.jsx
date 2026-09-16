import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, FileText } from "lucide-react";
import { api } from "../lib/api.js";

export default function Finance() {
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    clientId: "",
    issueDate: new Date().toISOString().split("T")[0],
    validUntil: "",
    discount: "",
    tax: "",
    notes: "",
    items: [
      {
        description: "",
        quantity: 1,
        unitPrice: "",
      },
    ],
  });

  // --------------------------------------------------
  // Load Finance data
  // --------------------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [clientsData, quotationsData] = await Promise.all([
        api.getClients(),
        api.getQuotations(),
      ]);

      setClients(clientsData || []);
      setQuotations(quotationsData || []);
    } catch (err) {
      setError(err.message || "Failed to load finance data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------
  // Form helpers
  // --------------------------------------------------

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => {
      const items = [...prev.items];

      items[index] = {
        ...items[index],
        [field]: value,
      };

      return {
        ...prev,
        items,
      };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          unitPrice: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => {
      if (prev.items.length === 1) return prev;

      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      };
    });
  };

  const resetForm = () => {
    setForm({
      clientId: "",
      issueDate: new Date().toISOString().split("T")[0],
      validUntil: "",
      discount: "",
      tax: "",
      notes: "",
      items: [
        {
          description: "",
          quantity: 1,
          unitPrice: "",
        },
      ],
    });

    setEditingId(null);
    setShowForm(false);
  };

  // --------------------------------------------------
  // Totals
  // --------------------------------------------------

  const subtotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;

      return sum + quantity * unitPrice;
    }, 0);
  }, [form.items]);

  const discount = Number(form.discount) || 0;
  const tax = Number(form.tax) || 0;

  const total = Math.max(
    0,
    subtotal - discount + tax
  );

  // --------------------------------------------------
  // Create / Update quotation
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.clientId) {
      setError("Please select a client.");
      return;
    }

    const validItems = form.items.filter(
      (item) =>
        item.description.trim() &&
        Number(item.quantity) > 0 &&
        Number(item.unitPrice) >= 0
    );

    if (validItems.length === 0) {
      setError("Please add at least one valid quotation item.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        clientId: form.clientId,
        issueDate: form.issueDate,
        validUntil: form.validUntil || null,
        discount,
        tax,
        notes: form.notes || null,
        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      if (editingId) {
        await api.updateQuotation(editingId, payload);
      } else {
        await api.createQuotation(payload);
      }

      await loadData();
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save quotation.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Edit quotation
  // --------------------------------------------------

  const handleEdit = (quotation) => {
    setEditingId(quotation.id);

    setForm({
      clientId: quotation.clientId,
      issueDate: quotation.issueDate
        ? quotation.issueDate.split("T")[0]
        : "",
      validUntil: quotation.validUntil
        ? quotation.validUntil.split("T")[0]
        : "",
      discount: quotation.discount ?? "",
      tax: quotation.tax ?? "",
      notes: quotation.notes ?? "",
      items:
        quotation.items?.length > 0
          ? quotation.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            }))
          : [
              {
                description: "",
                quantity: 1,
                unitPrice: "",
              },
            ],
    });

    setShowForm(true);
  };

  // --------------------------------------------------
  // Delete quotation
  // --------------------------------------------------

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quotation?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deleteQuotation(id);

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to delete quotation.");
    }
  };

  // --------------------------------------------------
  // Stats
  // --------------------------------------------------

  const totalQuotationValue = quotations.reduce(
    (sum, quotation) => sum + Number(quotation.total || 0),
    0
  );

  const acceptedValue = quotations
    .filter((quotation) => quotation.status === "accepted")
    .reduce(
      (sum, quotation) => sum + Number(quotation.total || 0),
      0
    );

  const pendingValue = quotations
    .filter(
      (quotation) =>
        quotation.status === "draft" ||
        quotation.status === "sent"
    )
    .reduce(
      (sum, quotation) => sum + Number(quotation.total || 0),
      0
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Finance
          </h1>

          <p className="mt-1 text-dark/60">
            Manage quotations, invoices, payments and transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-dark px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={18} />
          New Quotation
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Finance stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <p className="text-sm text-dark/60">
            Total Quotations
          </p>

          <p className="mt-2 text-2xl font-bold text-dark">
            ₹{totalQuotationValue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <p className="text-sm text-dark/60">
            Accepted
          </p>

          <p className="mt-2 text-2xl font-bold text-dark">
            ₹{acceptedValue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <p className="text-sm text-dark/60">
            Pending
          </p>

          <p className="mt-2 text-2xl font-bold text-dark">
            ₹{pendingValue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Quotation form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-dark/10 bg-white p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-dark">
                {editingId
                  ? "Edit Quotation"
                  : "Create Quotation"}
              </h2>

              <p className="mt-1 text-sm text-dark/50">
                Add the client and services included in this quotation.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-dark/60 hover:text-dark"
            >
              Cancel
            </button>
          </div>

          {/* Basic information */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark">
                Client
              </label>

              <select
                value={form.clientId}
                onChange={(e) =>
                  updateForm("clientId", e.target.value)
                }
                className="w-full rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-dark/30"
              >
                <option value="">Select client</option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                    {client.company
                      ? ` — ${client.company}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark">
                Issue Date
              </label>

              <input
                type="date"
                value={form.issueDate}
                onChange={(e) =>
                  updateForm("issueDate", e.target.value)
                }
                className="w-full rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-dark">
                Valid Until
              </label>

              <input
                type="date"
                value={form.validUntil}
                onChange={(e) =>
                  updateForm("validUntil", e.target.value)
                }
                className="w-full rounded-xl border border-dark/10 bg-white px-3 py-2.5 text-sm outline-none"
              />
            </div>
          </div>

          {/* Items */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-dark">
                Quotation Items
              </h3>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-dark"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => {
                const itemTotal =
                  (Number(item.quantity) || 0) *
                  (Number(item.unitPrice) || 0);

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-dark/10 p-4 md:grid-cols-[1fr_120px_160px_140px_40px]"
                  >
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="rounded-lg border border-dark/10 px-3 py-2 text-sm outline-none"
                    />

                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      className="rounded-lg border border-dark/10 px-3 py-2 text-sm outline-none"
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unitPrice",
                          e.target.value
                        )
                      }
                      className="rounded-lg border border-dark/10 px-3 py-2 text-sm outline-none"
                    />

                    <div className="flex items-center rounded-lg bg-dark/5 px-3 text-sm font-semibold">
                      ₹{itemTotal.toLocaleString("en-IN")}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={form.items.length === 1}
                      className="flex items-center justify-center text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-dark/60">
                  Subtotal
                </span>

                <span className="font-semibold">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-sm text-dark/60">
                  Discount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(e) =>
                    updateForm("discount", e.target.value)
                  }
                  placeholder="0"
                  className="w-32 rounded-lg border border-dark/10 px-3 py-2 text-right text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="text-sm text-dark/60">
                  Tax
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tax}
                  onChange={(e) =>
                    updateForm("tax", e.target.value)
                  }
                  placeholder="0"
                  className="w-32 rounded-lg border border-dark/10 px-3 py-2 text-right text-sm outline-none"
                />
              </div>

              <div className="border-t border-dark/10 pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-dark">
                    Total
                  </span>

                  <span className="text-xl font-bold text-dark">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="mb-1.5 block text-sm font-semibold text-dark">
              Notes
            </label>

            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) =>
                updateForm("notes", e.target.value)
              }
              placeholder="Additional notes for the client..."
              className="w-full resize-none rounded-xl border border-dark/10 px-3 py-2.5 text-sm outline-none"
            />
          </div>

          {/* Submit */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Quotation"
                : "Save Quotation"}
            </button>
          </div>
        </form>
      )}

      {/* Quotations table */}
      <div className="rounded-2xl border border-dark/10 bg-white">
        <div className="flex items-center justify-between border-b border-dark/10 px-5 py-4">
          <div>
            <h2 className="font-bold text-dark">
              Quotations
            </h2>

            <p className="text-sm text-dark/50">
              Real quotations stored in the database.
            </p>
          </div>

          <FileText size={20} className="text-dark/50" />
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-dark/50">
            Loading quotations...
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-10 text-center">
            <FileText
              size={32}
              className="mx-auto text-dark/30"
            />

            <p className="mt-3 font-semibold text-dark">
              No quotations yet
            </p>

            <p className="mt-1 text-sm text-dark/50">
              Create your first quotation to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-dark/10 text-left text-xs uppercase tracking-wide text-dark/50">
                  <th className="px-5 py-3">
                    Quotation
                  </th>

                  <th className="px-5 py-3">
                    Client
                  </th>

                  <th className="px-5 py-3">
                    Date
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Total
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {quotations.map((quotation) => (
                  <tr
                    key={quotation.id}
                    className="border-b border-dark/5 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-dark">
                        {quotation.quotationNo}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-dark">
                        {quotation.client?.name || "Unknown"}
                      </div>

                      {quotation.client?.company && (
                        <div className="text-xs text-dark/50">
                          {quotation.client.company}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-dark/60">
                      {quotation.issueDate
                        ? new Date(
                            quotation.issueDate
                          ).toLocaleDateString("en-IN")
                        : "-"}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-dark/5 px-3 py-1 text-xs font-semibold capitalize">
                        {quotation.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-semibold">
                      ₹
                      {Number(
                        quotation.total || 0
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(quotation)
                          }
                          className="rounded-lg p-2 text-dark/60 hover:bg-dark/5 hover:text-dark"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(quotation.id)
                          }
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
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
    </div>
  );
}