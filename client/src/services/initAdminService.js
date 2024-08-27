import axiosInstance from '../utils/axiosConfig';

export const initAdminCreation = async (adminData) => {
    try {
        const response = await axiosInstance.post('/initial/admin-creation', adminData);
        return response.data;
    } catch (error) {
        // Enhanced error handling
        if (error.response) {
            // Client received an error response (5xx, 4xx)
            if (error.response.data && error.response.data.errors) {
                // Pass the error details to the component
                throw {
                    message: 'Validation errors occurred',
                    errors: error.response.data.errors
                };
            } else {
                // Generic error handling
                throw new Error(error.response.data.message || 'Failed to create admin');
            }
        } else if (error.request) {
            // Client never received a response, or request never left
            throw new Error('Network error: Please check your internet connection.');
        } else {
            // Anything else
            throw new Error('An unexpected error occurred');
        }
    }
};