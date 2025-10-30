const db = require('../../database');

class User {
  static findByUsername(username) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static create(username) {
    return new Promise((resolve, reject) => {
      db.run("INSERT INTO users (username) VALUES (?)", [username], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ userId: this.lastID, username });
        }
      });
    });
  }
}

module.exports = User;
