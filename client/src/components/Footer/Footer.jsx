import {Box, Typography, useTheme} from '@mui/material';
import footerStyles from './FooterStyles';
import {Logo} from "../index";

const Footer = ({ drawerWidth, isDrawerOpen }) => {
    const theme = useTheme();
    const styles = footerStyles(theme, drawerWidth, isDrawerOpen);
    
    return (
        <Box component="footer" sx={styles.footer}>
            <Logo src="/logo.png" alt="Company Logo" />
            <Typography variant="body2" sx={styles.text}>
                © 2022 - 2024 Wide Naturals Inc. All Rights Reserved.{' '}
            </Typography>
          
            <Typography sx={styles.text}>Powered By Bob Dev</Typography>
        </Box>
    );
};

export default Footer;