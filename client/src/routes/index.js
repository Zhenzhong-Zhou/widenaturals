import {Suspense} from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
import AdminCreationPage from '../pages/AdminCreationPage';
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from './ProtectedRoute';
import {Layout} from "../components";
import {LoginPage} from "../pages";

const AppRoutes = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <Routes>
            {/* Routes that require authentication */}
            <Route element={<ProtectedRoute />}>
                {/* Wrap routes that need the layout with the Layout component */}
                <Route element={<Layout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/public" element={<AdminCreationPage allowWithoutLogin={true} />} />
                    {/*
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute permissions={['admin']}>
                                <AdminPage />
                            </ProtectedRoute>
                        }
                    />
                    */}
                </Route>
            </Route>
            
            {/* Routes that do not require authentication */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" />} /> {/* Catch-all for undefined routes */}
        </Routes>
    </Suspense>
);

export default AppRoutes;