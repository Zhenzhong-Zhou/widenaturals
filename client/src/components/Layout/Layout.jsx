import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import {Footer, Header, Sidebar} from "../index";

const Layout = ({ toggleTheme }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerWidth = 240;
    
    const handleDrawerToggle = () => {
        if (window.innerWidth < 600) {
            setMobileOpen(!mobileOpen);
        } else {
            setIsDrawerOpen(!isDrawerOpen);
        }
    };
    
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <CssBaseline />
            <Header toggleTheme={toggleTheme} onDrawerToggle={handleDrawerToggle} />
            <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} isDrawerOpen={isDrawerOpen} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    transition: (theme) => theme.transitions.create('margin', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    marginLeft: isDrawerOpen ? `${drawerWidth}px` : 0, // Adjust margin when drawer is open
                }}
            >
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
};

export default Layout;