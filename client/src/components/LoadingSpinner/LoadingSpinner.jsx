import {useTheme} from "@mui/material";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import loadingSpinnerStyles from './LoadingSpinnerStyles';

const LoadingSpinner = ({ message = "Loading...", size = 40 }) => {
    const theme = useTheme(); // Access the current theme
    const styles = loadingSpinnerStyles(theme); // Get styles based on the current theme
    
    return (
        <Box sx={styles.container}>
            <CircularProgress size={size} sx={styles.spinner} />
            <Typography variant="h6" sx={styles.text}>
                {message}
            </Typography>
        </Box>
    );
};

export default LoadingSpinner;