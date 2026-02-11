const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'server', 'auction.db');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, name FROM players", [], (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Found ${rows.length} players:`);
    rows.forEach(r => console.log(`- ${r.name} (ID: ${r.id})`));
    db.close();
});
