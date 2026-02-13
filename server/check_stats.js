const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./auction.db');
db.get("SELECT * FROM auction_config WHERE id = 1", [], (err, config) => {
    console.log("Config:", JSON.stringify(config, null, 2));
    db.all("SELECT t.name, t.budget, (SELECT COUNT(*) FROM players p WHERE p.team_id = t.id) as count FROM teams t", [], (err, teams) => {
        console.log("Teams Stats:", JSON.stringify(teams, null, 2));
        db.close();
    });
});
