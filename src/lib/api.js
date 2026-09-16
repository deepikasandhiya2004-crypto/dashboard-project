import http from "./http.js";

export const api = {
  register: (data) => http.post("/api/auth/register", data).then((r) => r.data),
  login: (data) => http.post("/api/auth/login", data).then((r) => r.data),
  me: () => http.get("/api/auth/me").then((r) => r.data),
  forgotPassword: (data) => http.post("/api/auth/forgot-password", data).then((r) => r.data),
  resetPassword: (data) => http.post("/api/auth/reset-password", data).then((r) => r.data),

  getProjects: () => http.get("/api/projects").then((r) => r.data),
  createProject: (data) => http.post("/api/projects", data).then((r) => r.data),
  updateProject: (id, data) => http.patch(`/api/projects/${id}`, data).then((r) => r.data),
  deleteProject: (id) => http.delete(`/api/projects/${id}`).then((r) => r.data),

  getTasks: () => http.get("/api/tasks").then((r) => r.data),
  createTask: (data) => http.post("/api/tasks", data).then((r) => r.data),
  updateTask: (id, data) => http.patch(`/api/tasks/${id}`, data).then((r) => r.data),
  deleteTask: (id) => http.delete(`/api/tasks/${id}`).then((r) => r.data),

  getLeads: () => http.get("/api/leads").then((r) => r.data),
  createLead: (data) => http.post("/api/leads", data).then((r) => r.data),
  updateLead: (id, data) => http.patch(`/api/leads/${id}`, data).then((r) => r.data),
  deleteLead: (id) => http.delete(`/api/leads/${id}`).then((r) => r.data),

  getClients: () => http.get("/api/clients").then((r) => r.data),
  createClient: (data) => http.post("/api/clients", data).then((r) => r.data),
  updateClient: (id, data) => http.patch(`/api/clients/${id}`, data).then((r) => r.data),
  deleteClient: (id) => http.delete(`/api/clients/${id}`).then((r) => r.data),

  getDeals: () => http.get("/api/deals").then((r) => r.data),
  createDeal: (data) => http.post("/api/deals", data).then((r) => r.data),
  updateDeal: (id, data) => http.patch(`/api/deals/${id}`, data).then((r) => r.data),
  deleteDeal: (id) => http.delete(`/api/deals/${id}`).then((r) => r.data),

  getProposals: () => http.get("/api/proposals").then((r) => r.data),
  createProposal: (data) => http.post("/api/proposals", data).then((r) => r.data),
  updateProposal: (id, data) => http.patch(`/api/proposals/${id}`, data).then((r) => r.data),
  deleteProposal: (id) => http.delete(`/api/proposals/${id}`).then((r) => r.data),

  getActivities: () => http.get("/api/activities").then((r) => r.data),
  createActivity: (data) => http.post("/api/activities", data).then((r) => r.data),
  deleteActivity: (id) => http.delete(`/api/activities/${id}`).then((r) => r.data),
};