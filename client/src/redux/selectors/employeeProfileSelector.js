import { createSelector } from 'reselect';

// Base selector to get the employee profile state
const selectEmployeeProfile = (state) => state.employeeProfile;

// Memoized selector to get the loading state
export const selectIsLoading = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => employeeProfile.isLoading
);

// Memoized selector to get the error state
export const selectError = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => employeeProfile.error
);

// Memoized selector to get the employee's full name
export const selectFullName = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => employeeProfile.fullName
);

// Memoized selector to get the employee's email
export const selectEmail = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => employeeProfile.email
);

// Memoized selector to get the employee's phone number
export const selectPhoneNumber = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => employeeProfile.phoneNumber
);

// Memoized selector to get formatted profile data
export const selectFormattedProfile = createSelector(
    [selectEmployeeProfile],
    (employeeProfile) => ({
        fullName: employeeProfile.full_name, // Match API response field
        email: employeeProfile.email,
        phoneNumber: employeeProfile.phone_number, // Match API response field
        jobTitle: employeeProfile.job_title, // Match API response field
        roleName: employeeProfile.role_name, // Match API response field
        createdAt: employeeProfile.created_at, // Use the original format
        updatedAt: employeeProfile.updated_at, // Use the original format
        lastLogin: employeeProfile.last_login, // Use the original format or format as needed
        status: employeeProfile.status,
        twoFactorEnabled: employeeProfile.two_factor_enabled, // Match API response field
        metadata: employeeProfile.metadata,
        profileImage: {
            imagePath: employeeProfile.image_path, // Match API response field
            thumbnailPath: employeeProfile.thumbnail_path, // Match API response field
            altText: employeeProfile.alt_text // Match API response field
        }
    })
);