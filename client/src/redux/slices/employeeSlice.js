import {createSlice} from '@reduxjs/toolkit';

const employeeSlice = createSlice({
    name: 'employee',
    initialState: {
        employeeInfo: null,
        permissions: [],
    },
    reducers: {
        setUser(state, action) {
            state.employeeInfo = action.payload;
        },
        setPermissions(state, action) {
            state.permissions = action.payload;
        },
        // Additional reducers as needed
    },
});

export const { setEmployee, setPermissions } = employeeSlice.actions;
export default employeeSlice.reducer;

// Optional: Selector functions (if needed) can be included here
export const selectUserInfo = (state) => state.employee.employeeInfo;
export const selectPermissions = (state) => state.employee.permissions;