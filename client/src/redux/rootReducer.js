import {combineReducers} from '@reduxjs/toolkit';
import initAdminReducer from './slices/initAdminSlice';
import authReducer from './slices/authSlice';
import employeeProfileReducer from './slices/employeeProfileSlice';
import permissionsReducer from './slices/permissionsSlice';

// Define appReducer with all your slices
const rootReducer = combineReducers({
    initAdmin: initAdminReducer,
    auth: authReducer,
    employeeProfile: employeeProfileReducer,
    permissions: permissionsReducer
});

export default rootReducer;