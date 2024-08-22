import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ component: Component, permissions, ...rest }) => {
    const userPermissions = useSelector((state) => state.user.permissions);
    
    const hasPermission = permissions.some((perm) => userPermissions.includes(perm));
    
    return (
        <Route
            {...rest}
            render={(props) =>
                hasPermission ? (
                    <Component {...props} />
                ) : (
                    <Navigate to="/unauthorized" />
                )
            }
        />
    );
};

export default ProtectedRoute;