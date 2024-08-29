import { useState } from 'react';
import { AppBar, Box, Toolbar, IconButton, Typography, Badge, Menu, MenuItem, Switch } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faUser, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../../redux/thunks/authThunk';
import { clearStorage } from "../../utils/cookieUtils";
import { Logo, LoadingSpinner } from '../index';  // Import LoadingSpinner
import headerStyles from './HeaderStyles';
import { selectIsLoading } from '../../redux/selectors/authSelectors'; // Import selector

const Header = ({ onDrawerToggle, toggleTheme, isDarkMode }) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [anchorEl, setAnchorEl] = useState(null);
    const isLoading = useSelector(selectIsLoading); // Access global isLoading state
    const styles = headerStyles(theme);
    
    const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    
    const handleLogout = async () => {
        await dispatch(logoutThunk());
        clearStorage();
        handleMenuClose();
        window.location.href = '/login';
    };
    
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={styles.menu}
        >
            <MenuItem onClick={handleMenuClose} sx={styles.menuItem}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose} sx={styles.menuItem}>My Account</MenuItem>
            <MenuItem onClick={handleLogout} sx={styles.menuItem}>Logout</MenuItem>
        </Menu>
    );
    
    return (
        <>
            {isLoading && <LoadingSpinner message="Logging out..." />}
            <AppBar position="fixed" sx={styles.appBar}>
                <Toolbar sx={styles.toolbar}>
                    <IconButton
                        edge="start"
                        onClick={onDrawerToggle}
                        sx={styles.sidebarButton}
                        aria-label="open sidebar"
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </IconButton>
                    
                    <Typography variant="h6" noWrap component="div" sx={styles.logoContainer}>
                        <Logo />
                        WIDE Naturals
                    </Typography>
                    
                    <Box sx={styles.switchBase}>
                        <Switch
                            checked={isDarkMode}
                            onChange={toggleTheme}
                            color="default"
                            icon={<FontAwesomeIcon icon={faSun} />}
                            checkedIcon={<FontAwesomeIcon icon={faMoon} />}
                            inputProps={{ 'aria-label': 'toggle theme' }}
                        />
                    </Box>
                    
                    <IconButton sx={styles.iconButton} aria-label="show notifications">
                        <Badge badgeContent={4} color="error">
                            <FontAwesomeIcon icon={faBell} />
                        </Badge>
                    </IconButton>
                    
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
        </>
    );
};

export default Header;