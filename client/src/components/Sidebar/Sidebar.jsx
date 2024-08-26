import { Drawer, Divider, List, ListItem, ListItemText, IconButton, Typography, Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { DrawerHeader, sidebarStyles } from './SidebarStyles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ mobileOpen, handleDrawerToggle, isDrawerOpen }) => {
    const location = useLocation();
    const theme = useTheme();
    
    const drawerContent = (
        <>
            <DrawerHeader>
                {/* Sidebar open button (for mobile) */}
                <IconButton
                    edge="start"
                    onClick={handleDrawerToggle}
                    aria-label="open sidebar"
                    sx={{ color: theme.palette.primary.contrastText }} // Make sure the button color is visible
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
                    sx={{
                        boxShadow: theme.shadows[3],
                        color: theme.palette.primary.contrastText // Ensure the close icon is visible
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DrawerHeader>
            <Divider />
            <List>
                <ListItem button component="a" href="/" selected={location.pathname === '/'}>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button component="a" href="/employees" selected={location.pathname === '/employees'}>
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
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
                        zIndex: theme.zIndex.drawer - 1, // Ensure it's just below the drawer
                    }}
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
                    ...sidebarStyles(theme),
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
                    ...sidebarStyles(theme),
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default Sidebar;