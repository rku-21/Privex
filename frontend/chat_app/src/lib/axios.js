import axios from "axios";

const devBaseURL =
     import.meta.env.VITE_API_URL ??
     `${window.location.protocol}//${window.location.hostname}:5001/api`;

export const axiosInstance = axios.create({
     baseURL: import.meta.env.MODE === "development" ? devBaseURL : "/api",
     withCredentials: true,
     timeout: 30000, // 30 second timeout
});