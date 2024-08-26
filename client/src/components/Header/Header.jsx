import { useState } from 'react';
import { AppBar, Box, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Switch } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faUser, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@mui/material/styles';
import headerStyles from './HeaderStyles';
import {Logo} from "../index";

const Header = ({ onDrawerToggle, toggleTheme, isDarkMode }) => {
    const theme = useTheme(); // Access theme object
    const [anchorEl, setAnchorEl] = useState(null);
    const styles = headerStyles(theme); // Pass theme to styles
    
    // Handle menu open and close
    const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    
    // Render the user menu
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={styles.menu} // Style the menu
        >
            <MenuItem onClick={handleMenuClose} sx={styles.menuItem}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose} sx={styles.menuItem}>My Account</MenuItem>
            <MenuItem onClick={handleMenuClose} sx={styles.menuItem}>Logout</MenuItem>
        </Menu>
    );
    
    return (
        <AppBar position="fixed" sx={styles.appBar}>
            <Toolbar sx={styles.toolbar}>
                {/* Sidebar Toggle Button */}
                <IconButton
                    edge="start"
                    onClick={onDrawerToggle}
                    sx={styles.sidebarButton}
                    aria-label="open sidebar"
                >
                    <FontAwesomeIcon icon={faBars} />
                </IconButton>
                
                {/* Company Logo */}
                <Typography variant="h6" noWrap component="div" sx={styles.logoContainer}>
                    <Logo />
                    WIDE Naturals
                </Typography>
                
                {/* Theme Toggle Switch */}
                <Box sx={styles.switchBase}>
                    <Switch
                        checked={isDarkMode}
                        onChange={toggleTheme}
                        color="default"
                        icon={<FontAwesomeIcon icon={faSun} />}
                        checkedIcon={<FontAwesomeIcon icon={faMoon} />}
                        inputProps={{ 'aria-label': 'toggle theme' }} // Added aria label for accessibility
                    />
                </Box>
                
                {/* Notifications Icon */}
                <IconButton sx={styles.iconButton} aria-label="show notifications">
                    <Badge badgeContent={4} color="error">
                        <FontAwesomeIcon icon={faBell} />
                    </Badge>
                </IconButton>
                
                {/* User Profile Icon */}
                <IconButton
                    edge="end"
                    aria-label="account of current user"
                    aria-controls="profile-menu"
                    aria-haspopup="true"
                    onClick={handleProfileMenuOpen}
                    sx={styles.iconButton}
                >
                    <FontAwesomeIcon icon={faUser} />
                </IconButton>
            </Toolbar>
            {renderMenu}
        </AppBar>
    );
};

export default Header;