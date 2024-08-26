const headerStyles = () => ({
    appBar: {
        position: 'fixed',
        width: '100%',
        zIndex: 1201, // Ensures the header is above other components
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between', // Aligns items to either end
        alignItems: 'center',
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        flexGrow: 1,
    },
    logoImage: {
        height: '40px', // Adjust based on your logo's aspect ratio
        marginRight: '8px',
    },
    sidebarButton: {
        marginRight: '16px', // Adds spacing between the button and other elements
        display: { xs: 'block', sm: 'none' }, // Show only on smaller screens
    },
    iconButton: {
        color: 'inherit',
        marginLeft: '16px', // Adds spacing between icons
    },
    switchBase: {
        marginLeft: 'auto', // Pushes the switch to the right end
    },
});

export default headerStyles;