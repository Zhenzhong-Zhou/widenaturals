import Cookies from 'js-cookie';

// Enhanced setCookie function with default options and error handling
export const setCookie = (name, value, options = {}) => {
    try {
        Cookies.set(name, value, {
            expires: 7, // Default expiration of 7 days
            secure: true, // Use secure cookies in production
            sameSite: 'Strict', // Default to 'Lax' to prevent CSRF attacks
            ...options, // Override default options with any provided options
        });
    } catch (error) {
        console.error('Error setting cookie:', error);
    }
};

// Enhanced getCookie function with error handling
export const getCookie = (name) => {
    try {
        return Cookies.get(name);
    } catch (error) {
        console.error('Error getting cookie:', error);
        return null;
    }
};

// Enhanced removeCookie function with error handling
export const removeCookie = (name) => {
    try {
        Cookies.remove(name, {
            secure: true, // Ensure removal settings match set settings
        });
    } catch (error) {
        console.error('Error removing cookie:', error);
    }
};