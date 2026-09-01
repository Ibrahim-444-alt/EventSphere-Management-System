import api from "./api";

export const downloadReport = async (type, params = {}) => {
  // responseType "blob" matters. By default axios treats the response as text
  // and tries to be clever with it; a blob is the raw bytes, untouched.
  const response = await api.get(`/reports/${type}`, { params, responseType: "blob" });
  return response.data;
};

// The JWT lives in an Authorization header, and the browser does NOT attach
// headers to a plain <a href> or window.open — so we can't simply link to the
// report URL, it would come back 401. Instead axios fetches the bytes (the
// interceptor adds the token), and then we hand them to the browser as a
// temporary in-memory URL and click it on the user's behalf.
export const saveBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // An object URL keeps the whole blob alive in memory until it's released.
  window.URL.revokeObjectURL(url);
};