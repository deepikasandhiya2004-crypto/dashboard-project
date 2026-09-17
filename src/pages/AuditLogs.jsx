import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Trash2,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";

import { api } from "../lib/api";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getAuditLogs();

      setLogs(response || []);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this audit log?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.deleteAuditLog(id);

      await loadLogs();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to delete audit log."
      );
    }
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filteredLogs = logs.filter((log) => {
    const text = `
      ${log.action || ""}
      ${log.module || ""}
      ${log.description || ""}
      ${log.user?.name || ""}
      ${log.user?.email || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#E8F8ED" }}
        >
          <FileText size={22} className="text-dark" />
        </div>

        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Audit Logs
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Track important activities and changes in the system.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mt-6 rounded-2xl border border-dark/10 bg-white p-4">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit logs..."
            className="w-full rounded-xl border border-dark/10 py-3 pl-10 pr-4 text-sm outline-none focus:border-dark"
          />
        </div>
      </div>

      {/* Logs */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-dark/10 bg-white">
        {loading ? (
          <div className="p-6 text-sm text-dark/60">
            Loading audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center">
            <FileText
              size={38}
              className="mx-auto text-dark/25"
            />

            <h2
              className="mt-4 text-lg text-dark"
              style={{ fontWeight: 700 }}
            >
              No audit logs
            </h2>

            <p className="mt-1 text-sm text-dark/50">
              System activities will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-dark/10 text-left">
                  <th className="px-5 py-4 text-xs text-dark/50">
                    User
                  </th>

                  <th className="px-5 py-4 text-xs text-dark/50">
                    Action
                  </th>

                  <th className="px-5 py-4 text-xs text-dark/50">
                    Module
                  </th>

                  <th className="px-5 py-4 text-xs text-dark/50">
                    Description
                  </th>

                  <th className="px-5 py-4 text-xs text-dark/50">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs text-dark/50">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-dark/5 last:border-0"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <p
                        className="text-sm text-dark"
                        style={{ fontWeight: 600 }}
                      >
                        {log.user?.name || "System"}
                      </p>

                      <p className="mt-1 text-xs text-dark/40">
                        {log.user?.email || "-"}
                      </p>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-dark/[0.05] px-3 py-1 text-xs text-dark">
                        {log.action}
                      </span>
                    </td>

                    {/* Module */}
                    <td className="px-5 py-4 text-sm text-dark">
                      {log.module}
                    </td>

                    {/* Description */}
                    <td className="max-w-[260px] px-5 py-4 text-sm text-dark/60">
                      <span className="line-clamp-2">
                        {log.description || "-"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-dark/60">
                      {formatDate(log.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLog(log)
                          }
                          className="rounded-lg border border-dark/10 p-2 text-dark/60 hover:bg-dark/[0.03]"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(log.id)
                          }
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
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

      {/* View Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
              <div>
                <h2
                  className="text-lg text-dark"
                  style={{ fontWeight: 700 }}
                >
                  Audit Log Details
                </h2>

                <p className="mt-1 text-xs text-dark/50">
                  Activity information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-dark/50 hover:bg-dark/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs text-dark/40">
                  User
                </p>

                <p className="mt-1 text-sm text-dark">
                  {selectedLog.user?.name || "System"}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark/40">
                  Action
                </p>

                <p className="mt-1 text-sm text-dark">
                  {selectedLog.action}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark/40">
                  Module
                </p>

                <p className="mt-1 text-sm text-dark">
                  {selectedLog.module}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark/40">
                  Description
                </p>

                <p className="mt-1 text-sm leading-6 text-dark/70">
                  {selectedLog.description || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark/40">
                  IP Address
                </p>

                <p className="mt-1 text-sm text-dark">
                  {selectedLog.ipAddress || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-dark/40">
                  Date
                </p>

                <p className="mt-1 text-sm text-dark">
                  {formatDate(selectedLog.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}