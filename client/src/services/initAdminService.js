import axiosInstance from '../utils/axiosConfig';
import {ValidationError} from "../errors/ValidationError";

export const initAdminCreation = async (adminData) => {
    try {
        const response = await axiosInstance.post('/initial/admin-creation', adminData);
        return response.data;
    } catch (error) {
        if (error.response) {
            if (error.response.data && error.response.data.errors) {
                throw new ValidationError('Validation errors occurred', error.response.data.errors);
            } else {
                throw new Error(error.response.data.message || 'Failed to create admin');
            }
        } else if (error.request) {
            throw new Error('Network error: Please check your internet connection.');
        } else {
            throw new Error('An unexpected error occurred');
        }
    }
};