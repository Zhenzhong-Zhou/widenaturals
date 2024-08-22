import { useState } from 'react';
import { Snackbar } from '@mui/material';

const useNotification = () => {
    const [notification, setNotification] = useState(null);
    
    const showNotification = (message, severity = 'info') => {
        setNotification({ message, severity });
    };
    
    const handleClose = () => {
        setNotification(null);
    };
    
    return {
        showNotification,
        notificationElement: (
            <Snackbar
                open={!!notification}
                message={notification?.message}
                onClose={handleClose}
            />
        ),
    };
};

export default useNotification;