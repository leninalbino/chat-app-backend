const db = require('../../database');

class Message {
  static getAll(limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT m.id, m.content, u.username, m.created_at 
        FROM messages m
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at ASC 
        LIMIT ?
      `;
      db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  static create(content, userId) {
    return new Promise((resolve, reject) => {
      const insertSql = "INSERT INTO messages (content, user_id) VALUES (?, ?)";
      db.run(insertSql, [content, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          const selectSql = `
            SELECT m.id, m.content, u.username, m.created_at
            FROM messages m
            JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
          `;
          db.get(selectSql, [this.lastID], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  }
}

module.exports = Message;
