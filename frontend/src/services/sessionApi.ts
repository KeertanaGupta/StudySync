import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/study/",
});

// attach token automatically (you already have authStore)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const createSession = (data: any) =>
  API.post("sessions/", data);

export const getSessions = () =>
  API.get("sessions/");

export const joinSession = (id: number) =>
  API.post(`sessions/${id}/join/`);

export const getGroups = () =>
  API.get("groups/");

export const createGroup = (data: any) =>
  API.post("groups/", data);

export const getOptimalSlots = (groupId: number) =>
  API.get(`groups/${groupId}/get_optimal_slots/`);

export const getLiveKitToken = (sessionId: number) =>
  API.get(`sessions/${sessionId}/get_token/`);

export const getStudyRequests = () =>
  API.get('requests/');

export const sendStudyRequest = (receiverId: number) =>
  API.post('requests/', { receiver: receiverId });

export const getFriends = () => API.get('friends/');

export const respondToRequest = (requestId: number, action: 'accept' | 'decline') => {
  if (action === 'accept') return API.post(`requests/${requestId}/accept/`);
  return API.delete(`requests/${requestId}/`);
};

export const updateAvailability = (data: any[]) => 
  API.post("availability/bulk_update/", data);

export const getAvailability = () =>
  API.get("availability/");

export const uploadTimetableOcr = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post("availability/ocr_upload/", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getGroupEvents = (groupId: number) => API.get(`groups/${groupId}/calendar_events/`);
export const createGroupEvent = (groupId: number, data: any) => API.post(`groups/${groupId}/calendar_events/`, data);