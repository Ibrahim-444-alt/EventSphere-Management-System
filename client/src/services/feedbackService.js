import api from "./api";

export const getFeedback = async (params = {}) => {
  const { data } = await api.get("/feedback", { params });
  return data;
};

export const getFeedbackById = async (id) => {
  const { data } = await api.get(`/feedback/${id}`);
  return data;
};

export const createFeedback = async (feedbackData) => {
  const { data } = await api.post("/feedback", feedbackData);
  return data;
};

// Moderation only — there's no "edit feedback", because rewriting what
// somebody else said would make the whole record worthless.
export const updateFeedbackStatus = async (id, status) => {
  const { data } = await api.put(`/feedback/${id}/status`, { status });
  return data;
};

export const deleteFeedback = async (id) => {
  const { data } = await api.delete(`/feedback/${id}`);
  return data;
};

// Public route. Ye admin ke getFeedback se alag shakal deta hai — array nahi
// balki { averageRating, totalCount, commentTotal, feedback } — aur is mein
// email kabhi nahi aata.
export const getPublicFeedback = async (params = {}) => {
  const { data } = await api.get("/feedback/public", { params });
  return data;
};