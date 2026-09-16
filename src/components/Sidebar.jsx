import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  FolderKanban,
  CheckSquare,
  Megaphone,
  Calendar,
  Wallet,
  LifeBuoy,
  BarChart3,
  Settings as SettingsIcon,
  FileText,
  Receipt,
  CreditCard,
  ArrowLeftRight,
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/clients", label: "Clients / Deals", icon: Building2 },
  { to: "/proposals", label: "Proposals", icon: FileText },
  { to: "/projects", label: "Project / Delivery", icon: FolderKanban },
  { to: "/tasks", label: "Task", icon: CheckSquare },
  { to: "/marketing", label: "Marketing", icon: Megaphone },
  { to: "/calendar", label: "Calendar", icon: Calendar },

  // Finance
  {
    to: "/finance",
    label: "Finance",
    icon: Wallet,
    children: [
      {
        to: "/finance",
        label: "Quotations",
        icon: FileText,
      },
      {
        to: "/finance/invoices",
        label: "Invoices",
        icon: Receipt,
      },
      {
        to: "/finance/payments",
        label: "Payments",
        icon: CreditCard,
      },
      {
        to: "/finance/transactions",
        label: "Transactions",
        icon: ArrowLeftRight,
      },
    ],
  },

  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/reports", label: "Report", icon: BarChart3 },
  {
    to: "/settings",
    label: "Setting / Administration",
    icon: SettingsIcon,
  },
];

export default function Sidebar() {
  return (
    <aside
      className="hidden w-60 shrink-0 flex-col px-4 py-6 text-cream md:flex"
      style={{ backgroundColor: "#00373A" }}
    >
      <div className="px-2 text-xl" style={{ fontWeight: 800 }}>
        Flowline
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {links.map(({ to, label, icon: Icon, children }) => {
          // Normal links
          if (!children) {
            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-cream/60 hover:bg-white/5 hover:text-cream"
                  }`
                }
                style={{ fontWeight: 500 }}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            );
          }

          // Finance section
          return (
            <div key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-cream/60 hover:bg-white/5 hover:text-cream"
                  }`
                }
                style={{ fontWeight: 500 }}
              >
                <Icon size={18} />
                {label}
              </NavLink>

              <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-white/10 pl-3">
                {children.map(
                  ({ to: childTo, label: childLabel, icon: ChildIcon }) => (
                    <NavLink
                      key={childTo}
                      to={childTo}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-cream/50 hover:bg-white/5 hover:text-cream"
                        }`
                      }
                    >
                      <ChildIcon size={15} />
                      {childLabel}
                    </NavLink>
                  )
                )}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}