import {createSelector} from 'reselect';

const selectAuth = (state) => state.auth;

export const selectIsAuthenticated = createSelector(
    [selectAuth],
    (auth) => auth.isAuthenticated
);

export const selectIsLoading = createSelector(
    [selectAuth],
    (auth) => auth.isLoading
);

export const selectAuthError = createSelector(
    [selectAuth],
    (auth) => auth.error
);