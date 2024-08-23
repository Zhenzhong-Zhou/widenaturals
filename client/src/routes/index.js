import {Routes, Route, Navigate} from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
// import AdminPage from '../pages/AdminPage';
import NotFoundPage from "../pages/NotFoundPage";
import AdminCreationPage from "../pages/AdminCreationPage";

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/public" element={<AdminCreationPage element={AdminCreationPage} allowWithoutLogin={true} />} />
        {/* <Route
            path="/admin"
            element={
                <ProtectedRoute permissions={['admin']}>
                    <AdminPage />
                </ProtectedRoute>
            }
        /> */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" />} /> {/* Catch-all for undefined routes */}
    </Routes>
);

export default AppRoutes;