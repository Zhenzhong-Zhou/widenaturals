import { createAsyncThunk } from '@reduxjs/toolkit';
import { setEmployee, setPermissions } from '../slices/employeeSlice';
import authService from '../../services/authService';
import {clearAuthState} from "../slices/authSlice";

export const loginEmployee = createAsyncThunk(
    'employee/login',
    async (credentials, thunkAPI) => {
        try {
            const data = await authService.login(credentials);
            console.log("loginThunk: ", data);
            // if (data.employeeInfo && data.permissions) {
            //     thunkAPI.dispatch(setEmployee(data.employeeInfo));
            //     thunkAPI.dispatch(setPermissions(data.permissions));
            // }
            
            // setCookie('accessToken', data.accessToken);
            
            return data;
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
            const response = await authService.check();
            console.log("checkAuthStatus success", response);
            
            return response;
        } catch (error) {
            console.error("checkAuthStatus failed", error);
            if (error.response && error.response.status === 401) {
                // todo clearEmployee
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