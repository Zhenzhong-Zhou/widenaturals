import {createAsyncThunk} from '@reduxjs/toolkit';
import {initAdminCreation} from '../../services/initAdminService';

export const createAdmin = createAsyncThunk(
    'admin/createAdmin',
    async (adminData, thunkAPI) => {
        try {
            return await initAdminCreation(adminData);
        } catch (error) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);