const app = require('../server'); // Adjust the path to your server
const db = require('../database/database'); // Adjust the path to your database module

(async () => {
    const chai = await import('chai');
    const chaiHttp = await import('chai-http');
    
    chai.default.use(chaiHttp.default);
    global.expect = chai.default.expect;
    global.app = app;
    
    let isShuttingDown = false;
    
    const shutdown = async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        await db.gracefulShutdown();
        console.log('Database pool closed');
        process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    after(async () => {
        await shutdown();
    });
})();