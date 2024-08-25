import axiosInstance from '../utils/axiosConfig';

export const login = async (credentials) => {
    try {
        const response = await axiosInstance.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

export const check = async () => {
    try {
        const response = await axiosInstance.get('/auth/check');
        return response.data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};