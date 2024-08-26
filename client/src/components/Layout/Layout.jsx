import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import {Footer, Header, Sidebar} from "../index";

const Layout = ({ toggleTheme }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerWidth = 300;
    
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
            <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} isDrawerOpen={isDrawerOpen} drawerWidth={drawerWidth} />
            <Box component="main" sx={{
                flexGrow: 1,
                p: 3,
                marginLeft: isDrawerOpen ? `${drawerWidth}px` : 0,
                transition: 'margin-left 0.3s',
                boxShadow: isDrawerOpen ? '0px 0px 15px rgba(0, 0, 0, 0.1)' : 'none', // Add shadow when drawer is open
                backgroundColor: isDrawerOpen ? 'rgba(0, 0, 0, 0.05)' : 'inherit', // Light grey background when drawer is open
            }}>
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
};

export default Layout;