import {
  Users,
  ShieldCheck,
  KeyRound,
  Building2,
  BriefcaseBusiness,
  GitBranch,
  Bell,
  Plug,
  Lock,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const settingsItems = [
  {
    title: "Users",
    description: "Manage users and their account details.",
    icon: Users,
    path: "/settings/users",
  },
  {
    title: "Roles",
    description: "Create and manage user roles.",
    icon: ShieldCheck,
    path: "/settings/roles",
  },
  {
    title: "Permissions",
    description: "Control access to different features.",
    icon: KeyRound,
    path: "/settings/permissions",
  },
  {
    title: "Departments",
    description: "Manage departments and team structure.",
    icon: Building2,
    path: "/settings/departments",
  },
  {
    title: "Services",
    description: "Manage the services offered by your company.",
    icon: BriefcaseBusiness,
    path: "/settings/services",
  },
  {
    title: "Pipeline",
    description: "Configure your sales pipeline stages.",
    icon: GitBranch,
    path: "/settings/pipeline",
  },
  {
    title: "Notifications",
    description: "Manage notification preferences.",
    icon: Bell,
    path: "/settings/notifications",
  },
  {
    title: "Integrations",
    description: "Connect external tools and services.",
    icon: Plug,
    path: "/settings/integrations",
  },
  {
    title: "Security",
    description: "Manage account and security settings.",
    icon: Lock,
    path: "/settings/security",
  },
  {
    title: "Audit Logs",
    description: "View important account and system activities.",
    icon: ClipboardList,
    path: "/settings/audit-logs",
  },
];

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <h1
          className="text-2xl text-dark"
          style={{ fontWeight: 800 }}
        >
          Settings / Administration
        </h1>

        <p className="mt-1 text-sm text-dark/60">
          Manage users, access, workspace configuration and
          system settings.
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {settingsItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              type="button"
              onClick={() => navigate(item.path)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-dark/10 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-dark/20 hover:shadow-sm"
            >
              {/* Icon */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "#EFEBD8",
                }}
              >
                <Icon
                  size={21}
                  className="text-dark"
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h2
                  className="text-base text-dark"
                  style={{ fontWeight: 700 }}
                >
                  {item.title}
                </h2>

                <p className="mt-1 text-xs leading-5 text-dark/55">
                  {item.description}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight
                size={18}
                className="shrink-0 text-dark/30 transition-transform group-hover:translate-x-1 group-hover:text-dark/60"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}