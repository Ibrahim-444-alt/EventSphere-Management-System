import api from "./api";

export const getBooths = async (params = {}) => {
  const { data } = await api.get("/booths", { params });
  return data;
};

export const getBooth = async (id) => {
  const { data } = await api.get(`/booths/${id}`);
  return data;
};

export const createBooth = async (boothData) => {
  const { data } = await api.post("/booths", boothData);
  return data;
};

export const updateBooth = async (id, boothData) => {
  const { data } = await api.put(`/booths/${id}`, boothData);
  return data;
};

export const deleteBooth = async (id) => {
  const { data } = await api.delete(`/booths/${id}`);
  return data;
};

// Assign, reassign, or release a booth. Pass an exhibitor id to assign it;
// pass null to release the booth back to Available.
export const assignBooth = async (id, exhibitorId) => {
  const { data } = await api.post(`/booths/${id}/assign`, { exhibitorId });
  return data;
};
