import api from "./api";

export const getSessions = async (params = {}) => {
  const { data } = await api.get("/sessions", { params });
  return data;
};

export const getSession = async (id) => {
  const { data } = await api.get(`/sessions/${id}`);
  return data;
};

export const createSession = async (sessionData) => {
  const { data } = await api.post("/sessions", sessionData);
  return data;
};

export const updateSession = async (id, sessionData) => {
  const { data } = await api.put(`/sessions/${id}`, sessionData);
  return data;
};

export const deleteSession = async (id) => {
  const { data } = await api.delete(`/sessions/${id}`);
  return data;
};