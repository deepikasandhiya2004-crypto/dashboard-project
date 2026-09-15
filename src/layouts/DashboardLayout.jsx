import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Header from "../components/Header.jsx";

export default function DashboardLayout() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#F7F5E9",
      }}
    >
      {/* SIDEBAR */}

      <Sidebar />

      {/* MAIN AREA */}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "#F7F5E9",
        }}
      >

        {/* TOP NAVBAR */}

        <Header />

        {/* PAGE CONTENT */}

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "34px 30px 30px 30px",
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
}