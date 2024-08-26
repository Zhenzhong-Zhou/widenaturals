import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import {Footer, Header} from "../index";
import Sidebar from "../Sidebar/Sidebar";

const Layout = ({ children, toggleTheme }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const drawerWidth = 240;
    
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };
    
    return (
        <Box>
            <CssBaseline />
            <Header toggleTheme={toggleTheme} />
            <Sidebar />
            <Box>
                {children}
            </Box>
            <Footer />
        </Box>
    );
};

export default Layout;