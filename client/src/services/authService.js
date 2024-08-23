import axiosInstance from '../utils/axiosConfig';

const login = async (credentials) => {
    try {
        const response = await axiosInstance.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};

export default { login };