import {createAsyncThunk} from '@reduxjs/toolkit';
import {check, login, logout} from '../../services/authService';
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
            return await check();
        } catch (error) {
            console.error("checkAuthStatus failed", error);
            if (error.response) {
                if (error.response.status === 401) {
                    thunkAPI.dispatch(clearAuthState());
                    return thunkAPI.rejectWithValue('Unauthorized');
                }
                
                if (error.response.status === 429) {
                    console.log('Rate limit reached. Please try again later.');
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