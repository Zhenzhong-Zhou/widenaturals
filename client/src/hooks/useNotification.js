import {useState} from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

const useNotification = () => {
    const [notification, setNotification] = useState({ message: '', severity: 'info', open: false });
    
    const showNotification = (message, severity = 'info') => {
        setNotification({ message, severity, open: true });
    };
    
    const handleClose = () => {
        setNotification((prev) => ({ ...prev, open: false }));
    };
    
    return {
        showNotification,
        notificationElement: (
            <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>
        ),
    };
};

export default useNotification;