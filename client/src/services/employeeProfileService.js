import axiosInstance from '../utils/axiosConfig';

export const fetchEmployeeProfile = async () => {
    try {
        const response = await axiosInstance.get('/employees/me/profile');
        console.log(response.data.data);
        return response.data;
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
};