import api from "./api";

export const getSettings = async () => {
  const { data } = await api.get("/settings");
  return data;
};

export const updateSettings = async (settingsData) => {
  const { data } = await api.put("/settings", settingsData);
  return data;
};

// Admin pages ise istemal nahi karte. Ye wo waala hai jo Phase 6 mein public
// site call karegi, taake visitor ka browser admin token ke baghair jaan sake
// ke registration khuli hai ya band.
export const getPublicSettings = async () => {
  const { data } = await api.get("/settings/public");
  return data;
};