import { createSelector } from 'reselect';

const selectAuth = (state) => state.auth;

export const selectIsAuthenticated = createSelector(
    [selectAuth],
    (auth) => auth.isAuthenticated
);

export const selectLoading = createSelector(
    [selectAuth],
    (auth) => auth.loading
);

export const selectEmployee = createSelector(
    [selectAuth],
    (auth) => auth.employee
);
