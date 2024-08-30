import {createAsyncThunk} from '@reduxjs/toolkit';
import {checkSession, login, logout, refreshSession} from '../../services/authService';
import {clearAuthState} from "../slices/authSlice";

export const loginThunk = createAsyncThunk(
    'auth/login',
    async (credentials, thunkAPI) => {
        try {
            return await login(credentials);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);

export const checkAuthStatus = createAsyncThunk(
    'auth/checkStatus',
    async (_, thunkAPI) => {
        try {
            // Make a request to check the authentication status
            const response = await checkSession();
            
            // If the session is valid
            if (response.message === 'Session valid.') {
                return response; // Or any relevant data from the response
            }
            
            // If the session is about to expire or has expired
            if (response.message === 'Session expired. Please refresh your tokens.' && response.expires_at) {
                // Refresh the tokens if session is about to expire
                try {
                    await thunkAPI.dispatch(refreshSession()); // Assume refreshTokens is a thunk
                    return thunkAPI.dispatch(checkAuthStatus()); // Re-check the session after refresh
                } catch (refreshError) {
                    console.error('Token refresh failed', refreshError);
                    thunkAPI.dispatch(clearAuthState());
                    return thunkAPI.rejectWithValue('Session expired and token refresh failed.');
                }
            }
            
            return thunkAPI.rejectWithValue('Unexpected response from session check.');
        } catch (error) {
            console.error("checkAuthStatus failed", error);
            
            if (error.response) {
                if (error.response.status === 401) {
                    thunkAPI.dispatch(clearAuthState());
                    return thunkAPI.rejectWithValue('Unauthorized');
                }
                
                if (error.response.status === 429) {
                    const retryAfter = error.response.headers['retry-after'];
                    if (retryAfter) {
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    } else {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    }
                    return thunkAPI.rejectWithValue('Rate limit reached');
                }
            }
            
            // Return a rejected value for all other errors
            return thunkAPI.rejectWithValue(
                error.response?.data || 'Failed to check authentication status'
            );
        }
    }
);

export const logoutThunk = createAsyncThunk(
    'auth/logout',
    async (_, thunkAPI) => {
    try {
        // Call the backend logout endpoint
        const response = await logout();
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data || 'Logout failed');
    }
});