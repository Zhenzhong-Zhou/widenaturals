import { createSlice } from '@reduxjs/toolkit';
import { loginEmployee, checkAuthStatus } from '../thunks/loginThunk';

const initialState = {
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthState(state) {
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginEmployee.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginEmployee.fulfilled, (state) => {
                state.isAuthenticated = true;
                state.isLoading = false;
                state.error = null;
            })
            .addCase(loginEmployee.rejected, (state, action) => {
                state.error = { message: 'Login failed' }; // Generalize error message
                state.isLoading = false;
                state.isAuthenticated = false;
            })
            .addCase(checkAuthStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.isAuthenticated = !!(action.payload && action.payload.hashedID);
                state.isLoading = false;
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.error = { message: 'Check failed' }; // Generalize error message
                state.isAuthenticated = false;
                state.isLoading = false;
            });
    },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;