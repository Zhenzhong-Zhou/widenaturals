import {
    faHome,
    faUsers,
    faWarehouse,
    faLocationArrow,
    faBox,
    faBoxes,
    faDolly,
    faMapMarkedAlt,
    faDollarSign,
    faListAlt,
    faSitemap,
    faReceipt,
    faUndo
} from '@fortawesome/free-solid-svg-icons';

const sidebarData = [
    {
        id: 'menu-general-info',
        title: "General Info",
        listItems: [
            { id: 'general-dashboard', title: "Dashboard", url: "/", icon: faHome },
            { id: 'general-employees', title: "Employees", url: "/general/employees", icon: faUsers },
            { id: 'general-warehouse-products', title: "Warehouse Products", url: "/general/warehouse/products", icon: faWarehouse },
        ],
    },
    {
        id: 'menu-inventory',
        title: "Inventory",
        listItems: [
            { id: 'inventory-locations', title: "Locations", url: "/inventory/locations", icon: faLocationArrow },
            { id: 'inventory-products', title: "Products", url: "/inventory/products", icon: faBox },
            { id: 'inventory-lots', title: "Lots", url: "/inventory/lots", icon: faBoxes },
            { id: 'inventory-stock-transfers', title: "Stock Transfers", url: "/inventory/stock_transfers", icon: faDolly },
            { id: 'inventory-lots-locations', title: "Lot Locations", url: "/inventory/lots_locations", icon: faMapMarkedAlt },
        ],
    },
    {
        id: 'menu-sales-purchasing',
        title: "Sales & Purchasing",
        listItems: [
            { id: 'sales-prices', title: "Prices", url: "/sales/prices", icon: faDollarSign },
            { id: 'sales-price-lists', title: "Price Lists", url: "/sales/price_lists", icon: faListAlt },
            { id: 'purchasing-po-types', title: "PO Types", url: "/purchasing/po_types", icon: faSitemap },
            { id: 'purchasing-purchase-orders', title: "Purchase Orders", url: "/purchasing/purchase_orders", icon: faReceipt },
            { id: 'sales-returns', title: "Returns", url: "/sales/returns", icon: faUndo },
        ],
    },
];

export default sidebarData;