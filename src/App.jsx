import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import Clients from "./pages/Clients.jsx";
import Projects from "./pages/Projects.jsx";
import ProjectDetails from "./pages/ProjectDetails.jsx";
import Tasks from "./pages/Tasks.jsx";
import Marketing from "./pages/Marketing.jsx";
import Calendar from "./pages/Calendar.jsx";
import Finance from "./pages/Finance.jsx";
import Support from "./pages/Support.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";
import Proposals from "./pages/Proposals.jsx";
import Invoice from "./pages/invoice.jsx";
import Payments from "./pages/payments.jsx";
import Transactions from "./pages/transactions.jsx";



export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/projects" element={<Projects />} />
          <Route path="/proposals" element={<Proposals />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/my" element={<Tasks tab="my" />} />
        <Route path="/tasks/team" element={<Tasks tab="team" />} />
        <Route path="/tasks/:id" element={<Tasks />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/finance/invoices" element={<Invoice />} />
       <Route path="/finance/payments" element={<Payments />} />
       <Route
  path="/finance/transactions"
  element={<Transactions />}
/>
<Route path="/support" element={<Support />} />
        <Route path="/support" element={<Support />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
