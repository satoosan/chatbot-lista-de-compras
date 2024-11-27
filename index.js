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

// Função para gerenciar as etapas do bot
function handleUserResponse(userNumber, userMessage, callback) {
  const state = userStates[userNumber] || { stage: 'menu' };

  switch (state.stage) {
    case 'menu':
      const menu = `Escolha uma opção:\n\n1 - Cadastrar novo item\n2 - Listar itens\n3 - Deletar um item ou mais\n4 - Deletar tudo na lista\n5 - Sair\nDigite "reinicia" para voltar ao menu.`;
      userStates[userNumber] = { stage: 'menu' };
      callback(menu);
      break;

    case 'add':
      const items = userMessage.split(',').map(item => item.trim());
      const placeholders = items.map(() => '(?)').join(',');
      db.run(`INSERT INTO shopping_list (name) VALUES ${placeholders}`, items, (err) => {
        if (err) {
          callback('Erro ao adicionar os itens. Tente novamente.');
        } else {
          callback('Itens adicionados com sucesso! Volte ao menu enviando "reinicia".');
        }
      });
      userStates[userNumber] = { stage: 'menu' };
      break;

    case 'delete':
      const idsToDelete = userMessage.split(' ').map(Number);
      if (idsToDelete.some(isNaN)) {
        callback('Entrada inválida. Digite apenas os números dos itens para deletar.');
        return;
      }

      const placeholdersForDelete = idsToDelete.map(() => '?').join(',');
      db.run(`DELETE FROM shopping_list WHERE id IN (${placeholdersForDelete})`, idsToDelete, (err) => {
        if (err) {
          callback('Erro ao deletar os itens. Tente novamente.');
        } else {
          callback('Itens deletados com sucesso! Volte ao menu enviando "reinicia".');
        }
      });
      userStates[userNumber] = { stage: 'menu' };
      break;

    case 'delete_all':
      db.run(`DELETE FROM shopping_list`, [], (err) => {
        if (err) {
          callback('Erro ao deletar todos os itens. Tente novamente.');
        } else {
          callback('Todos os itens foram deletados com sucesso! Volte ao menu enviando "reinicia".');
        }
      });
      userStates[userNumber] = { stage: 'menu' };
      break;

    default:
      callback('Opção inválida. Volte ao menu enviando "reinicia".');
      userStates[userNumber] = { stage: 'menu' };
      break;
  }
}

app.post('/whatsapp', (req, res) => {
  const twiml = new MessagingResponse();
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim().toLowerCase();

  // Define o comportamento para cada mensagem recebida
  if (userMessage === '1') {
    userStates[userNumber] = { stage: 'add' };
    twiml.message('Digite os itens separados por vírgula, ex: "Detergente, Leite":');
  } else if (userMessage === '2') {
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
    return; // Garante que o restante da lógica não seja executado
  } else if (userMessage === '3') {
    userStates[userNumber] = { stage: 'delete' };
    twiml.message('Digite os números dos itens que deseja deletar, separados por espaço, ex: "2 3":');
  } else if (userMessage === '4') {
    userStates[userNumber] = { stage: 'delete_all' };
    twiml.message('Deletando todos os itens. Confirme com "sim" ou volte ao menu enviando "reinicia".');
  } else if (userMessage === '5') {
    delete userStates[userNumber];
    twiml.message('Obrigado por usar o bot de lista de compras. Até mais!');
  } else if (userMessage === 'reinicia') {
    handleUserResponse(userNumber, userMessage, (response) => twiml.message(response));
  } else {
    handleUserResponse(userNumber, userMessage, (response) => twiml.message(response));
  }

  // Responde para outras interações
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

// Iniciar o Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
