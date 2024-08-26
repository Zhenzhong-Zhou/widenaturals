import { lazy } from 'react';

// Standard Imports
export { default as LoginPage } from './LoginPage/LoginPage';
export { default as NotFoundPage } from './NotFoundPage/NotFoundPage';

// Lazy loading components
export const DashboardPage = lazy(() => import('./DashboardPage/DashboardPage'));
export const AdminCreationPage = lazy(() => import('./AdminCreationPage/AdminCreationPage'));;