import {Box, Divider, List, ListItem, ListItemText, IconButton, Typography, useTheme} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import drawerContentStyles from "./DrawerContentStyles";
import {Logo} from "../index";

const DrawerContent = ({ handleDrawerToggle, drawerWidth }) => {
    const theme = useTheme();
    const styles = drawerContentStyles(theme, drawerWidth); // Get styles
    
    return (
        <>
            <Box sx={styles.drawerHeader}>
                {/* Sidebar open button (for mobile) */}
                <IconButton
                    edge="start"
                    onClick={handleDrawerToggle}
                    aria-label="open sidebar"
                    sx={styles.iconButton}
                >
                    <FontAwesomeIcon icon={faBars} />
                </IconButton>
                <Box sx={styles.logoContainer}>
                    <Logo/>
                    <Typography variant="h6" noWrap>
                        WIDE Naturals
                    </Typography>
                </Box>
                {/* Close button to close the drawer */}
                <IconButton
                    onClick={handleDrawerToggle}
                    color="inherit"
                    sx={styles.closeButton}
                >
                    <CloseIcon />
                </IconButton>
            </Box>
            <Divider />
            <List>
                <ListItem component={RouterLink} to="/">
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem component={RouterLink} to="/employees">
                    <ListItemText primary="Employees" />
                </ListItem>
                {/* Add more items as needed */}
            </List>
        </>
    );
};

export default DrawerContent;