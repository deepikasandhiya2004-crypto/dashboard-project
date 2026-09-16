import axios from "axios";
import { getToken, clearSession } from "./auth.js";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000",
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.href = "/login";
    }
    const message = error.response?.data?.error || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

export default http;