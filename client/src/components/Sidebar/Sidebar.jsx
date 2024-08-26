import {Drawer, Divider, List, ListItem, ListItemText, IconButton, Typography, Box, useTheme} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import sidebarStyles from "./SidebarStyles";

const Sidebar = ({ mobileOpen, handleDrawerToggle, isDrawerOpen, drawerWidth }) => {
    const theme = useTheme();
    const styles = sidebarStyles(theme, drawerWidth); // Get styles
    
    const drawerContent = (
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo.png" alt="Company Logo" style={{ height: '40px', marginRight: '8px' }} />
                    <Typography variant="h6" noWrap>
                        WIDE Naturals
                    </Typography>
                </div>
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
    
    return (
        <>
            {isDrawerOpen && (
                <Box
                    sx={styles.backdrop}
                    onClick={handleDrawerToggle} // Close the drawer when clicking on the backdrop
                />
            )}
            
            {/* Temporary Drawer for Mobile View */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle} // Close on backdrop click
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' }, // Hide on larger screens
                    ...styles.drawerStyles,
                }}
            >
                {drawerContent}
            </Drawer>
            
            {/* Persistent Drawer for Desktop View */}
            <Drawer
                variant="persistent"
                open={isDrawerOpen}
                sx={{
                    display: { xs: 'none', sm: 'block' }, // Show only on larger screens
                    ...styles.drawerStyles,
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default Sidebar;