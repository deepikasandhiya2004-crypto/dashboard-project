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
 
} from "lucide-react";

const links = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/leads",
    label: "Leads",
    icon: Users,
  },
  {
    to: "/clients",
    label: "Clients / Deals",
    icon: Building2,
  },
  {
    to: "/proposals",
    label: "Proposals",
    icon: FileText,
  },
  {
    to: "/projects",
    label: "Project / Delivery",
    icon: FolderKanban,
  },
  {
    to: "/tasks",
    label: "Task",
    icon: CheckSquare,
  },
  {
    to: "/marketing",
    label: "Marketing",
    icon: Megaphone,
  },
  {
    to: "/calendar",
    label: "Calendar",
    icon: Calendar,
  },

  // Finance
  {
    to: "/finance",
    label: "Finance",
    icon: Wallet,
    
  },

  {
    to: "/support",
    label: "Support",
    icon: LifeBuoy,
  },

  {
    to: "/reports",
    label: "Report",
    icon: BarChart3,
  },

  // Settings / Administration
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
      <div
        className="px-2 text-xl"
        style={{ fontWeight: 800 }}
      >
        INFINIQ CRM
      </div>

      <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto scrollbar-hide">
        {links.map(
          ({ to, label, icon: Icon, children }) => {
            // Normal link
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

            // Section with children
            return (
              <div key={to}>
                <NavLink
                  to={to}
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
                    ({
                      to: childTo,
                      label: childLabel,
                      icon: ChildIcon,
                    }) => (
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
                        style={{ fontWeight: 500 }}
                      >
                        {ChildIcon && <ChildIcon size={15} />}
                        {childLabel}
                      </NavLink>
                    )
                  )}
                </div>
              </div>
            );
          }
        )}
      </nav>
    </aside>
  );
}