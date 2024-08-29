import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner, Layout } from "../components";
import ProtectedRoute from './ProtectedRoute';
import {DashboardPage, AdminCreationPage, NotFoundPage} from '../pages';
import {EmployeeProfileContainer, LoginContainer} from "../containers";

const secureAdminSetupRoute = `/${process.env.REACT_APP_ADMIN_SETUP_PATH_PART_1}/initial-xyz123setup-admin/${process.env.REACT_APP_ADMIN_SETUP_PATH_PART_2}`;

const AppRoutes = ({ toggleTheme, isAuthenticated, isInitialAdminSetupComplete }) => (
    <Suspense fallback={<LoadingSpinner message="Loading your content, please wait..." />}>
        <Routes>
            {/* Routes that require authentication */}
            <Route element={<ProtectedRoute />}>
                {/* Wrap routes that need the layout with the Layout component */}
                <Route element={<Layout toggleTheme={toggleTheme} />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/profile" element={<EmployeeProfileContainer />} />
                    {/* Show 404 only to authenticated users */}
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" />} />
                </Route>
            </Route>
            
            {/* Initial Admin Setup Route - Only accessible if not authenticated and setup is not complete */}
            <Route
                path={secureAdminSetupRoute}
                element={!isAuthenticated && !isInitialAdminSetupComplete ? (
                    <AdminCreationPage isAuthenticated={isAuthenticated} allowWithoutLogin={true} />
                ) : (
                    <Navigate to={isAuthenticated ? "/" : "/login"} />
                )}
            />
            
            {/* Login route only for unauthenticated users */}
            <Route path="/login" element={!isAuthenticated ? <LoginContainer /> : <Navigate to="/" />} />
            
            {/* Redirect unauthenticated users to login */}
            <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    </Suspense>
);

export default AppRoutes;