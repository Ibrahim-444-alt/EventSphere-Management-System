import api from "./api";

export const getAttendees = async (params = {}) => {
  const { data } = await api.get("/attendees", { params });
  return data;
};

export const getAttendee = async (id) => {
  const { data } = await api.get(`/attendees/${id}`);
  return data;
};

export const createAttendee = async (attendeeData) => {
  const { data } = await api.post("/attendees", attendeeData);
  return data;
};

export const updateAttendee = async (id, attendeeData) => {
  const { data } = await api.put(`/attendees/${id}`, attendeeData);
  return data;
};

// Pass true to check someone in, false to undo it. The arrival timestamp is
// set by the server, so we always use the response rather than guessing.
export const checkInAttendee = async (id, checkedIn = true) => {
  const { data } = await api.put(`/attendees/${id}/check-in`, { checkedIn });
  return data;
};

export const deleteAttendee = async (id) => {
  const { data } = await api.delete(`/attendees/${id}`);
  return data;
};

// Sirf event ki id (aur marzi ho to phone/organization/ticketType) bhejni hai —
// naam aur email server token se leta hai, is liye unhein bhejna bekaar bhi hai
// aur galat bhi.
export const registerForEvent = async (registrationData) => {
  const { data } = await api.post("/attendees/register", registrationData);
  return data;
};

export const getMyRegistrations = async () => {
  const { data } = await api.get("/attendees/me");
  return data;
};

export const cancelMyRegistration = async (id) => {
  const { data } = await api.put(`/attendees/${id}/cancel`);
  return data;
};