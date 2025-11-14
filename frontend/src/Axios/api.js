import axios from "axios";

const base = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:4000/api' : '/api');

const API = axios.create({
  baseURL: base,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response interceptor to handle 401 errors
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token if unauthorized
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // You can dispatch a logout action here if needed
        }
        return Promise.reject(error);
    }
);

export default API;
