import api from "./api";

export const getOverview = async (params = {}) => {
  const { data } = await api.get("/analytics/overview", { params });
  return data;
};

export const getRecentActivity = async (params = {}) => {
  const { data } = await api.get("/analytics/recent", { params });
  return data;
};

// Public route — token ki zaroorat nahi. Ghaur karein ke ye getOverview se
// bohat chhoti shakal deta hai: sirf { events, exhibitors, attendees, venues }.
export const getPublicStats = async () => {
  const { data } = await api.get("/analytics/public");
  return data;
};