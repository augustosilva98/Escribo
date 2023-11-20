const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const uuid = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Configuração do Express
app.use(bodyParser.json());

// Armazenamento persistente de dados do usuário
const users = [];

// Endpoint de Sign Up (Criação de Cadastro)
app.post('/signup', (req, res) => {
  const { nome, email, senha, telefone } = req.body;

  // Verificar se o e-mail já está cadastrado
  const userExists = users.find(user => user.email === email);
  if (userExists) {
    return res.status(400).json({ mensagem: 'E-mail já existente' });
  }

  // Criar um novo usuário
  const newUser = {
    id: uuid.v4(),
    nome,
    email,
    senha: bcrypt.hashSync(senha, 10),
    telefone,
    data_criacao: new Date(),
    data_atualizacao: new Date(),
    ultimo_login: null,
    token: null
  };

  // Adicionar o novo usuário ao armazenamento
  users.push(newUser);

  // Gerar um token JWT
  const token = jwt.sign({ id: newUser.id }, 'segredo', { expiresIn: '30m' });
  newUser.token = token;

  return res.json(newUser);
});

// Endpoint de Sign In (Autenticação)
app.post('/signin', (req, res) => {
  const { email, senha } = req.body;

  // Verificar se o e-mail está cadastrado
  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(401).json({ mensagem: 'Usuário e/ou senha inválidos' });
  }

  // Verificar se a senha está correta
  const senhaCorreta = bcrypt.compareSync(senha, user.senha);
  if (!senhaCorreta) {
    return res.status(401).json({ mensagem: 'Usuário e/ou senha inválidos' });
  }

  // Atualizar a data do último login e gerar um novo token JWT
  user.ultimo_login = new Date();
  const token = jwt.sign({ id: user.id }, 'segredo', { expiresIn: '30m' });
  user.token = token;

  return res.json(user);
});

// Endpoint de Buscar Usuário
app.get('/user', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];

  try {
    // Verificar se o token é válido
    const decoded = jwt.verify(token, 'segredo');
    const user = users.find(user => user.id === decoded.id);

    if (!user) {
      return res.status(401).json({ mensagem: 'Não autorizado' });
    }

    // Verificar se o token expirou
    const tokenExpired = new Date() - user.ultimo_login > 30 * 60 * 1000;
    if (tokenExpired) {
      return res.status(401).json({ mensagem: 'Sessão inválida' });
    }

    return res.json(user);
  } catch (error) {
    return res.status(401).json({ mensagem: 'Não autorizado' });
  }
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
});
