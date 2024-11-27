# Zee - Chatbot para Lista de Compras no WhatsApp 📋🤖

Zee é um chatbot desenvolvido para o WhatsApp que permite criar, gerenciar e deletar listas de compras de maneira simples e eficiente. O bot oferece uma interface interativa para adicionar itens, visualizar a lista, remover itens específicos ou limpar toda a lista. Ele foi construído com **Node.js**, **Express** e um banco de dados SQLite.

## 📌 Funcionalidades

- **Cadastrar novo item**: Adicione um ou mais itens à lista de compras.
- **Listar itens**: Veja todos os itens cadastrados.
- **Deletar um item**: Remova itens específicos da lista usando seus IDs.
- **Deletar todos os itens**: Limpe toda a lista de compras.
- **Reiniciar a conversa**: Retorne ao menu inicial a qualquer momento.

## 🚀 Tecnologias Utilizadas

- **Node.js**: Para criar o servidor backend.
- **Express**: Framework web para gerenciar rotas e requisições.
- **SQLite**: Banco de dados leve e rápido para armazenar as informações.
- **Twilio API**: Para integração com o WhatsApp.
- **ngrok**: Para expor o servidor local à internet e facilitar o uso do webhook com o Twilio durante o desenvolvimento.

## 📂 Estrutura do Projeto

```plaintext
.
├── app.js             # Código principal do chatbot
├── package.json       # Dependências e metadados do projeto
├── README.md          # Documentação do projeto
└── db/                # Banco de dados SQLite (caso seja configurado para persistência)
```

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas:

- **Node.js** (v14 ou superior)
- **npm** (ou **yarn**) para gerenciar dependências
- Conta no [Twilio](https://www.twilio.com/) com o WhatsApp Sandbox configurado
- **ngrok** para expor seu servidor local à internet (caso necessário para testar localmente)

## 🏁 Como Configurar

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/zee-chatbot.git
   cd zee-chatbot
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor**:
   ```bash
   node app.js
   ```

4. **Exponha o servidor com o ngrok** (caso esteja testando localmente):
   - Instale o ngrok se não tiver:
     ```bash
     npm install -g ngrok
     ```
   - Inicie o ngrok na porta 3000:
     ```bash
     ngrok http 3000
     ```
   - O ngrok fornecerá uma URL pública (ex: `https://1234abcd.ngrok.io`) que você pode usar como webhook para o Twilio.

5. **Configure o webhook no Twilio**:
   No painel do Twilio, adicione o URL do ngrok seguido de `/whatsapp` para receber mensagens. Exemplo:
   ```
   https://1234abcd.ngrok.io/whatsapp
   ```

## 📝 Instruções de Uso

1. Inicie uma conversa com o número configurado no **WhatsApp Sandbox** do Twilio.
2. Você será saudado pela mensagem inicial:
   ```
   Olá, meu nome é Zee, escolha uma das opções abaixo para criar sua lista de compras
   ```
3. Escolha uma das opções do menu para interagir com o bot:
   - **a**: Cadastrar itens
   - **b**: Listar itens
   - **c**: Deletar itens
   - **d**: Deletar todos os itens
   - **e**: Sair e reiniciar a conversa

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos abaixo:

1. **Fork o repositório**
2. **Crie uma nova branch**:
   ```bash
   git checkout -b minha-nova-feature
   ```
3. **Faça suas alterações e commit**:
   ```bash
   git commit -m "Adiciona minha nova feature"
   ```
4. **Envie para o repositório remoto**:
   ```bash
   git push origin minha-nova-feature
   ```
5. **Abra um Pull Request**

---

### ✨ Autor

Desenvolvido por **[mim](https://github.com/satoosan)**.

---