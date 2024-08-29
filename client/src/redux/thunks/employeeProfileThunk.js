import { createAsyncThunk } from '@reduxjs/toolkit';
import {fetchEmployeeProfile} from "../../services/employeeProfileService";

// Async thunk to fetch employee profile
export const retrieveEmployeeProfile = createAsyncThunk(
    'employeeProfile/fetchEmployeeProfile',
    async (employeeId, { rejectWithValue }) => {
        try {
            const response = await fetchEmployeeProfile();
            return response.data;
        } catch (error) {
            // Handle errors and return a rejected action with a value
            return rejectWithValue(error.response?.data || 'Failed to fetch profile');
        }
    }
);
