const sqlite3 = require('sqlite3').verbose();

// El ':memory:' crea una base de datos en memoria, pero para persistencia, usamos un archivo.
const DBSOURCE = "chat.db";

// db.serialize asegura que los comandos se ejecuten en orden.
const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // No se pudo abrir la base de datos
    console.error(err.message);
    throw err;
  } else {
    console.log('✅ Conectado a la base de datos SQLite.');
    db.serialize(() => {
      // Crear la tabla de usuarios si no existe
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error("Error creando tabla users:", err.message);
        }
      });

      // Crear la tabla de mensajes si no existe
      db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`, (err) => {
        if (err) {
          console.error("Error creando tabla messages:", err.message);
        }
      });
    });
  }
});

module.exports = db;
