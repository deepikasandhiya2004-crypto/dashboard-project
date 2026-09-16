import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  CircleHelp,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { getUser, clearSession } from "../lib/auth.js";

export default function Header() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <header
      style={{
        width: "100%",
        padding: "32px 30px 0 30px",
        background: "#F7F5E9",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "22px",
        }}
      >
        {/* ================= SEARCH ================= */}

        <div
          style={{
            flex: 1,
            height: "40px",
            maxWidth: "810px",
            border: "1px solid rgba(0,55,58,0.22)",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            boxSizing: "border-box",
            background: "#F7F5E9",
          }}
        >
          <Search
            size={25}
            strokeWidth={2}
            color="rgba(0,55,58,0.25)"
          />

          <input
            type="text"
            placeholder="Search across leads, accounts, and tasks..."
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "0 8px",
              fontSize: "12px",
              color: "#00373A",
              fontFamily: "Gellix, sans-serif",
            }}
          />
        </div>


        {/* ================= RIGHT ICONS ================= */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginLeft: "auto",
          }}
        >

          {/* NOTIFICATION */}

          <button
            type="button"
            aria-label="Notifications"
            style={{
              position: "relative",
              width: "24px",
              height: "24px",
              padding: 0,
              border: "none",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Bell
              size={22}
              strokeWidth={1.8}
              color="rgba(0,55,58,0.28)"
            />

            <span
              style={{
                position: "absolute",
                top: "1px",
                right: "0px",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#E00000",
              }}
            />
          </button>


          {/* HELP */}

          <button
            type="button"
            aria-label="Help"
            style={{
              width: "24px",
              height: "24px",
              padding: 0,
              border: "none",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <CircleHelp
              size={22}
              strokeWidth={1.8}
              color="rgba(0,55,58,0.28)"
            />
          </button>


          {/* SETTINGS */}

          <button
            type="button"
            aria-label="Settings"
            onClick={() => navigate("/settings")}
            style={{
              width: "24px",
              height: "24px",
              padding: 0,
              border: "none",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Settings
              size={23}
              strokeWidth={1.8}
              color="rgba(0,55,58,0.28)"
            />
          </button>


          {/* ================= PROFILE ================= */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "2px",
            }}
          >

            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid rgba(0,55,58,0.25)",
                background:
                  "linear-gradient(135deg, #d8b08c, #76513d)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "I"}
            </div>

            <span
              style={{
                fontSize: "13px",
                lineHeight: "18px",
                color: "#202020",
                fontWeight: 600,
              }}
            >
              {user?.name || "Isha"}
            </span>

          </div>


          {/* ================= LOGOUT ================= */}

          <button
            type="button"
            aria-label="Logout"
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              border: "1px solid rgba(0,55,58,0.22)",
              borderRadius: "10px",
              background: "transparent",
              color: "#00373A",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LogOut size={16} strokeWidth={1.8} />
            Logout
          </button>

        </div>
      </div>
    </header>
  );
}