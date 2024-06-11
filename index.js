const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

let palavras = ["javascript", "nodejs", "express", "socketio", "mongodb", "react", "angular", "vue", "docker", "kubernetes"];
let indice = Math.floor(Math.random() * palavras.length);
let palavraSecreta = "teste";
let letrasAdivinhadas = {};
let jogadores = [];
let erros = {};
const limiteErros = 5; // Defina o limite de erros aqui

io.on('connection', (socket) => {
  erros[socket.id] = 0;
  letrasAdivinhadas[socket.id] = [];
  console.log('Novo jogador conectado:', socket.id);

  jogadores.push(socket.id);

  socket.on('disconnect', () => {
    console.log('Jogador desconectado:', socket.id);
    jogadores = jogadores.filter(id => id !== socket.id);
    delete erros[socket.id];
    delete letrasAdivinhadas[socket.id];
  });

  socket.on('chutar', (letra) => {
    if (letrasAdivinhadas[socket.id].includes(letra) || !/[a-zA-Z]/.test(letra)) {
        socket.emit('mensagem', { mensagem: 'Letra inválida ou já adivinhada!' });
        return;
    }

    letrasAdivinhadas[socket.id].push(letra);

    if (!palavraSecreta.includes(letra)) {
        erros[socket.id]++;

        if (erros[socket.id] >= limiteErros) {
            socket.emit('mensagem', { mensagem: 'Jogo acabou para você! O limite de erros foi atingido.' });
          } else {
            socket.emit('mensagem', { mensagem: `Erro! Você tem ${limiteErros - erros[socket.id]} tentativas restantes.` });
          }
    } else {
        const letrasRestantes = palavraSecreta.split('').filter(l => !letrasAdivinhadas[socket.id].includes(l));
        if (letrasRestantes.length === 0) {
          io.emit('vencedor', { vencedor: socket.id, palavraSecreta });
          resetarJogo();
        } else {
          socket.emit('mensagem', { mensagem: 'Boa! Letra correta!', letrasAdivinhadas: letrasAdivinhadas[socket.id] });
        }
    }
  });
});

function resetarJogo() {
    let indiceAleatorio = Math.floor(Math.random() * palavras.length);
    palavraSecreta = palavras[indiceAleatorio];
  for (let id in letrasAdivinhadas) {
    letrasAdivinhadas[id] = []; // Limpe as letras adivinhadas para todos os jogadores
  }
}

server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
