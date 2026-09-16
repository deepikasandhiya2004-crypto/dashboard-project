import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Trash2,
  Wallet,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";
import { api } from "../lib/api.js";

const emptyForm = {
  clientId: "",
  invoiceId: "",
  amount: "",
  paymentDate: new Date().toISOString().split("T")[0],
  method: "bank_transfer",
  reference: "",
  notes: "",
};

export default function Payments() {
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD DATA
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [clientsRes, invoicesRes, paymentsRes] =
        await Promise.all([
          api.getClients(),
          api.getInvoices(),
          api.getPayments(),
        ]);

      setClients(clientsRes.data || []);
      setInvoices(invoicesRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to load payment data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // INVOICE SELECTION
  // =====================================================

  const handleInvoiceChange = (invoiceId) => {
    setForm((prev) => ({
      ...prev,
      invoiceId,
      amount: "",
    }));

    const invoice = invoices.find(
      (item) => item.id === invoiceId
    );

    setSelectedInvoice(invoice || null);

    if (invoice) {
      setForm((prev) => ({
        ...prev,
        invoiceId,
        clientId: invoice.clientId || "",
        amount: "",
      }));
    }
  };

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const invoiceTotal = Number(selectedInvoice?.total || 0);

  const paidAmount = Number(
    selectedInvoice?.paidAmount || 0
  );

  const balanceAmount = Math.max(
    0,
    invoiceTotal - paidAmount
  );

  const enteredAmount = Number(form.amount || 0);

  const remainingAfterPayment = Math.max(
    0,
    balanceAmount - enteredAmount
  );

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // =====================================================
  // CREATE PAYMENT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.invoiceId) {
      setError("Please select an invoice.");
      return;
    }

    if (!form.clientId) {
      setError("Client is required.");
      return;
    }

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (amount > balanceAmount) {
      setError(
        `Payment cannot exceed the remaining balance of ₹${balanceAmount.toLocaleString(
          "en-IN"
        )}.`
      );
      return;
    }

    try {
      setSaving(true);

      await api.createPayment({
        clientId: form.clientId,
        invoiceId: form.invoiceId,
        amount,
        paymentDate: form.paymentDate,
        method: form.method,
        reference: form.reference.trim() || null,
        notes: form.notes.trim() || null,
      });

      setSuccess("Payment recorded successfully.");

      setForm({
        ...emptyForm,
        paymentDate: new Date()
          .toISOString()
          .split("T")[0],
      });

      setSelectedInvoice(null);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to record payment."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE PAYMENT
  // =====================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.deletePayment(id);

      setSuccess("Payment deleted successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to delete payment."
      );
    }
  };

  // =====================================================
  // SUMMARY
  // =====================================================

  const totalReceived = useMemo(() => {
    return payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );
  }, [payments]);

  const totalPending = useMemo(() => {
    return invoices.reduce(
      (sum, invoice) =>
        sum + Number(invoice.balanceAmount || 0),
      0
    );
  }, [invoices]);

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "paid"
  ).length;

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getClientName = (payment) => {
    return (
      payment?.client?.name ||
      payment?.client?.companyName ||
      "Unknown Client"
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-dark">
          Payments
        </h1>

        <p className="mt-1 text-sm text-dark/60">
          Record and manage payments received from clients.
        </p>
      </div>

      {/* ALERTS */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark/60">
                Total Received
              </p>

              <h3 className="mt-2 text-2xl font-bold text-dark">
                {formatCurrency(totalReceived)}
              </h3>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <Wallet size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark/60">
                Pending Balance
              </p>

              <h3 className="mt-2 text-2xl font-bold text-dark">
                {formatCurrency(totalPending)}
              </h3>
            </div>

            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Clock3 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark/60">
                Paid Invoices
              </p>

              <h3 className="mt-2 text-2xl font-bold text-dark">
                {paidInvoices}
              </h3>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

      </div>

      {/* PAYMENT FORM */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-dark/5 p-3 text-dark">
            <CreditCard size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-dark">
              Record Payment
            </h2>

            <p className="text-sm text-dark/60">
              Add a payment against an invoice.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* BASIC INFO */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Invoice
              </label>

              <select
                value={form.invoiceId}
                onChange={(e) =>
                  handleInvoiceChange(e.target.value)
                }
                className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              >
                <option value="">
                  Select Invoice
                </option>

                {invoices.map((invoice) => (
                  <option
                    key={invoice.id}
                    value={invoice.id}
                  >
                    {invoice.invoiceNo} —{" "}
                    {invoice.client?.name ||
                      invoice.client?.companyName ||
                      "Client"}{" "}
                    — {formatCurrency(invoice.total)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Client
              </label>

              <select
                value={form.clientId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    clientId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              >
                <option value="">
                  Select Client
                </option>

                {clients.map((client) => (
                  <option
                    key={client.id}
                    value={client.id}
                  >
                    {client.name ||
                      client.companyName ||
                      "Unnamed Client"}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* INVOICE SUMMARY */}
          {selectedInvoice && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-dark/10 bg-dark/[0.02] p-4 sm:grid-cols-3">

              <div>
                <p className="text-xs text-dark/50">
                  Invoice Total
                </p>

                <p className="mt-1 text-lg font-bold text-dark">
                  {formatCurrency(invoiceTotal)}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark/50">
                  Already Paid
                </p>

                <p className="mt-1 text-lg font-bold text-green-600">
                  {formatCurrency(paidAmount)}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark/50">
                  Remaining Balance
                </p>

                <p className="mt-1 text-lg font-bold text-orange-600">
                  {formatCurrency(balanceAmount)}
                </p>
              </div>

            </div>
          )}

          {/* PAYMENT DETAILS */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Payment Amount
              </label>

              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                max={balanceAmount || undefined}
                placeholder="0.00"
                className="w-full rounded-lg border border-dark/10 px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              />

              {selectedInvoice && enteredAmount > 0 && (
                <p className="mt-2 text-xs text-dark/50">
                  Balance after payment:{" "}
                  <span className="font-semibold text-dark">
                    {formatCurrency(
                      remainingAfterPayment
                    )}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Payment Date
              </label>

              <input
                type="date"
                name="paymentDate"
                value={form.paymentDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-dark/10 px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Payment Method
              </label>

              <select
                name="method"
                value={form.method}
                onChange={handleChange}
                className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              >
                <option value="bank_transfer">
                  Bank Transfer
                </option>

                <option value="upi">
                  UPI
                </option>

                <option value="cash">
                  Cash
                </option>

                <option value="card">
                  Card
                </option>

                <option value="cheque">
                  Cheque
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>

          </div>

          {/* REFERENCE */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark">
              Payment Reference
            </label>

            <input
              type="text"
              name="reference"
              value={form.reference}
              onChange={handleChange}
              placeholder="Transaction ID / UTR / Cheque No."
              className="w-full rounded-lg border border-dark/10 px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
            />
          </div>

          {/* NOTES */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark">
              Notes
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Additional payment notes..."
              className="w-full resize-none rounded-lg border border-dark/10 px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
            />
          </div>

          {/* BUTTON */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Recording..."
                : "Record Payment"}
            </button>
          </div>

        </form>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6">

        <div className="mb-5">
          <h2 className="text-lg font-bold text-dark">
            Recent Payments
          </h2>

          <p className="mt-1 text-sm text-dark/60">
            Payments recorded in the system.
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-dark/50">
            Loading payments...
          </div>
        ) : payments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-dark/10 py-10 text-center">
            <CreditCard
              size={28}
              className="mx-auto text-dark/30"
            />

            <p className="mt-3 text-sm font-medium text-dark/60">
              No payments recorded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">

              <thead>
                <tr className="border-b border-dark/10">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Payment No
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Client
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Invoice
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Amount
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Method
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Date
                  </th>

                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-dark/5 last:border-0"
                  >
                    <td className="px-3 py-4 text-sm font-semibold text-dark">
                      {payment.paymentNo}
                    </td>

                    <td className="px-3 py-4 text-sm text-dark/70">
                      {getClientName(payment)}
                    </td>

                    <td className="px-3 py-4 text-sm text-dark/70">
                      {payment.invoice?.invoiceNo ||
                        "-"}
                    </td>

                    <td className="px-3 py-4 text-sm font-semibold text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>

                    <td className="px-3 py-4 text-sm capitalize text-dark/70">
                      {String(
                        payment.method || "-"
                      ).replace("_", " ")}
                    </td>

                    <td className="px-3 py-4 text-sm text-dark/60">
                      {formatDate(
                        payment.paymentDate
                      )}
                    </td>

                    <td className="px-3 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(payment.id)
                        }
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                        title="Delete payment"
                      >
                        <Trash2 size={17} />
                      </button>
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