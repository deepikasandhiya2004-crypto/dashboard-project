import { useNavigate } from "react-router-dom";
import { Bell, Search, User, LogOut } from "lucide-react";
import { getUser, clearSession } from "../lib/auth.js";

export default function Header() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <header className="flex items-center justify-between border-b border-dark/10 bg-white px-6 py-4 md:px-8">
      <div className="flex w-full max-w-sm items-center gap-2 rounded-full border border-dark/15 px-4 py-2">
        <Search size={16} className="text-dark/40" />
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-transparent text-sm text-dark outline-none placeholder:text-dark/40"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 text-dark/60 hover:bg-dark/5 hover:text-dark"
        >
          <Bell size={20} />
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: "#FF6A3D" }}
          />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-dark/15 py-1 pl-1 pr-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: "#7C3AED" }}
          >
            <User size={16} />
          </div>
          <span className="text-sm text-dark" style={{ fontWeight: 600 }}>
            {user?.name || "Account"}
          </span>
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="ml-1 rounded-full p-1.5 text-dark/40 hover:bg-dark/5 hover:text-dark"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
