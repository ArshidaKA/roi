// src/utils/client.js
import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:5000/api", // ✅ Change this to your backend base URL
  withCredentials: true, // if you use cookies / auth
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: request interceptor (attach token if needed)
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // adjust key if different
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: response interceptor (handle errors globally)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default client;
