import React from 'react';
import { Drawer, Divider, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { DrawerHeader, sidebarStyles } from './SidebarStyles'; // Import the styles

const Sidebar = ({ mobileOpen, handleDrawerToggle, isDrawerOpen }) => {
    const location = useLocation();
    const theme = useTheme();
    
    const drawerContent = (
        <>
            <DrawerHeader>
                {/* Company logo and name */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/logo.png" alt="Company Logo" style={{ height: '40px', marginRight: '8px' }} />
                    <Typography variant="h6" noWrap>
                        WIDE Naturals
                    </Typography>
                </div>
                {/* Close button to close the drawer */}
                <IconButton onClick={handleDrawerToggle} color="inherit">
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