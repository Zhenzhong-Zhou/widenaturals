import { Box, Typography, useTheme } from '@mui/material';
import footerStyles from './FooterStyles';

const Footer = () => {
    const theme = useTheme();
   
    const styles = footerStyles(theme); // Pass theme and state to style function
    
    return (
        <Box component="footer" sx={styles.footer}>
            <Typography variant="body2" sx={styles.text}>
                © 2022 - 2024 WIDE NATURALS INC
            </Typography>
            <Typography sx={styles.text}>Powered By Bob Dev ERP Dashboard</Typography>
        </Box>
    );
};

export default Footer;