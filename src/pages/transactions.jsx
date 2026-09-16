import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Trash2,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api } from "../lib/api.js";

const emptyForm = {
  clientId: "",
  invoiceId: "",
  type: "income",
  category: "client_payment",
  amount: "",
  description: "",
  transactionDate: new Date().toISOString().split("T")[0],
  reference: "",
};

export default function Transactions() {
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [clientsData, invoicesData, transactionsData] =
        await Promise.all([
          api.getClients(),
          api.getInvoices(),
          api.getTransactions(),
        ]);

      setClients(clientsData || []);
      setInvoices(invoicesData || []);
      setTransactions(transactionsData || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to load transaction data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleInvoiceChange = (invoiceId) => {
    const invoice = invoices.find(
      (item) => item.id === invoiceId
    );

    setForm((prev) => ({
      ...prev,
      invoiceId,
      clientId: invoice?.clientId || prev.clientId,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const amount = Number(form.amount);

    if (!form.type) {
      setError("Please select transaction type.");
      return;
    }

    if (!form.category) {
      setError("Please select transaction category.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Please enter a valid transaction amount.");
      return;
    }

    try {
      setSaving(true);

      await api.createTransaction({
        clientId: form.clientId || null,
        invoiceId: form.invoiceId || null,
        type: form.type,
        category: form.category,
        amount,
        description:
          form.description.trim() || null,
        transactionDate: form.transactionDate,
        reference:
          form.reference.trim() || null,
      });

      setSuccess("Transaction recorded successfully.");

      setForm({
        ...emptyForm,
        transactionDate: new Date()
          .toISOString()
          .split("T")[0],
      });

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to create transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.deleteTransaction(id);

      setSuccess("Transaction deleted successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to delete transaction."
      );
    }
  };

  const totalIncome = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          String(transaction.type).toLowerCase() ===
          "income"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          String(transaction.type).toLowerCase() ===
          "expense"
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );
  }, [transactions]);

  const netBalance = totalIncome - totalExpense;

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

  const getClientName = (transaction) => {
    return (
      transaction?.client?.name ||
      transaction?.client?.companyName ||
      "—"
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-dark">
          Transactions
        </h1>

        <p className="mt-1 text-sm text-dark/60">
          Track income, expenses and other financial
          transactions.
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
                Total Income
              </p>

              <h3 className="mt-2 text-2xl font-bold text-dark">
                {formatCurrency(totalIncome)}
              </h3>
            </div>

            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark/60">
                Total Expenses
              </p>

              <h3 className="mt-2 text-2xl font-bold text-dark">
                {formatCurrency(totalExpense)}
              </h3>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-red-600">
              <TrendingDown size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dark/10 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-dark/60">
                Net Balance
              </p>

              <h3 className="mt-2 text-2xl font-bold text-dark">
                {formatCurrency(netBalance)}
              </h3>
            </div>

            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Wallet size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ADD TRANSACTION */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-dark/5 p-3 text-dark">
            <Plus size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-dark">
              Add Transaction
            </h2>

            <p className="text-sm text-dark/60">
              Record an income or expense transaction.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* TYPE + CATEGORY */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Transaction Type
              </label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              >
                <option value="income">
                  Income
                </option>

                <option value="expense">
                  Expense
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full rounded-lg border border-dark/10 bg-white px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              >
                <option value="client_payment">
                  Client Payment
                </option>

                <option value="sales">
                  Sales
                </option>

                <option value="salary">
                  Salary
                </option>

                <option value="office_expense">
                  Office Expense
                </option>

                <option value="software">
                  Software
                </option>

                <option value="marketing">
                  Marketing
                </option>

                <option value="tax">
                  Tax
                </option>

                <option value="other">
                  Other
                </option>
              </select>
            </div>
          </div>

          {/* CLIENT + INVOICE */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Client
              </label>

              <select
                name="clientId"
                value={form.clientId}
                onChange={handleChange}
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

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Invoice
              </label>

              <select
                name="invoiceId"
                value={form.invoiceId}
                onChange={(e) =>
                  handleInvoiceChange(
                    e.target.value
                  )
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
                    {formatCurrency(invoice.total)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* AMOUNT + DATE + REFERENCE */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Amount
              </label>

              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-dark/10 px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Transaction Date
              </label>

              <input
                type="date"
                name="transactionDate"
                value={form.transactionDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-dark/10 px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-dark">
                Reference
              </label>

              <input
                type="text"
                name="reference"
                value={form.reference}
                onChange={handleChange}
                placeholder="Payment / UTR / Reference"
                className="w-full rounded-lg border border-dark/10 px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-dark">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter transaction details..."
              className="w-full resize-none rounded-lg border border-dark/10 px-3 py-2.5 text-sm text-dark outline-none focus:border-dark/30"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-dark px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>

      {/* TRANSACTION TABLE */}
      <div className="rounded-2xl border border-dark/10 bg-white p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-dark">
            Recent Transactions
          </h2>

          <p className="mt-1 text-sm text-dark/60">
            All recorded financial transactions.
          </p>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-dark/50">
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-dark/10 py-10 text-center">
            <ArrowLeftRight
              size={28}
              className="mx-auto text-dark/30"
            />

            <p className="mt-3 text-sm font-medium text-dark/60">
              No transactions recorded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead>
                <tr className="border-b border-dark/10">
                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Transaction
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Client
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Type
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Category
                  </th>

                  <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Amount
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
                {transactions.map((transaction) => {
                  const isIncome =
                    String(transaction.type).toLowerCase() ===
                    "income";

                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-dark/5 last:border-0"
                    >
                      <td className="px-3 py-4">
                        <p className="text-sm font-semibold text-dark">
                          {transaction.transactionNo}
                        </p>

                        {transaction.description && (
                          <p className="mt-1 max-w-[240px] truncate text-xs text-dark/50">
                            {transaction.description}
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-4 text-sm text-dark/70">
                        {getClientName(transaction)}
                      </td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isIncome
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {isIncome
                            ? "Income"
                            : "Expense"}
                        </span>
                      </td>

                      <td className="px-3 py-4 text-sm capitalize text-dark/70">
                        {String(
                          transaction.category || "-"
                        ).replaceAll("_", " ")}
                      </td>

                      <td
                        className={`px-3 py-4 text-sm font-semibold ${
                          isIncome
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(
                          transaction.amount
                        )}
                      </td>

                      <td className="px-3 py-4 text-sm text-dark/60">
                        {formatDate(
                          transaction.transactionDate
                        )}
                      </td>

                      <td className="px-3 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              transaction.id
                            )
                          }
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                          title="Delete transaction"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}