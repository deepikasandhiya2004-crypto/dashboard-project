import axios from "axios";
import { getToken, clearSession } from "./auth.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.href = "/login";
      return Promise.reject(new Error("Session expired. Please log in again."));
    }
    const message =
      error.response?.data?.error ||
      error.message ||
      `Request failed (${error.response?.status || "network error"})`;
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Auth
  register: (data) => apiClient.post("/api/auth/register", data),
  login: (data) => apiClient.post("/api/auth/login", data),
  getMe: () => apiClient.get("/api/auth/me"),
  me: () => apiClient.get("/api/auth/me"),
  forgotPassword: (data) => apiClient.post("/api/auth/forgot-password", data),
  resetPassword: (data) => apiClient.post("/api/auth/reset-password", data),

  // CRM: Leads & Clients & Deals
  getLeads: () => apiClient.get("/api/leads"),
  createLead: (data) => apiClient.post("/api/leads", data),
  updateLead: (id, data) => apiClient.patch(`/api/leads/${id}`, data),
  deleteLead: (id) => apiClient.delete(`/api/leads/${id}`),

  getClients: () => apiClient.get("/api/clients"),
  createClient: (data) => apiClient.post("/api/clients", data),
  updateClient: (id, data) => apiClient.patch(`/api/clients/${id}`, data),
  deleteClient: (id) => apiClient.delete(`/api/clients/${id}`),

  getDeals: () => apiClient.get("/api/deals"),
  createDeal: (data) => apiClient.post("/api/deals", data),
  updateDeal: (id, data) => apiClient.patch(`/api/deals/${id}`, data),
  deleteDeal: (id) => apiClient.delete(`/api/deals/${id}`),

  getProposals: () => apiClient.get("/api/proposals"),
  createProposal: (data) => apiClient.post("/api/proposals", data),
  updateProposal: (id, data) => apiClient.patch(`/api/proposals/${id}`, data),
  deleteProposal: (id) => apiClient.delete(`/api/proposals/${id}`),

  getActivities: () => apiClient.get("/api/activities"),
  createActivity: (data) => apiClient.post("/api/activities", data),
  deleteActivity: (id) => apiClient.delete(`/api/activities/${id}`),

  // Module 6: Project / Delivery
  getProjects: (params) => apiClient.get("/api/projects", { params }),
  createProject: (data) => apiClient.post("/api/projects", data),
  getProject: (id) => apiClient.get(`/api/projects/${id}`),
  updateProject: (id, data) => apiClient.patch(`/api/projects/${id}`, data),
  deleteProject: (id) => apiClient.delete(`/api/projects/${id}`),

  // Milestones
  addMilestone: (projectId, data) => apiClient.post(`/api/projects/${projectId}/milestones`, data),
  updateMilestone: (id, data) => apiClient.patch(`/api/milestones/${id}`, data),
  deleteMilestone: (id) => apiClient.delete(`/api/milestones/${id}`),

  // Project Team
  addTeamMember: (projectId, data) => apiClient.post(`/api/projects/${projectId}/team`, data),
  deleteTeamMember: (projectId, memberId) =>
    apiClient.delete(`/api/projects/${projectId}/team/${memberId}`),

  // Project Files
  addProjectFile: (projectId, data) => apiClient.post(`/api/projects/${projectId}/files`, data),
  deleteProjectFile: (projectId, fileId) =>
    apiClient.delete(`/api/projects/${projectId}/files/${fileId}`),

  // Client Feedback
  addClientFeedback: (projectId, data) =>
    apiClient.post(`/api/projects/${projectId}/feedbacks`, data),

  // Module 7: Tasks
  getTasks: (params) => apiClient.get("/api/tasks", { params }),
  getTask: (id) => apiClient.get(`/api/tasks/${id}`),
  createTask: (data) => apiClient.post("/api/tasks", data),
  updateTask: (id, data) => apiClient.patch(`/api/tasks/${id}`, data),
  deleteTask: (id) => apiClient.delete(`/api/tasks/${id}`),

  // Module 8: Marketing
  getCampaigns: () => apiClient.get("/api/marketing/campaigns"),
  createCampaign: (data) => apiClient.post("/api/marketing/campaigns", data),
  updateCampaign: (id, data) => apiClient.patch(`/api/marketing/campaigns/${id}`, data),
  deleteCampaign: (id) => apiClient.delete(`/api/marketing/campaigns/${id}`),

  getMarketingLeads: () => apiClient.get("/api/marketing/leads"),
  createMarketingLead: (data) => apiClient.post("/api/marketing/leads", data),
  updateMarketingLead: (id, data) => apiClient.patch(`/api/marketing/leads/${id}`, data),
  deleteMarketingLead: (id) => apiClient.delete(`/api/marketing/leads/${id}`),

  getMarketingContent: () => apiClient.get("/api/marketing/content"),
  createMarketingContent: (data) => apiClient.post("/api/marketing/content", data),
  updateMarketingContent: (id, data) => apiClient.patch(`/api/marketing/content/${id}`, data),
  deleteMarketingContent: (id) => apiClient.delete(`/api/marketing/content/${id}`),

  getSocialPosts: () => apiClient.get("/api/marketing/social"),
  createSocialPost: (data) => apiClient.post("/api/marketing/social", data),
  updateSocialPost: (id, data) => apiClient.patch(`/api/marketing/social/${id}`, data),
  deleteSocialPost: (id) => apiClient.delete(`/api/marketing/social/${id}`),

  getMarketingAnalytics: () => apiClient.get("/api/marketing/analytics"),

  // Module 9: Calendar
  getMeetings: () => apiClient.get("/api/calendar/meetings"),
  createMeeting: (data) => apiClient.post("/api/calendar/meetings", data),
  updateMeeting: (id, data) => apiClient.patch(`/api/calendar/meetings/${id}`, data),
  deleteMeeting: (id) => apiClient.delete(`/api/calendar/meetings/${id}`),

  getFollowups: () => apiClient.get("/api/calendar/followups"),
  createFollowup: (data) => apiClient.post("/api/calendar/followups", data),
  updateFollowup: (id, data) => apiClient.patch(`/api/calendar/followups/${id}`, data),
  deleteFollowup: (id) => apiClient.delete(`/api/calendar/followups/${id}`),

  getCalendarEvents: () => apiClient.get("/api/calendar/events"),

    // Module 10: Finance — Quotations
  getQuotations: () => apiClient.get("/api/quotations"),
  getQuotation: (id) => apiClient.get(`/api/quotations/${id}`),
  createQuotation: (data) => apiClient.post("/api/quotations", data),
  updateQuotation: (id, data) => apiClient.patch(`/api/quotations/${id}`, data),
  deleteQuotation: (id) => apiClient.delete(`/api/quotations/${id}`),
 // =====================================================
