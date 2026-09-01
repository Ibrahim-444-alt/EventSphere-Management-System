import api from "./api";

export const registerUser = async (userData) => {
  const { data } = await api.post("/auth/register", userData);
  return data;
};

export const loginUser = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await api.put("/auth/profile", profileData);
  return data;
};

export const changePassword = async (passwordData) => {
  const { data } = await api.put("/auth/password", passwordData);
  return data;
};