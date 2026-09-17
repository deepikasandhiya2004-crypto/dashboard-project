import { useEffect, useState } from "react";
import {
  Bell,
  Mail,
  CheckSquare,
  Users,
  FolderKanban,
  CreditCard,
  Headphones,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { api } from "../lib/api";

const notificationOptions = [
  {
    key: "emailNotifications",
    title: "Email Notifications",
    description: "Receive important updates through email.",
    icon: Mail,
  },
  {
    key: "taskNotifications",
    title: "Task Notifications",
    description: "Get notified about task assignments and updates.",
    icon: CheckSquare,
  },
  {
    key: "leadNotifications",
    title: "Lead Notifications",
    description: "Receive updates when leads are created or changed.",
    icon: Users,
  },
  {
    key: "projectNotifications",
    title: "Project Notifications",
    description: "Get updates about project activities and progress.",
    icon: FolderKanban,
  },
  {
    key: "paymentNotifications",
    title: "Payment Notifications",
    description: "Receive notifications about payments and invoices.",
    icon: CreditCard,
  },
  {
    key: "supportNotifications",
    title: "Support Notifications",
    description: "Get notified about support ticket updates.",
    icon: Headphones,
  },
];

export default function Notifications() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    taskNotifications: true,
    leadNotifications: true,
    projectNotifications: true,
    paymentNotifications: true,
    supportNotifications: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getNotificationSettings();

      setSettings({
        emailNotifications:
          response?.emailNotifications ?? true,

        taskNotifications:
          response?.taskNotifications ?? true,

        leadNotifications:
          response?.leadNotifications ?? true,

        projectNotifications:
          response?.projectNotifications ?? true,

        paymentNotifications:
          response?.paymentNotifications ?? true,

        supportNotifications:
          response?.supportNotifications ?? true,
      });
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load notification settings."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleToggle(key) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    setSaved(false);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setSaved(false);

      await api.updateNotificationSettings(settings);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save notification settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1
          className="text-2xl text-dark"
          style={{ fontWeight: 800 }}
        >
          Notifications
        </h1>

        <div className="mt-6 rounded-2xl border border-dark/10 bg-white p-6">
          <p className="text-sm text-dark/60">
            Loading notification settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#E8F8ED" }}
        >
          <Bell size={22} className="text-dark" />
        </div>

        <div>
          <h1
            className="text-2xl text-dark"
            style={{ fontWeight: 800 }}
          >
            Notifications
          </h1>

          <p className="mt-1 text-sm text-dark/60">
            Manage how you receive notifications.
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

      {/* Settings */}
      <div className="mt-6 rounded-2xl border border-dark/10 bg-white">
        <div className="border-b border-dark/10 px-6 py-5">
          <h2
            className="text-lg text-dark"
            style={{ fontWeight: 700 }}
          >
            Notification Preferences
          </h2>

          <p className="mt-1 text-sm text-dark/50">
            Choose which notifications you want to receive.
          </p>
        </div>

        <div className="divide-y divide-dark/10">
          {notificationOptions.map((option) => {
            const Icon = option.icon;
            const enabled = settings[option.key];

            return (
              <div
                key={option.key}
                className="flex items-center justify-between gap-5 px-6 py-5"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: enabled
                        ? "#E8F8ED"
                        : "#F3F3F3",
                    }}
                  >
                    <Icon
                      size={19}
                      className="text-dark"
                    />
                  </div>

                  <div>
                    <h3
                      className="text-sm text-dark"
                      style={{ fontWeight: 650 }}
                    >
                      {option.title}
                    </h3>

                    <p className="mt-1 text-xs text-dark/50">
                      {option.description}
                    </p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    handleToggle(option.key)
                  }
                  className="relative h-6 w-11 shrink-0 rounded-full transition"
                  style={{
                    backgroundColor: enabled
                      ? "#00DC46"
                      : "#D1D5DB",
                  }}
                  aria-label={`Toggle ${option.title}`}
                >
                  <span
                    className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all"
                    style={{
                      left: enabled ? "24px" : "4px",
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3 border-t border-dark/10 px-6 py-5">
          {saved && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 size={17} />
              Settings saved
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm text-dark disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: "#00DC46",
              fontWeight: 700,
            }}
          >
            <Save size={17} />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}