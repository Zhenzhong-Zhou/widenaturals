const checkPermissions = (requiredRole, requiredPermissions = []) => {
    return async (req, res, next) => {
        const user = req.employee;
        
        // Role-based check
        if (user.role !== requiredRole) {
            return res.status(403).json({message: 'Insufficient role permissions'});
        }
        
        // Fetch permissions from the database if action-based permissions are required
        if (requiredPermissions.length > 0) {
            const userPermissions = await getUserPermissionsFromDatabase(user.id); // Replace with actual DB call
            
            const hasPermission = requiredPermissions.every(permission =>
                userPermissions.includes(permission)
            );
            
            if (!hasPermission) {
                return res.status(403).json({message: 'Insufficient action permissions'});
            }
        }
        
        next();
    };
};