// INVOICE APIs
// =====================================================

getInvoices: () =>
  apiClient.get("/api/invoices"),

getInvoice: (id) =>
  apiClient.get(`/api/invoices/${id}`),

createInvoice: (data) =>
  apiClient.post("/api/invoices", data),

updateInvoice: (id, data) =>
  apiClient.patch(`/api/invoices/${id}`, data),

deleteInvoice: (id) =>
  apiClient.delete(`/api/invoices/${id}`),

// =====================================================
// PAYMENT APIs
// =====================================================

getPayments: () =>
  apiClient.get("/api/payments"),

getPayment: (id) =>
  apiClient.get(`/api/payments/${id}`),

createPayment: (data) =>
  apiClient.post("/api/payments", data),

deletePayment: (id) =>
  apiClient.delete(`/api/payments/${id}`),
// =====================================================
// TRANSACTION APIs
// =====================================================

getTransactions: () =>
  apiClient.get("/api/transactions"),

getTransaction: (id) =>
  apiClient.get(`/api/transactions/${id}`),

createTransaction: (data) =>
  apiClient.post("/api/transactions", data),

updateTransaction: (id, data) =>
  apiClient.patch(`/api/transactions/${id}`, data),

deleteTransaction: (id) =>
  apiClient.delete(`/api/transactions/${id}`),
