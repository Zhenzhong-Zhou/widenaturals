import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

const DashboardPage = () => {
    
    return (
        <Grid container spacing={2} sx={{ padding: 2 }}>
            {/* KPI Boxes */}
            <Grid item xs={12} md={4}>
                <Paper sx={{ padding: 2 }}>KPI 1</Paper>
            </Grid>
            <Grid item xs={12} md={4}>
                <Paper sx={{ padding: 2 }}>KPI 2</Paper>
            </Grid>
            <Grid item xs={12} md={4}>
                <Paper sx={{ padding: 2 }}>KPI 3</Paper>
            </Grid>
            
            {/* Charts and Graphs */}
            <Grid item xs={12} md={6}>
                <Paper sx={{ padding: 2 }}>Sales Chart</Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper sx={{ padding: 2 }}>Inventory Chart</Paper>
            </Grid>
            
            {/* Recent Activity and Alerts */}
            <Grid item xs={12} md={6}>
                <Paper sx={{ padding: 2 }}>Recent Orders</Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper sx={{ padding: 2 }}>Top Products</Paper>
            </Grid>
            
            {/* Custom Widgets */}
            <Grid item xs={12} md={6}>
                <Paper sx={{ padding: 2 }}>Custom Widget 1</Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper sx={{ padding: 2 }}>Custom Widget 2</Paper>
            </Grid>
        </Grid>
    );
};

export default DashboardPage;