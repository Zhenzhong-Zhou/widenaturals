import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import notFoundPageStyles from './NotFoundPageStyles';

const NotFoundPage = () => {
    const theme = useTheme(); // Access the theme
    const styles = notFoundPageStyles(theme); // Use the styles
    
    return (
        <Box sx={styles.container}>
            <Typography variant="h1" sx={styles.heading} gutterBottom>
                404
            </Typography>
            <Typography variant="h4" sx={styles.heading} gutterBottom>
                Page Not Found
            </Typography>
            <Typography variant="body1" paragraph>
                The page you are looking for does not exist or has been moved.
            </Typography>
            <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/"
                sx={styles.button}
            >
                Go to Home
            </Button>
        </Box>
    );
};

export default NotFoundPage;