const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Configurar Banco de Dados
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS shopping_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);
});

// Variáveis para controle do estado do usuário
const userStates = {};


function showWelcomeMessage(twiml) {
  const welcomeMessage =
    `Olá, meu nome é Zee 🐝, escolha uma das opções abaixo para criar sua lista de compras:\n
      a - Cadastrar novo item
      b - Listar itens
      c - Deletar um item
      d - Deletar todos os itens
      e - Sair\n
      Digite menu para voltar ao início`;
  twiml.message(welcomeMessage);
}

function handleUserResponse(userNumber, userMessage, twiml, res) {
  const state = userStates[userNumber] || { stage: 'welcome' };

  switch (state.stage) {
    case 'welcome':
      showWelcomeMessage(twiml);
      userStates[userNumber] = { stage: 'menu' };
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
      break;
    case 'menu':
      const menu =
        `Escolha uma opção abaixo:\n
          a - Cadastrar novo item
          b - Listar itens
          c - Deletar um item
          d - Deletar todos os itens
          e - Sair\n
          Digite menu para voltar ao início`;
      userStates[userNumber] = { stage: 'menu' };
      twiml.message(menu);
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
      break;

    case 'add':
      const items = userMessage.split(',').map(item => item.trim());

      if (items.length === 0 || items.some(item => item === '')) {
        twiml.message('Por favor, envie pelo menos um item para adicionar à lista.');
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        return;
      }

      const placeholders = items.map(() => '(?)').join(',');

      db.run(`INSERT INTO shopping_list (name) VALUES ${placeholders}`, items, function (err) {
        if (err) {
          console.error('Erro ao adicionar os itens:', err);
          twiml.message('Erro ao adicionar os itens. Tente novamente.');
        } else {
          twiml.message(`Itens "${items.join(', ')}" foram adicionados ao carrinho com sucesso!`);
        }

        userStates[userNumber] = { stage: 'menu' };
        twiml.message('Volte ao menu enviando "menu".');

        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
      });
      break;

    case 'delete':
      const itemIds = userMessage.split(' ').map(id => parseInt(id.trim(), 10));

      if (itemIds.some(isNaN)) {
        twiml.message('Por favor, envie os números dos itens separados por espaço, ex: "1 3 5".');
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
        return;
      }

      const deletePlaceholders = itemIds.map(() => '?').join(', ');

      db.run(
        `DELETE FROM shopping_list WHERE id IN (${deletePlaceholders})`,
        itemIds,
        function (err) {
          if (err) {
            console.error('Erro ao deletar os itens:', err);
            twiml.message('Erro ao deletar os itens. Tente novamente.');
          } else if (this.changes === 0) {
            twiml.message(`Nenhum item encontrado com os IDs: ${itemIds.join(', ')}.`);
          } else {
            twiml.message(`Itens com os IDs ${itemIds.join(', ')} deletados com sucesso.`);
          }

          userStates[userNumber] = { stage: 'menu' };
          twiml.message('Volte ao menu enviando "menu".');

          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        }
      );
      break;

    case 'delete_all':
      if (userMessage === 'sim') {
        db.run(`DELETE FROM shopping_list`, function (err) {
          if (err) {
            console.error('Erro ao deletar todos os itens:', err);
            twiml.message('Erro ao deletar os itens. Tente novamente.');
          } else {
            twiml.message('Todos os itens foram deletados com sucesso.');
          }

          userStates[userNumber] = { stage: 'menu' };
          twiml.message('Volte ao menu enviando "menu".');

          res.writeHead(200, { 'Content-Type': 'text/xml' });
          res.end(twiml.toString());
        });
      } else {
        twiml.message('Operação cancelada. Volte ao menu enviando "menu".');
        userStates[userNumber] = { stage: 'menu' };
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        res.end(twiml.toString());
      }
      break;

    case 'exit': // Nova lógica para "e"
      showWelcomeMessage(twiml);
      userStates[userNumber] = { stage: 'menu' }; // Reseta para o menu inicial
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
      break;

    default:
      twiml.message('Opção inválida. Envie "menu" para voltar ao início.');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
  }
}

app.post('/whatsapp', (req, res) => {
  const twiml = new MessagingResponse();
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim().toLowerCase();

  if (userMessage === 'a') {
    userStates[userNumber] = { stage: 'add' };
    twiml.message('Digite os itens separados por vírgula, ex: "Detergente, Leite":');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } else if (userMessage === 'b') {
    db.all(`SELECT id, name FROM shopping_list`, [], (err, rows) => {
      if (err || rows.length === 0) {
        twiml.message('Nenhum item encontrado na lista. Volte ao menu enviando "menu".');
      } else {
        const itemList = rows.map(row => `${row.id} - ${row.name}`).join('\n');
        twiml.message(`Lista de Compras:\n${itemList}\n\nVolte ao menu enviando "menu".`);
      }
      userStates[userNumber] = { stage: 'menu' };
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(twiml.toString());
    });
  } else if (userMessage === 'c') {
    userStates[userNumber] = { stage: 'delete' };
    twiml.message('Digite o número do item que deseja deletar (baseado no ID), ex: "2":');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } else if (userMessage === 'd') {
    userStates[userNumber] = { stage: 'delete_all' };
    twiml.message('Deletando todos os itens. Confirme com "sim" ou volte ao menu enviando "menu".');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } else if (userMessage === 'e') {
    userStates[userNumber] = { stage: 'exit' };
    handleUserResponse(userNumber, userMessage, twiml, res);
  } else {
    handleUserResponse(userNumber, userMessage, twiml, res);
  }
});




// Iniciar o Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