// =====================================================
// SUPPORT TICKET APIs
// =====================================================

getSupportTickets: () =>
  apiClient.get("/api/support-tickets"),

getSupportTicket: (id) =>
  apiClient.get(`/api/support-tickets/${id}`),

createSupportTicket: (data) =>
  apiClient.post("/api/support-tickets", data),

updateSupportTicket: (id, data) =>
  apiClient.patch(`/api/support-tickets/${id}`, data),

deleteSupportTicket: (id) =>
  apiClient.delete(`/api/support-tickets/${id}`),
updateMyProfile: (data) =>
  apiClient.patch("/api/users/me", data),

getRoles: () =>
  apiClient.get("/api/roles"),

getRole: (id) =>
  apiClient.get(`/api/roles/${id}`),

createRole: (data) =>
  apiClient.post("/api/roles", data),

updateRole: (id, data) =>
  apiClient.patch(`/api/roles/${id}`, data),

deleteRole: (id) =>
  apiClient.delete(`/api/roles/${id}`),
// =====================================================
// REPORT APIs
// =====================================================

getReports: () =>
  apiClient.get("/api/reports"),
getPermissions: () =>
  apiClient.get("/api/permissions"),

getPermission: (id) =>
  apiClient.get(`/api/permissions/${id}`),

createPermission: (data) =>
  apiClient.post("/api/permissions", data),

updatePermission: (id, data) =>
  apiClient.patch(`/api/permissions/${id}`, data),

deletePermission: (id) =>
  apiClient.delete(`/api/permissions/${id}`),
// USERS
getUsers: () =>
  apiClient.get("/api/users"),

getUser: (id) =>
  apiClient.get(`/api/users/${id}`),

createUser: (data) =>
  apiClient.post("/api/users", data),

updateUser: (id, data) =>
  apiClient.patch(`/api/users/${id}`, data),

deleteUser: (id) =>
  apiClient.delete(`/api/users/${id}`),
getDepartments: () =>
  apiClient.get("/api/departments"),

getDepartment: (id) =>
  apiClient.get(`/api/departments/${id}`),

createDepartment: (data) =>
  apiClient.post("/api/departments", data),

updateDepartment: (id, data) =>
  apiClient.patch(`/api/departments/${id}`, data),

deleteDepartment: (id) =>
  apiClient.delete(`/api/departments/${id}`),
getServices: () =>
  apiClient.get("/api/services"),

getService: (id) =>
  apiClient.get(`/api/services/${id}`),

createService: (data) =>
  apiClient.post("/api/services", data),

updateService: (id, data) =>
  apiClient.patch(`/api/services/${id}`, data),

deleteService: (id) =>
  apiClient.delete(`/api/services/${id}`),
getNotificationSettings: () =>
  apiClient.get("/api/notification-settings"),

updateNotificationSettings: (data) =>
  apiClient.patch(
    "/api/notification-settings",
    data
  ),
  getIntegrations: () =>
  apiClient.get("/api/integrations"),

getIntegration: (id) =>
  apiClient.get(`/api/integrations/${id}`),

createIntegration: (data) =>
  apiClient.post("/api/integrations", data),

updateIntegration: (id, data) =>
  apiClient.patch(`/api/integrations/${id}`, data),

deleteIntegration: (id) =>
  apiClient.delete(`/api/integrations/${id}`),
updatePassword: (data) =>
  apiClient.patch("/api/security/password", data),
getAuditLogs: () =>
  apiClient.get("/api/audit-logs"),

getAuditLog: (id) =>
  apiClient.get(`/api/audit-logs/${id}`),

createAuditLog: (data) =>
  apiClient.post("/api/audit-logs", data),

deleteAuditLog: (id) =>
  apiClient.delete(`/api/audit-logs/${id}`),
};
