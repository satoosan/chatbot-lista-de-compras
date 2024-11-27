const sqlite3 = require('sqlite3').verbose();

// Função para inicializar o banco de dados
const initializeDatabase = () => {
  const db = new sqlite3.Database(':memory:');
  
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS shopping_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);
  });

  return db;
};

module.exports = { initializeDatabase };
