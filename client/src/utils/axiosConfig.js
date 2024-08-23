import axios from 'axios';
import {getCookie} from "./cookieUtils";

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    timeout: 10000, // Set a timeout for requests
});

// Request interceptor for adding the authentication token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getCookie('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle responses globally
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Handle unauthorized errors, e.g., redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;