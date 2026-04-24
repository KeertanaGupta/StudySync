import axios from "axios";
import { API_BASE_URL } from '../config/api';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api/study/`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const getResources = () => API.get("resources/");

export const uploadResource = (formData: FormData) => 
  API.post("resources/", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const starResource = (id: number) => API.post(`resources/${id}/star/`);

export const getNotifications = () => API.get("notifications/");
export const markNotifRead = (id: number) => API.post(`notifications/${id}/read/`);
