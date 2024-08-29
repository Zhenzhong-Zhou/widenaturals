import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import Avatar from "@mui/material/Avatar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faUser, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { logoutThunk } from '../../redux/thunks/authThunk';
import { clearStorage } from "../../utils/cookieUtils";
import { Logo, LoadingSpinner } from '../index';
import headerStyles from './HeaderStyles';

const Header = ({ onDrawerToggle, toggleTheme, isDarkMode, profile, isLoading, error }) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const [anchorEl, setAnchorEl] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const styles = headerStyles(theme);
    
    const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    
    const handleLogout = async () => {
        await dispatch(logoutThunk());
        clearStorage();
        handleMenuClose();
        window.location.href = '/login';
    };
    
    // Base URL for images is dynamically set based on environment
    const baseImageURL = process.env.REACT_APP_BASE_IMAGE_URL;
    
    // Construct the full URL to the profile image
    const profileImagePath = profile.profileImage?.imagePath
        ? `${baseImageURL}/${profile.profileImage.imagePath}`  // Append the relative path from the database
        : null;
    
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            sx={styles.menu}
        >
            <MenuItem component={Link} to="/profile"
                onClick={handleMenuClose}
                sx={styles.menuItem}
            >
                Profile
            </MenuItem>
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
                        {profile?.profileImage?.thumbnailPath ? (
                            <Avatar
                                alt={profile.fullName}
                                src={imageLoaded ? profile.profileImage.imagePath : profile.profileImage.thumbnailPath}
                                onLoad={() => setImageLoaded(true)}  // Switch to full image once loaded
                            />
                        ) : (
                            <FontAwesomeIcon icon={faUser} />
                        )}
                    </IconButton>
                </Toolbar>
                {renderMenu}
            </AppBar>
        </>
    );
};

export default Header;