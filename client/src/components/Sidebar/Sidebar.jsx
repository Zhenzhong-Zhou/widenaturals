import React from 'react';
import { Drawer, Divider, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle, isDrawerOpen }) => {
    const location = useLocation();
    const theme = useTheme();
    
    // Styles for Drawer Header
    const DrawerHeader = styled('div')(({ theme }) => ({
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    }));
    
    const drawerContent = (
        <>
            <DrawerHeader>
                {/* Close button to close the drawer */}
                <IconButton onClick={handleDrawerToggle}>
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
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default Sidebar;