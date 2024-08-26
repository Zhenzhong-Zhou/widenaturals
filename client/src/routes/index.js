import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner, Layout } from "../components";
import ProtectedRoute from './ProtectedRoute';
import { DashboardPage, AdminCreationPage, LoginPage, NotFoundPage } from '../pages';

const AppRoutes = ({ toggleTheme }) => (
    <Suspense fallback={<LoadingSpinner message="Loading your content, please wait..." />}>
        <Routes>
            {/* Routes that require authentication */}
            <Route element={<ProtectedRoute />}>
                {/* Wrap routes that need the layout with the Layout component */}
                <Route element={<Layout toggleTheme={toggleTheme} />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/public" element={<AdminCreationPage allowWithoutLogin={true} />} />
                </Route>
            </Route>
            
            {/* Routes that do not require authentication */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
    </Suspense>
);

export default AppRoutes;