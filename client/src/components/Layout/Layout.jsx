import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import {useTheme} from "@mui/material/styles";
import { Footer, Header, Sidebar } from "../index";
import layoutStyles from "./LayoutStyles";

const Layout = ({ toggleTheme }) => {
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const drawerWidth = 300;
    const styles = layoutStyles(theme, isDrawerOpen, drawerWidth);
    
    const handleDrawerToggle = () => {
        if (window.innerWidth < 600) {
            setMobileOpen(!mobileOpen);
        } else {
            setIsDrawerOpen(!isDrawerOpen);
        }
    };
    
    return (
        <Box sx={styles.root}>
            <CssBaseline />
            <Header toggleTheme={toggleTheme} onDrawerToggle={handleDrawerToggle} />
            <Sidebar
                mobileOpen={mobileOpen}
                handleDrawerToggle={handleDrawerToggle}
                isDrawerOpen={isDrawerOpen}
                drawerWidth={drawerWidth}
            />
            <Box component="main" sx={styles.mainContent}>
                <Outlet />
            </Box>
            <Footer drawerWidth={drawerWidth} isDrawerOpen={isDrawerOpen} />
        </Box>
    );
};

export default Layout;