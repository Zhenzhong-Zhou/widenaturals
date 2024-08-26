import { lazy } from 'react';

// Standard Imports
export { default as LoginPage } from './LoginPage';
export { default as NotFoundPage } from './NotFoundPage';

// Lazy loading components
export const DashboardPage = lazy(() => import('./DashboardPage'));
export const AdminCreationPage = lazy(() => import('./AdminCreationPage'));;