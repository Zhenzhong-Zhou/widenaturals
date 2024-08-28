import Cookies from 'js-cookie';
import { purgeStoredState } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

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
        // Attempt to remove cookie regardless of its secure setting
        Cookies.remove(name, {
            sameSite: 'Strict', // Match the sameSite setting used when setting the cookie
        });
        
        // Attempt to remove cookie with secure: true as a fallback
        Cookies.remove(name, {
            secure: true,
            sameSite: 'Strict',
        });
    } catch (error) {
        console.error('Error removing cookie:', error);
    }
};

export const clearStorage = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear all cookies using removeCookie function
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        removeCookie(name.trim());
    }
    
    // Clear Redux persisted state
    purgeStoredState({ storage });
};