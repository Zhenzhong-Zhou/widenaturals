import { createAsyncThunk } from '@reduxjs/toolkit';
import { setEmployee, setPermissions } from '../slices/employeeSlice';
import authService from '../../services/authService';
import Cookies from 'js-cookie';

export const loginEmployee = createAsyncThunk(
    'employee/login',
    async (credentials, thunkAPI) => {
        try {
            const data = await authService.login(credentials);
            thunkAPI.dispatch(setEmployee(data.employeeInfo));
            thunkAPI.dispatch(setPermissions(data.permissions));
            
            // Store token in cookies
            Cookies.set('token', data.token, { expires: 7, secure: true, sameSite: 'Strict' });
            
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);