import axiosInstance from '../utils/axiosConfig';
import {clearStorage} from "../utils/cookieUtils";

export const login = async (credentials) => {
    try {
        const response = await axiosInstance.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

export const checkSession = async () => {
    try {
        const response = await axiosInstance.post('/auth/check');
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // If session is expired or invalid, try to refresh tokens
            try {
                await refreshSession();  // Call refresh route
                return await checkSession();  // Retry the original request
            } catch (refreshError) {
                await logout();
                clearStorage()
                // Refresh failed, redirect to login or show appropriate message
                window.location.href = '/login';
            }
        } else {
            console.error('Unexpected error:', error);
            throw error;
        }
    }
};

export const refreshSession = async () => {
    try {
        const response = await axiosInstance.post('/auth/refresh', {}, {
            withCredentials: true, // Include cookies with the request
        });
        
        // If refresh is successful, store the new tokens
        if (response.status === 200) {
            const message = response.data.message;
            
            return { success: true, message};
        } else {
            // Handle unexpected status codes
            return { success: false, message: 'Failed to refresh session.' };
        }
    } catch (error) {
        console.error('Error refreshing session:', error);
        
        if (error.response && error.response.status === 401) {
            // Handle 401 Unauthorized, possibly redirect to login
            await logout();
            clearStorage();
            window.location.href = '/login';
            return { success: false, message: 'Session expired. Please log in again.' };
        } else {
            await logout();
            clearStorage();
            window.location.href = '/login';
            // Handle other types of errors
            return { success: false, message: 'An error occurred while refreshing the session.' };
        }
    }
};

export const logout = async () => {
    try {
        const response = await axiosInstance.post('/auth/logout');
        return response.data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};


// // Function to check token expiry and refresh if needed
// const checkAndRefreshToken = async () => {
//     const tokenExpiryTime = localStorage.getItem('tokenExpiryTime');
//     const currentTime = Date.now();
//
//     // If the token is about to expire (within 5 minutes), refresh it
//     if (tokenExpiryTime && currentTime > tokenExpiryTime - 5 * 60 * 1000) {
//         try {
//             const response = await axiosInstance.get('/auth/refresh');
//             localStorage.setItem('token', response.data.token);
//             localStorage.setItem('tokenExpiryTime', response.data.expiry);
//         } catch (error) {
//             console.error('Failed to refresh token:', error);
//             // Handle token refresh failure, e.g., logout user
//         }
//     }
// };
//
// // Call this function before making API requests
// checkAndRefreshToken();
