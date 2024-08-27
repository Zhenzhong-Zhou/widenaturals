import { createSlice } from '@reduxjs/toolkit';
import { createAdmin } from '../thunks/initAdminThunk';

const initialState = {
    loading: false,
    admin: null,
    error: null,
};

// Admin slice
const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.admin = action.payload;
            })
            .addCase(createAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default adminSlice.reducer;