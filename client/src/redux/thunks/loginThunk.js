import { createAsyncThunk } from '@reduxjs/toolkit';
import { setEmployee, setPermissions } from '../slices/employeeSlice';
import authService from '../../services/authService';
import {setCookie} from "../../utils/cookieUtils";

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
            
            // Store token in cookies
            setCookie('accessToken', data.token);
            
            return data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response.data);
        }
    }
);