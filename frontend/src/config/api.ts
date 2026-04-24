// Central API configuration — reads from environment variable
// In production (Vercel), set VITE_API_URL to your Render backend URL
// e.g. https://studysync-backend.onrender.com

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
