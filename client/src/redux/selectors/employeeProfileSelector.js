import { createSelector } from '@reduxjs/toolkit';

// Base selector for employee profile state
const selectEmployeeProfile = (state) => state.employeeProfile;

// Memoized selector to get the loading state
export const selectProfileIsLoading = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => employeeProfile.isLoading
);

// Memoized selector to get the error state
export const selectProfileError = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => employeeProfile.error
);

// Selector for profile image path
export const selectProfileImagePath = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => {
            const baseImageURL = process.env.REACT_APP_BASE_IMAGE_URL;
            return employeeProfile.profile?.image_path
                ? `${baseImageURL}/${employeeProfile.profile.image_path}`
                : null;
    }
);

// Selector for profile thumbnail path
export const selectProfileThumbnailPath = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => {
            const baseImageURL = process.env.REACT_APP_BASE_IMAGE_URL;
            return employeeProfile.profile?.thumbnail_path
                ? `${baseImageURL}/${employeeProfile.profile.thumbnail_path}`
                : null;
    }
);

// Memoized selector to get formatted profile data
export const selectFormattedProfile = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => ({
            fullName: employeeProfile.profile?.full_name || '',
            email: employeeProfile.profile?.email || '',
            phoneNumber: employeeProfile.profile?.phone_number || '',
            jobTitle: employeeProfile.profile?.job_title || '',
            roleName: employeeProfile.profile?.role_name || '',
            createdAt: employeeProfile.profile?.created_at || '',
            updatedAt: employeeProfile.profile?.updated_at || '',
            lastLogin: employeeProfile.profile?.last_login || '',
            status: employeeProfile.profile?.status || '',
            twoFactorEnabled: employeeProfile.profile?.two_factor_enabled || false,
            metadata: employeeProfile.profile?.metadata || null,
            altText: employeeProfile.profile?.alt_text || ''
    })
);