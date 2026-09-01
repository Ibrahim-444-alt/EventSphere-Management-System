import api from "./api";

export const getSpeakers = async (params = {}) => {
  const { data } = await api.get("/speakers", { params });
  return data;
};

export const getSpeaker = async (id) => {
  const { data } = await api.get(`/speakers/${id}`);
  return data;
};

export const createSpeaker = async (speakerData) => {
  const { data } = await api.post("/speakers", speakerData);
  return data;
};

export const updateSpeaker = async (id, speakerData) => {
  const { data } = await api.put(`/speakers/${id}`, speakerData);
  return data;
};

export const deleteSpeaker = async (id) => {
  const { data } = await api.delete(`/speakers/${id}`);
  return data;
};