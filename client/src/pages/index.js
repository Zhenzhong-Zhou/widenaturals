import { lazy } from 'react';

// Standard Imports
export { default as LoginPage } from './LoginPage/LoginPage';
export { default as NotFoundPage } from './NotFoundPage/NotFoundPage';
export { default as AdminCreationPage } from './AdminCreationPage/AdminCreationPage';

// Lazy loading components
export const DashboardPage = lazy(() => import('./DashboardPage/DashboardPage'));
export const EmployeeProfilePage = lazy(() => import('./EmployeeProfilePage/EmployeeProfilePage'));