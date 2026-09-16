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
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/clients", label: "Clients / Deals", icon: Building2 },
  { to: "/projects", label: "Project / Delivery", icon: FolderKanban },
  { to: "/tasks", label: "Task", icon: CheckSquare },
  { to: "/marketing", label: "Marketing", icon: Megaphone },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/finance", label: "Finance", icon: Wallet },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/reports", label: "Report", icon: BarChart3 },
  { to: "/settings", label: "Setting / Administration", icon: SettingsIcon },
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
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive ? "bg-white/10 text-white" : "text-cream/60 hover:bg-white/5 hover:text-cream"
              }`
            }
            style={{ fontWeight: 500 }}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}