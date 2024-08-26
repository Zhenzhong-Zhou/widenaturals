import {Box, Divider, List, ListItem, ListItemText, IconButton, Typography, useTheme} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import drawerContentStyles from "./DrawerContentStyles";
import { Logo } from "../index";
import sidebarData from '../../constants/sidebarData';

const DrawerContent = ({ handleDrawerToggle, drawerWidth }) => {
    const theme = useTheme();
    const styles = drawerContentStyles(theme, drawerWidth);
    
    return (
        <>
            <Box sx={styles.drawerHeader}>
                <IconButton
                    edge="start"
                    onClick={handleDrawerToggle}
                    aria-label="open sidebar"
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
                                sx={styles.listItem}
                                onClick={handleDrawerToggle}
                            >
                                <FontAwesomeIcon icon={item.icon} style={styles.icon} />
                                <ListItemText primary={item.title} sx={styles.listItemText} />
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                </Box>
            ))}
        </>
    );
};

export default DrawerContent;