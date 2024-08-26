import { Link as RouterLink } from 'react-router-dom';
import { Box } from '@mui/material';
import logoStyles from './LogoStyles';
import { useTheme } from "@mui/material/styles";

const Logo = () => {
    const theme = useTheme();
    const styles = logoStyles(theme);
    
    return (
        <RouterLink to='/'>
            <Box
                component="img"
                src="/logo.png"
                alt="Company Logo"
                sx={styles.logoImage} // Apply styles from the 'styles' object
            />
        </RouterLink>
    );
};

export default Logo;