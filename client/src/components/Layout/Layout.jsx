import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { Footer, Header, Sidebar } from "../index";

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
                transition: 'margin-left 0.3s',
                marginLeft: { xs: 0, sm: isDrawerOpen ? `${drawerWidth}px` : 0 },
                backgroundColor: isDrawerOpen ? 'rgba(0, 0, 0, 0.05)' : 'inherit',
            }}>
                <Outlet />
            </Box>
            <Footer drawerWidth={drawerWidth} isDrawerOpen={isDrawerOpen} />
        </Box>
    );
};

export default Layout;