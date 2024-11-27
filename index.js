const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const { handleUserResponse } = require('./utils/handleUserResponse');
const { getShoppingList, addItem, deleteItem, deleteAllItems } = require('./controllers/shoppingListController');
const { initializeDatabase } = require('./db/database');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Inicializar o banco de dados
const db = initializeDatabase();

// Variáveis para controle do estado do usuário
const userStates = {};

// Endpoint para receber mensagens do WhatsApp
app.post('/whatsapp', (req, res) => {
  const twiml = new MessagingResponse();
  const userNumber = req.body.From;
  const userMessage = req.body.Body.trim().toLowerCase();

  if (userMessage === 'a') {
    userStates[userNumber] = { stage: 'add' };
    twiml.message('Digite os itens separados por vírgula, ex: "Detergente, Leite":');
  } else if (userMessage === 'b') {
    getShoppingList(db, twiml, res);
    return;
  } else if (userMessage === 'c') {
    userStates[userNumber] = { stage: 'delete' };
    twiml.message('Digite o número do item que deseja deletar (baseado no ID), ex: "2":');
  } else if (userMessage === 'd') {
    userStates[userNumber] = { stage: 'delete_all' };
    twiml.message('Deletando todos os itens. Confirme com "sim" ou volte ao menu enviando "reinicia".');
  } else if (userMessage === 'e') {
    delete userStates[userNumber];
    twiml.message('Obrigado por usar o bot de lista de compras. Até mais!');
  } else if (userMessage === 'reinicia') {
    handleUserResponse(userNumber, userMessage, db, userStates, twiml);
  } else if (userStates[userNumber]?.stage === 'delete') {
    deleteItem(userMessage, db, twiml, res);
  } else if (userStates[userNumber]?.stage === 'add') {
    addItem(userMessage, db, userStates, twiml);
  } else {
    handleUserResponse(userNumber, userMessage, db, userStates, twiml);
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

// Iniciar o Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
