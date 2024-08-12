const app = require('../server');
const db = require('../database/database');

(async () => {
    try {
        const chai = await import('chai');
        const chaiHttp = await import('chai-http');
        
        // Access the default export from chai and chai-http
        const chaiInstance = chai.default || chai;
        const chaiHttpInstance = chaiHttp.default || chaiHttp;
        
        // Use chai-http with chai
        chaiInstance.use(chaiHttpInstance);
        
        // Set globals for testing
        global.expect = chaiInstance.expect;
        global.app = app;
        
        let isShuttingDown = false;
        const shouldAutoShutdown = process.env.AUTO_SHUTDOWN === 'true'; // Use an environment variable to control shutdown behavior
        
        const shutdown = async () => {
            if (isShuttingDown) return;
            isShuttingDown = true;
            console.log('Shutdown signal received');
            try {
                await db.gracefulShutdown();
                console.log('Database pool closed');
            } catch (error) {
                console.error('Error during shutdown:', error);
            } finally {
                process.exit(0);
            }
        };
        
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        
        // Only auto shutdown if the environment variable is set
        if (shouldAutoShutdown) {
            // Adding a delay to ensure all tests have completed
            setTimeout(async () => {
                await shutdown();
            }, 1000);
        }
        
        // Exporting the shutdown function for testing purposes
        module.exports = {
            shutdown,
        };
    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
})();