import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const LoadingSpinner = ({ message = "Loading...", size = 40 }) => {
    return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
            <CircularProgress size={size} />
            <Typography variant="h6" mt={2}>
                {message}
            </Typography>
        </Box>
    );
};

export default LoadingSpinner;