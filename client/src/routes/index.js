import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from '../pages/DashboardPage';
// import AdminPage from '../pages/AdminPage';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";

const AppRoutes = () => (
    <Router>
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DashboardPage />} />
            {/* <Route
                path="/admin"
                element={
                    <ProtectedRoute permissions={['admin']}>
                        <AdminPage />
                    </ProtectedRoute>
                }
            /> */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    </Router>
);

export default AppRoutes;