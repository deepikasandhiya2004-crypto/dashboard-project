import { useEffect, useMemo, useRef, useState } from "react";
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
import { api } from "../lib/api.js";

export default function Header() {
  const navigate = useNavigate();
  const user = getUser();

  const [notifOpen, setNotifOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    Promise.all([api.getLeads(), api.getTasks(), api.getProjects()])
      .then(([l, t, p]) => {
        setLeads(l);
        setTasks(t);
        setProjects(p);
      })
      .catch(() => {});
  }, []);

  // Close the dropdown when clicking outside it
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    const items = [
      ...leads.map((l) => ({ text: `New lead: ${l.name}`, date: l.createdAt })),
      ...tasks.map((t) => ({ text: `Task created: ${t.title}`, date: t.createdAt })),
      ...projects.map((p) => ({ text: `Project created: ${p.name}`, date: p.createdAt })),
    ];
    return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  }, [leads, tasks, projects]);

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

          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setNotifOpen((v) => !v)}
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

              {notifications.length > 0 && (
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
              )}
            </button>

            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "34px",
                  right: 0,
                  width: "300px",
                  maxHeight: "320px",
                  overflowY: "auto",
                  background: "#FAF9F0",
                  border: "1px solid rgba(0,55,58,0.16)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  zIndex: 50,
                  padding: "10px",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#00373A", padding: "4px 6px" }}>
                  Recent activity
                </div>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "rgba(0,55,58,0.4)", padding: "10px 6px" }}>
                    Nothing yet.
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 6px",
                        borderTop: i === 0 ? "none" : "1px solid rgba(0,55,58,0.08)",
                      }}
                    >
                      <div style={{ fontSize: "12px", color: "#202020" }}>{n.text}</div>
                      <div style={{ fontSize: "10px", color: "rgba(0,55,58,0.35)", marginTop: "2px" }}>
                        {new Date(n.date).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>


          {/* HELP */}

          <button
            type="button"
            aria-label="Help"
            onClick={() => navigate("/support")}
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
              {user?.name || "User"}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px",
                background: "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "rgba(0,55,58,0.45)",
                marginLeft: "4px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FF6A3D")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,55,58,0.45)")}
            >
              <LogOut size={17} strokeWidth={2} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}