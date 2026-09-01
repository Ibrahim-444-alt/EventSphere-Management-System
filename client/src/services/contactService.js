import api from "./api";

export const sendContactMessage = async (messageData) => {
  const { data } = await api.post("/contact", messageData);
  return data;
};

export const getContactMessages = async (params = {}) => {
  const { data } = await api.get("/contact", { params });
  return data;
};

export const updateContactMessageStatus = async (id, status) => {
  const { data } = await api.put(`/contact/${id}/status`, { status });
  return data;
};

export const deleteContactMessage = async (id) => {
  const { data } = await api.delete(`/contact/${id}`);
  return data;
};