import {useState} from 'react';
import {AppBar, Toolbar, Typography, IconButton, Badge, Box, Avatar, Menu, MenuItem, Button} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';

const Header = ({ onDrawerToggle, toggleTheme }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    
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
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>My Account</MenuItem>
            <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
        </Menu>
    );
    
    return (
        <AppBar position="fixed">
            <Toolbar>
                {/* Hamburger Menu Icon for Sidebar */}
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={onDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                {/* Company Logo or Name */}
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    <img src="/logo.png" alt="Company Logo" />
                    WIDE Naturals
                </Typography>
                {/* Search Icon */}
                <IconButton size="large" aria-label="search" color="inherit">
                    <SearchIcon />
                </IconButton>
                {/* Notifications Icon */}
                <IconButton size="large" aria-label="show new notifications" color="inherit">
                    <Badge badgeContent={4} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                {/* User Profile Icon */}
                <IconButton
                    edge="end"
                    aria-label="account of current user"
                    aria-controls="profile-menu"
                    aria-haspopup="true"
                    onClick={handleProfileMenuOpen}
                    color="inherit"
                >
                    <AccountCircle />
                </IconButton>
                <Button onClick={toggleTheme} color="inherit">
                    Toggle Theme
                </Button>
            </Toolbar>
            {renderMenu}
        </AppBar>
    );
};

export default Header;