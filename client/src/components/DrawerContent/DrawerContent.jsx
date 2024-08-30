import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import drawerContentStyles from "./DrawerContentStyles";
import { Logo } from "../index";
import sidebarData from '../../constants/sidebarData';

const DrawerContent = ({ handleDrawerToggle, drawerWidth }) => {
    const theme = useTheme();
    const styles = drawerContentStyles(theme, drawerWidth);
    const location = useLocation(); // Get the current location
    
    return (
        <Box sx={styles.drawerStyles}>
            <Box sx={styles.drawerHeader}>
                <IconButton
                    edge="start"
                    onClick={handleDrawerToggle}
                    aria-label="toggle sidebar"
                    sx={styles.iconButton}
                >
                    <FontAwesomeIcon icon={faBars} />
                </IconButton>
                <Box sx={styles.logoContainer}>
                    <Logo />
                    <Typography variant="h6" noWrap>
                        WIDE Naturals
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleDrawerToggle}
                    color="inherit"
                    sx={styles.closeButton}
                >
                    <CloseIcon />
                </IconButton>
            </Box>
            <Divider />
            {sidebarData.map((menu) => (
                <Box key={menu.id}>
                    <Typography variant="h6" sx={styles.menuTitle}>
                        {menu.title}
                    </Typography>
                    <List>
                        {menu.listItems.map((item) => (
                            <ListItem
                                key={item.id}
                                component={RouterLink}
                                to={item.url}
                                sx={{
                                    ...styles.listItem,
                                    ...(location.pathname === item.url && {
                                        backgroundColor: theme.palette.action.selected, // Highlight the active item
                                        color: theme.palette.primary.main,
                                    }),
                                }}
                                onClick={handleDrawerToggle}
                                aria-current={location.pathname === item.url ? 'page' : undefined} // Accessibility
                            >
                                <FontAwesomeIcon icon={item.icon} style={styles.icon} />
                                <ListItemText primary={item.title} sx={styles.listItemText} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                </Box>
            ))}
        </Box>
    );
};

export default DrawerContent;