import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/study/",
});

// attach token automatically (you already have authStore)
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const createSession = (data: any) =>
  API.post("sessions/", data);

export const getSessions = () =>
  API.get("sessions/");

export const joinSession = (id: number) =>
  API.post(`sessions/${id}/join/`);