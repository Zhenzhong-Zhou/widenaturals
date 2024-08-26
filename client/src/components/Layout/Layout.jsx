import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Footer, Header } from "../index";
import Sidebar from "../Sidebar/Sidebar";

const Layout = ({ toggleTheme }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const drawerWidth = 240;
    
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <Header toggleTheme={toggleTheme} onDrawerToggle={handleDrawerToggle} />
            <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} drawerWidth={drawerWidth} />
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
};

export default Layout;