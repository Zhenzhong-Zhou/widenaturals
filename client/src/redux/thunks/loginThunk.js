import {createAsyncThunk} from '@reduxjs/toolkit';
import {check, login} from '../../services/authService';
import {clearAuthState} from "../slices/authSlice";

export const loginEmployee = createAsyncThunk(
    'employee/login',
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
            if (error.response && error.response.status === 401) {
                thunkAPI.dispatch(clearAuthState());  // Clear auth state
                // Optionally show a notification to the user
                return thunkAPI.rejectWithValue('Unauthorized');
            }
            // Return a rejected value to handle the error in Redux state
            return thunkAPI.rejectWithValue(
                error.response?.data || 'Failed to check authentication status'
            );
        }
    }
);