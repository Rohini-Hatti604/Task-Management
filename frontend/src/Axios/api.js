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


API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
        }
        return Promise.reject(error);
    }
);

export default API;
