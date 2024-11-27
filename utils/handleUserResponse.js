// Função para gerenciar o fluxo de interação com o usuário
function handleUserResponse(userNumber, userMessage, db, userStates, twiml) {
  const state = userStates[userNumber] || { stage: 'menu' };

  switch (state.stage) {
    case 'menu':
      const menu = `Escolha uma opção:\n\n
        a - Cadastrar novo item\n
        b - Listar itens\n
        c - Deletar um item\n
        d - Deletar todos os itens\n
        e - Sair\n
        Digite "reinicia" para voltar ao menu.`;
      userStates[userNumber] = { stage: 'menu' };
      twiml.message(menu);
      break;

    default:
      twiml.message('Opção inválida. Volte ao menu enviando "reinicia".');
      userStates[userNumber] = { stage: 'menu' };
      break;
  }
}

module.exports = { handleUserResponse };
