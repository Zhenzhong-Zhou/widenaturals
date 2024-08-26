import {Drawer, Box, useTheme} from '@mui/material';
import sidebarStyles from "./SidebarStyles";
import {DrawerContent} from "../index";

const Sidebar = ({ mobileOpen, handleDrawerToggle, isDrawerOpen, drawerWidth }) => {
    const theme = useTheme();
    const styles = sidebarStyles(theme); // Get styles
    
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
                <DrawerContent handleDrawerToggle={handleDrawerToggle} drawerWidth={drawerWidth}/>
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
                <DrawerContent handleDrawerToggle={handleDrawerToggle} drawerWidth={drawerWidth} />
            </Drawer>
        </>
    );
};

export default Sidebar;