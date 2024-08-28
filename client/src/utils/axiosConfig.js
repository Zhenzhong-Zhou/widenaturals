import axios from 'axios';
import {getCookie} from "./cookieUtils";

// Function to get CSRF token from cookies
export const getCsrfToken = () => {
    return getCookie('XSRF-TOKEN');
};

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    timeout: 10000, // Set a timeout for requests
    withCredentials: true,
});

// Request interceptor to add CSRF token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        } else {
            console.warn('CSRF token not found!');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle responses globally and set cookies
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            if (error.config.url === '/auth/check') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;