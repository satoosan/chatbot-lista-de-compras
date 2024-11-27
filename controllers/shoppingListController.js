const db = require('../db/database');  // Importa a lógica de banco de dados

// Função para listar todos os itens da lista de compras
const getShoppingList = (db, twiml, res) => {
  db.all(`SELECT id, name FROM shopping_list`, [], (err, rows) => {
    if (err || rows.length === 0) {
      twiml.message('Nenhum item encontrado na lista. Volte ao menu enviando "reinicia".');
    } else {
      const itemList = rows.map(row => `${row.id} - ${row.name}`).join('\n');
      twiml.message(`Lista de Compras:\n${itemList}\n\nVolte ao menu enviando "reinicia".`);
    }
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  });
};

// Função para adicionar novos itens à lista
const addItem = (userMessage, db, userStates, twiml) => {
  const items = userMessage.split(',').map(item => item.trim());
  const placeholders = items.map(() => '(?)').join(',');
  
  db.run(`INSERT INTO shopping_list (name) VALUES ${placeholders}`, items, function(err) {
    if (err) {
      twiml.message('Erro ao adicionar os itens. Tente novamente.');
    } else {
      twiml.message(`Itens "${items.join(', ')}" foram adicionados ao carrinho com sucesso! Volte ao menu enviando "reinicia".`);
    }
  });

  userStates[userNumber] = { stage: 'menu' };
};

// Função para deletar um item baseado no ID
const deleteItem = (userMessage, db, twiml, res) => {
  const idToDelete = parseInt(userMessage);
  if (isNaN(idToDelete)) {
    twiml.message('Entrada inválida. Digite apenas o número do item para deletar.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
    return;
  }

  db.get(`SELECT id, name FROM shopping_list WHERE id = ?`, [idToDelete], (err, row) => {
    if (err) {
      twiml.message('Erro ao tentar deletar o item. Tente novamente.');
    } else if (!row) {
      twiml.message(`Item com ID "${idToDelete}" não encontrado. Tente novamente.`);
    } else {
      db.run(`DELETE FROM shopping_list WHERE id = ?`, [row.id], (err) => {
        if (err) {
          twiml.message('Erro ao deletar o item. Tente novamente.');
        } else {
          twiml.message(`O item "${row.name}" foi deletado com sucesso!`);
        }
      });
    }
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  });
};

module.exports = { getShoppingList, addItem, deleteItem };
