import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { api } from "../lib/api.js";

const emptyItem = () => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
});

export default function Invoice() {
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [form, setForm] = useState({
    clientId: "",
    quotationId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "draft",
    discount: 0,
    tax: 0,
    notes: "",
  });

  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError("");

      const [clientsRes, quotationsRes] = await Promise.all([
        api.getClients(),
        api.getQuotations(),
      ]);

      setClients(clientsRes.data || []);
      setQuotations(quotationsRes.data || []);

      // Invoice endpoint may not exist yet
      try {
        const invoicesRes = await api.getInvoices();
        setInvoices(invoicesRes.data || []);
      } catch {
        setInvoices([]);
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          "Failed to load invoice data."
      );
    }
  };

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;

      return sum + quantity * unitPrice;
    }, 0);
  }, [items]);

  const total = useMemo(() => {
    const discount = Number(form.discount) || 0;
    const tax = Number(form.tax) || 0;

    return Math.max(0, subtotal - discount + tax);
  }, [subtotal, form.discount, form.tax]);

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptyItem()]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;

    setItems((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  // =====================================================
  // LOAD QUOTATION INTO INVOICE
  // =====================================================

  const handleQuotationChange = async (quotationId) => {
    updateForm("quotationId", quotationId);

    if (!quotationId) return;

    try {
      const response = await api.getQuotation(quotationId);
      const quotation = response.data;

      setForm((prev) => ({
        ...prev,
        quotationId,
        clientId: quotation.clientId || "",
        issueDate: quotation.issueDate
          ? quotation.issueDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        discount: quotation.discount || 0,
        tax: quotation.tax || 0,
        notes: quotation.notes || "",
      }));

      setItems(
        (quotation.items || []).map((item) => ({
          description: item.description || "",
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        }))
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to load quotation."
      );
    }
  };

  // =====================================================
  // CREATE INVOICE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!form.clientId) {
      setError("Please select a client.");
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.description.trim() &&
        Number(item.quantity) > 0
    );

    if (validItems.length === 0) {
      setError("Please add at least one valid item.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        clientId: form.clientId,
        quotationId: form.quotationId || null,
        issueDate: form.issueDate || null,
        dueDate: form.dueDate || null,
        status: form.status,
        discount: Number(form.discount) || 0,
        tax: Number(form.tax) || 0,
        notes: form.notes || null,

        items: validItems.map((item) => ({
          description: item.description.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      const response = await api.createInvoice(payload);

      setInvoices((prev) => [
        response.data,
        ...prev,
      ]);

      setMessage("Invoice created successfully.");

      // Reset form
      setForm({
        clientId: "",
        quotationId: "",
        issueDate: new Date()
          .toISOString()
          .split("T")[0],
        dueDate: "",
        status: "draft",
        discount: 0,
        tax: 0,
        notes: "",
      });

      setItems([emptyItem()]);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to create invoice."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const money = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  // =====================================================
  // UI
  // =====================================================

  return (
   <div className="space-y-6">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#193f3a] text-white">
                <FileText size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#193f3a] md:text-3xl">
                  Invoices
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Create and manage client invoices
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {/* CREATE INVOICE CARD */}
        <form
          onSubmit={handleSubmit}
        className="rounded-2xl border border-dark/10 bg-white p-6"
        >
          {/* BASIC DETAILS */}
          <div className="mb-7">
            <h2 className="mb-5 text-lg font-semibold text-[#193f3a]">
              Invoice Details
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

              {/* CLIENT */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Client
                </label>

                <select
                  value={form.clientId}
                  onChange={(e) =>
                    updateForm("clientId", e.target.value)
                  }
                  className="w-full rounded-xl border border-dark/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#193f3a] focus:ring-2 focus:ring-[#193f3a]/10"
                >
                  <option value="">Select client</option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name ||
                        client.companyName ||
                        client.email ||
                        "Unnamed Client"}
                    </option>
                  ))}
                </select>
              </div>

              {/* QUOTATION */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Quotation
                </label>

                <select
                  value={form.quotationId}
                  onChange={(e) =>
                    handleQuotationChange(e.target.value)
                  }
                  className="w-full rounded-xl border border-dark/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#193f3a] focus:ring-2 focus:ring-[#193f3a]/10"
                >
                  <option value="">
                    Select quotation
                  </option>

                  {quotations.map((quotation) => (
                    <option
                      key={quotation.id}
                      value={quotation.id}
                    >
                      {quotation.quotationNo}
                    </option>
                  ))}
                </select>
              </div>

              {/* ISSUE DATE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Issue Date
                </label>

                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) =>
                    updateForm(
                      "issueDate",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-[#193f3a] focus:ring-2 focus:ring-[#193f3a]/10"
                />
              </div>

              {/* DUE DATE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    updateForm(
                      "dueDate",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-[#193f3a] focus:ring-2 focus:ring-[#193f3a]/10"
                />
              </div>
            </div>
          </div>

          {/* ITEMS */}
          <div className="mb-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#193f3a]">
                Invoice Items
              </h2>

              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 rounded-xl bg-[#193f3a] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                <Plus size={17} />
                Add Item
              </button>
            </div>

            {/* DESKTOP HEADER */}
            <div className="hidden rounded-xl bg-[#f5f2e8] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 md:grid md:grid-cols-[2fr_110px_150px_140px_40px] md:gap-3">
              <div>Description</div>
              <div>Quantity</div>
              <div>Unit Price</div>
              <div>Total</div>
              <div></div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const itemTotal =
                  (Number(item.quantity) || 0) *
                  (Number(item.unitPrice) || 0);

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 gap-3 rounded-xl border border-dark/10 p-4 md:grid-cols-[2fr_110px_150px_140px_40px] md:items-center md:gap-3 md:border-0 md:p-0"
                  >
                    {/* DESCRIPTION */}
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
                      className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-[#193f3a] focus:ring-2 focus:ring-[#193f3a]/10"
                    />

                    {/* QUANTITY */}
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-[#193f3a] focus:ring-2 focus:ring-[#193f3a]/10"
                    />

                    {/* UNIT PRICE */}
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unitPrice",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-[#193f3a] focus:ring-2 focus:ring-[#193f3a]/10"
                    />

                    {/* TOTAL */}
                    <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold text-[#193f3a]">
                      {money(itemTotal)}
                    </div>

                    {/* DELETE */}
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(index)
                      }
                      disabled={items.length === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">

            {/* NOTES */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notes
              </label>

              <textarea
                rows="6"
                value={form.notes}
                onChange={(e) =>
                  updateForm("notes", e.target.value)
                }
                placeholder="Add invoice notes..."
                className="w-full resize-none rounded-xl border border-dark/10 px-4 py-3 text-sm outline-none focus:border-[#193f3a] focus:ring-2 focus:ring-[#193f3a]/10"
              />
            </div>

            {/* SUMMARY */}
            <div className="rounded-2xl bg-[#f5f2e8] p-5">
              <h2 className="mb-5 text-lg font-semibold text-[#193f3a]">
                Invoice Summary
              </h2>

              <div className="space-y-4">

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span className="font-semibold text-gray-800">
                    {money(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-5">
                  <span className="text-sm text-gray-600">
                    Discount
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) =>
                      updateForm(
                        "discount",
                        e.target.value
                      )
                    }
                    className="w-32 rounded-lg border border-dark/10 bg-white px-3 py-2 text-right text-sm outline-none focus:border-[#193f3a]"
                  />
                </div>

                <div className="flex items-center justify-between gap-5">
                  <span className="text-sm text-gray-600">
                    Tax
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.tax}
                    onChange={(e) =>
                      updateForm(
                        "tax",
                        e.target.value
                      )
                    }
                    className="w-32 rounded-lg border border-dark/10 bg-white px-3 py-2 text-right text-sm outline-none focus:border-[#193f3a]"
                  />
                </div>

                <div className="border-t border-dark/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-[#193f3a]">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-[#193f3a]">
                      {money(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STATUS + SAVE */}
          <div className="mt-7 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                value={form.status}
                onChange={(e) =>
                  updateForm(
                    "status",
                    e.target.value
                  )
                }
                className="rounded-xl border border-dark/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#193f3a]"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#193f3a] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />

              {loading
                ? "Saving..."
                : "Save Invoice"}
            </button>
          </div>
        </form>

        {/* INVOICE LIST */}
        {invoices.length > 0 && (
          <div className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
            <h2 className="mb-5 text-lg font-semibold text-[#193f3a]">
              Recent Invoices
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">
                      Invoice No
                    </th>

                    <th className="px-4 py-3">
                      Client
                    </th>

                    <th className="px-4 py-3">
                      Date
                    </th>

                    <th className="px-4 py-3">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-[#193f3a]">
                        {invoice.invoiceNo}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {invoice.client?.name ||
                          invoice.client?.companyName ||
                          "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {invoice.issueDate
                          ? new Date(
                              invoice.issueDate
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                          {invoice.status ||
                            "draft"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right text-sm font-semibold text-[#193f3a]">
                        {money(invoice.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    
  );
}