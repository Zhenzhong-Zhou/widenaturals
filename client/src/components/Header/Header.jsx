import { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Switch } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faUser, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import headerStyles from './HeaderStyles';

const Header = ({ onDrawerToggle, toggleTheme, isDarkMode }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const styles = headerStyles();
    
    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={handleMenuClose} sx={styles.menuItem}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose} sx={styles.menuItem}>My Account</MenuItem>
            <MenuItem onClick={handleMenuClose} sx={styles.menuItem}>Logout</MenuItem>
        </Menu>
    );
    
    return (
        <AppBar position="fixed" sx={styles.appBar}>
            <Toolbar>
                {/* Sidebar Toggle Button */}
                <IconButton edge="start" onClick={onDrawerToggle} sx={styles.sidebarButton}>
                    <FontAwesomeIcon icon={faBars} />
                </IconButton>
                
                {/* Company Logo */}
                <Typography variant="h6" noWrap component="div" sx={styles.logoContainer}>
                    <img src="/logo.png" alt="Company Logo" style={styles.logoImage} />
                    WIDE Naturals
                </Typography>
                
                {/* Notifications Icon */}
                <IconButton sx={styles.iconButton}>
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
                
                {/* Theme Toggle Switch */}
                <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    color="default"
                    icon={<FontAwesomeIcon icon={faSun} />}
                    checkedIcon={<FontAwesomeIcon icon={faMoon} />}
                />
            </Toolbar>
            {renderMenu}
        </AppBar>
    );
};

export default Header;