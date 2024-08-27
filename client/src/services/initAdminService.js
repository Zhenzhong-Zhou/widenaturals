import axiosInstance from '../utils/axiosConfig';

export const initAdminCreation = async (adminData) => {
    try {
        const response = await axiosInstance.post('/initial/admin-creation', adminData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Failed to create admin');
    }
};