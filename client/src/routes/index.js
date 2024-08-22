import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
// import AdminPage from '../pages/AdminPage';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => (
    <Router>
        <Routes>
            <Route path="/" element={<HomePage />} />
            {/* <Route
                path="/admin"
                element={
                    <ProtectedRoute permissions={['admin']}>
                        <AdminPage />
                    </ProtectedRoute>
                }
            /> */}
        </Routes>
    </Router>
);

export default AppRoutes;