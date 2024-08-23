import { createSlice } from '@reduxjs/toolkit';
import { loginEmployee, checkAuthStatus } from '../thunks/loginThunk';

const initialState = {
    employee: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setEmployee(state, action) {
            state.employee = action.payload;
            state.isAuthenticated = true;
        },
        clearEmployee(state) {
            state.employee = null;
            state.isAuthenticated = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginEmployee.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginEmployee.fulfilled, (state, action) => {
                state.employee = action.payload;
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addCase(loginEmployee.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            })
            .addCase(checkAuthStatus.pending, (state) => {
                console.log('checkAuthStatus.pending');
                state.isLoading = true;
                state.error = null;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                console.log('checkAuthStatus.fulfilled');
                if (action.payload) {
                    state.employee = action.payload;
                    state.isAuthenticated = true;
                } else {
                    state.isAuthenticated = false;
                }
                state.isLoading = false;
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                console.log('checkAuthStatus.rejected');
                state.error = action.payload;
                state.isAuthenticated = false;
                state.isLoading = false;
            });
    },
});

export const { setEmployee, clearEmployee } = authSlice.actions;
export default authSlice.reducer;