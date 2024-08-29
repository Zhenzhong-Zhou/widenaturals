import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    rolePermissions: [],
    temporaryPermissions: [],
    loading: false,
    error: null
};

const permissionsSlice = createSlice({
    name: 'permissions',
    initialState,
    reducers: {
        fetchPermissionsStart(state) {
            state.loading = true;
            state.error = null;
        },
        fetchPermissionsSuccess(state, action) {
            state.loading = false;
            state.rolePermissions = action.payload.rolePermissions;
            state.temporaryPermissions = action.payload.temporaryPermissions;
        },
        fetchPermissionsFailure(state, action) {
            state.loading = false;
            state.error = action.payload;
        }
    }
});

export const { fetchPermissionsStart, fetchPermissionsSuccess, fetchPermissionsFailure } = permissionsSlice.actions;

export default permissionsSlice.reducer;