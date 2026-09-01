import axios from "axios";
import { getToken } from "./tokenStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  // Har request par naya parha jata hai, module load par ek dafa nahi — warna
  // login ke baad wali requests purana (khaali) token bhejti rehtin.
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;