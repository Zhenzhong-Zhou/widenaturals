import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {loginEmployee} from "../thunks/loginThunk";

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
    },
    reducers: {
        setEmployee(state, action) {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
        clearEmployee(state) {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginEmployee.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginEmployee.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isAuthenticated = true;
                state.loading = false;
            })
            .addCase(loginEmployee.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })
            // .addCase(logoutUser.fulfilled, (state) => {
            //     state.user = null;
            //     state.isAuthenticated = false;
            // });
    },
});

export const { setEmployee, clearEmployee } = authSlice.actions;
export default authSlice.reducer;