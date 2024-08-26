import React from 'react';
import {Drawer, Toolbar, Divider, List, ListItem, ListItemText, IconButton, Backdrop} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useLocation, Link } from 'react-router-dom';
import {
    faHome,
    faUsers,
    faClipboardList,
    faWarehouse,
    faFileAlt,
    faDolly,
    faMapMarkedAlt,
    faListAlt,
    faReceipt,
    faUndo,
    faUserPlus,
    faKey,
    faTasks,
    faDollarSign,
    faSitemap,
    faLocationArrow,
    faBoxes, faBox,
} from '@fortawesome/free-solid-svg-icons';
import Box from "@mui/material/Box";

const Sidebar = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
    const location = useLocation();
    
    const sidebarData = [
        {
            id: 1,
            title: "Dashboard",
            listItems: [
                { id: 1, title: "Dashboard", url: "/", icon: faHome },
                { id: 2, title: "Dashboard Related", url: "/dashboard_related", icon: faHome },
            ],
        },
        {
            id: 2,
            title: "General Info",
            listItems: [
                { id: 1, title: "Employees", url: "/employees", icon: faUsers },
                { id: 2, title: "Warehouse Products", url: "/warehouse/Office/products", icon: faWarehouse },
            ],
        },
        {
            id: 3,
            title: "Inventory",
            listItems: [
                { id: 1, title: "Locations", url: "/locations", icon: faLocationArrow },
                { id: 1, title: "Products", url: "/products", icon: faBox },
                { id: 2, title: "Lots", url: "/lots", icon: faBoxes },
                { id: 3, title: "Stock Transfers", url: "/stock_transfers", icon: faDolly },
                { id: 4, title: "Lots Locations", url: "/lots_locations/Office", icon: faMapMarkedAlt },
            ],
        },
        {
            id: 4,
            title: "Sales",
            listItems: [
                { id: 1, title: "Prices", url: "/prices", icon: faDollarSign },
                { id: 2, title: "Price Lists", url: "/price_lists", icon: faListAlt },
                { id: 3, title: "Po Types", url: "/po_types", icon: faSitemap },
                { id: 4, title: "Purchase Orders", url: "/purchase_orders", icon: faReceipt },
                { id: 5, title: "Returns", url: "/returns", icon: faUndo },
            ],
        },
    ];
    
    
    return (
        <>
        </>
    );
};

export default Sidebar;