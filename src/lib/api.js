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
};
