const fs = require('fs');
const { exec } = require('child_process');

function backupDatabase() {
    const currentTime = new Date();
    const fileName = `WIDE_Naturals_ERP_backup_${currentTime.toISOString().replace(/[-:.]/g, '_')}.sql`;
    exec(`pg_dump -U postgres -d mydb -F c > ${fileName}`, (err, stdout, stderr) => {
        if (err) {
            console.error('Backup failed:', stderr);
        } else {
            console.log('Backup successful:', stdout);
        }
    });
}

function restoreDatabase(fileName) {
    exec(`pg_restore -U postgres -d mydb < ${fileName}`, (err, stdout, stderr) => {
        if (err) {
            console.error('Restore failed:', stderr);
        } else {
            console.log('Restore successful:', stdout);
        }
    });
}

module.exports = { backupDatabase, restoreDatabase };