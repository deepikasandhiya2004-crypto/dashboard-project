import { useEffect, useMemo, useState } from "react";
import {
  LifeBuoy,
  Plus,
  Trash2,
  Pencil,
  X,
  Search,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Ticket,
} from "lucide-react";
import { api } from "../lib/api.js";

const emptyForm = {
  clientId: "",
  subject: "",
  description: "",
  status: "open",
  priority: "medium",
  category: "general",
  assignedTo: "",
};

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const categoryOptions = [
  { value: "general", label: "General" },
  { value: "technical", label: "Technical" },
  { value: "billing", label: "Billing" },
  { value: "website", label: "Website" },
  { value: "mobile", label: "Mobile App" },
  { value: "other", label: "Other" },
];

export default function Support() {
  const [clients, setClients] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [clientsData, ticketsData] = await Promise.all([
        api.getClients(),
        api.getSupportTickets(),
      ]);

      setClients(clientsData || []);
      setTickets(ticketsData || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to load support tickets."
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

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const handleEdit = (ticket) => {
    setEditingId(ticket.id);

    setForm({
      clientId: ticket.clientId || "",
      subject: ticket.subject || "",
      description: ticket.description || "",
      status: ticket.status || "open",
      priority: ticket.priority || "medium",
      category: ticket.category || "general",
      assignedTo: ticket.assignedTo || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.subject.trim()) {
      setError("Subject is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        clientId: form.clientId || null,
        subject: form.subject.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        category: form.category,
        assignedTo: form.assignedTo.trim() || null,
      };

      if (editingId) {
        await api.updateSupportTicket(editingId, payload);
        setSuccess("Support ticket updated successfully.");
      } else {
        await api.createSupportTicket(payload);
        setSuccess("Support ticket created successfully.");
      }

      closeForm();
      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to save support ticket."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this support ticket?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.deleteSupportTicket(id);

      setSuccess("Support ticket deleted successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to delete support ticket."
      );
    }
  };

  const updateStatus = async (ticket, status) => {
    try {
      setError("");
      setSuccess("");

      await api.updateSupportTicket(ticket.id, {
        status,
      });

      setSuccess("Ticket status updated.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          "Failed to update ticket status."
      );
    }
  };

  const getClientName = (ticket) => {
    return (
      ticket?.client?.name ||
      ticket?.client?.company ||
      "No Client"
    );
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    if (activeFilter !== "all") {
      result = result.filter(
        (ticket) => ticket.status === activeFilter
      );
    }

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((ticket) => {
        const clientName = getClientName(ticket);

        return (
          ticket.ticketNo?.toLowerCase().includes(searchValue) ||
          ticket.subject?.toLowerCase().includes(searchValue) ||
          clientName.toLowerCase().includes(searchValue) ||
          ticket.category?.toLowerCase().includes(searchValue)
        );
      });
    }

    return result;
  }, [tickets, activeFilter, search]);

  const allCount = tickets.length;

  const openCount = tickets.filter(
    (ticket) => ticket.status === "open"
  ).length;

  const progressCount = tickets.filter(
    (ticket) => ticket.status === "in_progress"
  ).length;

  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "resolved"
  ).length;

  const closedCount = tickets.filter(
    (ticket) => ticket.status === "closed"
  ).length;

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-700";

      case "in_progress":
        return "bg-yellow-100 text-yellow-700";

      case "resolved":
        return "bg-green-100 text-green-700";

      case "closed":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatStatus = (status) => {
    return (
      status
        ?.replace("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()) ||
      "-"
    );
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark">
            Support
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Manage customer support tickets and requests.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-dark px-5 py-3 text-sm font-semibold text-cream transition hover:opacity-90"
        >
          <Plus size={18} />
          Create Ticket
        </button>
      </div>

      {/* SUCCESS / ERROR */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {error && !showForm && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <SummaryCard
          icon={Ticket}
          title="All Tickets"
          value={allCount}
          active={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />

        <SummaryCard
          icon={AlertCircle}
          title="Open"
          value={openCount}
          active={activeFilter === "open"}
          onClick={() => setActiveFilter("open")}
        />

        <SummaryCard
          icon={Clock3}
          title="In Progress"
          value={progressCount}
          active={activeFilter === "in_progress"}
          onClick={() => setActiveFilter("in_progress")}
        />

        <SummaryCard
          icon={CheckCircle2}
          title="Resolved"
          value={resolvedCount}
          active={activeFilter === "resolved"}
          onClick={() => setActiveFilter("resolved")}
        />

        <SummaryCard
          icon={LifeBuoy}
          title="Closed"
          value={closedCount}
          active={activeFilter === "closed"}
          onClick={() => setActiveFilter("closed")}
        />

      </div>

      {/* SEARCH */}
      <div className="flex flex-col gap-3 rounded-xl border border-dark/10 bg-white p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40"
          />

          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-dark/10 bg-cream/30 py-2.5 pl-10 pr-4 text-sm text-dark outline-none focus:border-dark/30"
          />
        </div>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="rounded-lg border border-dark/10 bg-white px-4 py-2.5 text-sm text-dark outline-none"
        >
          <option value="all">All Tickets</option>
          {statusOptions.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* TICKET TABLE */}
      <div className="overflow-hidden rounded-xl border border-dark/10 bg-white">

        <div className="border-b border-dark/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-dark">
            Support Tickets
          </h2>

          <p className="mt-1 text-sm text-dark/50">
            {filteredTickets.length} ticket
            {filteredTickets.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-dark/50">
            Loading support tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <LifeBuoy
              size={38}
              className="mx-auto text-dark/20"
            />

            <p className="mt-3 text-sm font-medium text-dark/60">
              No support tickets found.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 text-sm font-semibold text-dark underline"
            >
              Create your first ticket
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-dark/10 bg-cream/30 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Ticket
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Client
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Priority
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50">
                    Created
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-dark/50 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-dark/10 last:border-b-0 hover:bg-cream/20"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-dark">
                        {ticket.ticketNo}
                      </span>
                    </td>

                    <td className="max-w-[260px] px-6 py-4">
                      <p className="truncate font-medium text-dark">
                        {ticket.subject}
                      </p>

                      {ticket.category && (
                        <p className="mt-1 text-xs capitalize text-dark/40">
                          {ticket.category}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-dark/70">
                      {getClientName(ticket)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPriorityClass(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={ticket.status}
                        onChange={(e) =>
                          updateStatus(
                            ticket,
                            e.target.value
                          )
                        }
                        className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${getStatusClass(
                          ticket.status
                        )}`}
                      >
                        {statusOptions.map((status) => (
                          <option
                            key={status.value}
                            value={status.value}
                          >
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4 text-sm text-dark/60">
                      {formatDate(ticket.createdAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">

                        <button
                          type="button"
                          onClick={() => handleEdit(ticket)}
                          className="rounded-lg p-2 text-dark/50 transition hover:bg-dark/5 hover:text-dark"
                          title="Edit"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(ticket.id)
                          }
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={17} />
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

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

            {/* FORM HEADER */}
            <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-dark">
                  {editingId
                    ? "Edit Support Ticket"
                    : "Create Support Ticket"}
                </h2>

                <p className="mt-1 text-sm text-dark/50">
                  Add or update customer support details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg p-2 text-dark/50 hover:bg-dark/5 hover:text-dark"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              {/* CLIENT */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark">
                  Client
                </label>

                <select
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 text-sm text-dark outline-none focus:border-dark/30"
                >
                  <option value="">
                    No Client
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.name}
                      {client.company
                        ? ` - ${client.company}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* SUBJECT */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark">
                  Subject *
                </label>

                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Enter ticket subject"
                  className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 text-sm text-dark outline-none focus:border-dark/30"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="mb-2 block text-sm font-medium text-dark">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the issue or request..."
                  className="w-full resize-none rounded-lg border border-dark/10 bg-white px-4 py-3 text-sm text-dark outline-none focus:border-dark/30"
                />
              </div>

              {/* STATUS / PRIORITY */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-dark">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 text-sm text-dark outline-none focus:border-dark/30"
                  >
                    {statusOptions.map((status) => (
                      <option
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-dark">
                    Priority
                  </label>

                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 text-sm text-dark outline-none focus:border-dark/30"
                  >
                    {priorityOptions.map((priority) => (
                      <option
                        key={priority.value}
                        value={priority.value}
                      >
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* CATEGORY / ASSIGNED */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-dark">
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 text-sm text-dark outline-none focus:border-dark/30"
                  >
                    {categoryOptions.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-dark">
                    Assigned To
                  </label>

                  <input
                    type="text"
                    name="assignedTo"
                    value={form.assignedTo}
                    onChange={handleChange}
                    placeholder="Team member name"
                    className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 text-sm text-dark outline-none focus:border-dark/30"
                  />
                </div>

              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-3 border-t border-dark/10 pt-5">

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-dark/10 px-5 py-3 text-sm font-semibold text-dark transition hover:bg-dark/5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-dark px-6 py-3 text-sm font-semibold text-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Ticket"
                    : "Create Ticket"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border bg-white p-5 text-left transition ${
        active
          ? "border-dark/30 shadow-sm"
          : "border-dark/10 hover:border-dark/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-dark/50">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-dark">
            {value}
          </p>
        </div>

        <div className="rounded-lg bg-dark/5 p-3 text-dark">
          <Icon size={20} />
        </div>
      </div>
    </button>
  );
}