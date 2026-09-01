import api from "./api";

export const getMyBookmarks = async () => {
  const { data } = await api.get("/bookmarks");
  return data;
};

export const addBookmark = async (sessionId) => {
  const { data } = await api.post("/bookmarks", { session: sessionId });
  return data;
};

// Session ki id, bookmark ki id nahi — dekhein bookmarkController mein wajah.
export const removeBookmark = async (sessionId) => {
  const { data } = await api.delete(`/bookmarks/${sessionId}`);
  return data;
};