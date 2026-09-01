import api from "./api";

export const getExhibitors = async (params = {}) => {
  const { data } = await api.get("/exhibitors", { params });
  return data;
};

export const getExhibitor = async (id) => {
  const { data } = await api.get(`/exhibitors/${id}`);
  return data;
};

// Koi id nahi bhejni parti — server token dekh kar khud faisla karta hai ke
// kis ki applications wapas karni hain.
export const getMyApplications = async () => {
  const { data } = await api.get("/exhibitors/me");
  return data;
};

export const applyAsExhibitor = async (applicationData) => {
  const { data } = await api.post("/exhibitors/apply", applicationData);
  return data;
};

export const updateExhibitor = async (id, exhibitorData) => {
  const { data } = await api.put(`/exhibitors/${id}`, exhibitorData);
  return data;
};

export const approveExhibitor = async (id) => {
  const { data } = await api.put(`/exhibitors/${id}/approve`);
  return data;
};

export const rejectExhibitor = async (id) => {
  const { data } = await api.put(`/exhibitors/${id}/reject`);
  return data;
};