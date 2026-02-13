const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./auction.db');
db.get("SELECT id FROM teams WHERE name = 'Devam Techi Fighters'", [], (err, team) => {
    if (team) {
        db.all("SELECT id, name, status, team_id, is_captain, is_icon FROM players WHERE team_id = ?", [team.id], (err2, players) => {
            console.log("Players for Devam:", JSON.stringify(players, null, 2));
            db.close();
        });
    } else {
        console.log("Team not found");
        db.close();
    }
});
