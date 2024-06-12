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
const limiteErros = 6; // Defina o limite de erros aqui
let palavraAtualizada = palavraSecreta.split('').map(letra => '_').join(' ');

io.on('connection', (socket) => {
  socket.emit('mensagem', {palavraAtualizada: palavraSecreta.split('').map(letra => '_').join(' '), mensagem: 'Bem-vindo ao jogo da forca!'});
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
    palavraAtualizada = palavraSecreta.split('').map(letra => letrasAdivinhadas[socket.id].includes(letra) ? letra : '_').join(' ');

    if (!palavraSecreta.includes(letra)) {
        erros[socket.id]++;

        if (Object.values(erros).every(numErros => numErros >= limiteErros)) {
          socket.on('resetar', () => {
            io.emit('mensagem', { mensagem: 'Todos perderam!'});
            resetarJogo();
            return;
          });
        } 

        if (erros[socket.id] >= limiteErros) {
            socket.emit('mensagem', { mensagem: 'Jogo acabou para você! O limite de erros foi atingido.', erros: erros[socket.id] });
          } else {
            socket.emit('mensagem', { mensagem: `Erro! Você tem ${limiteErros - erros[socket.id]} tentativas restantes.`, letrasAdivinhadas: letrasAdivinhadas[socket.id], erros: erros[socket.id], palavraAtualizada: palavraAtualizada});
          }
          
    } else {
        const letrasRestantes = palavraSecreta.split('').filter(l => !letrasAdivinhadas[socket.id].includes(l));
        
        if (letrasRestantes.length === 0) {
          io.emit('vencedor', { vencedor: socket.id, palavraSecreta, palavraAtualizada});
          socket.on('resetar', () => {
            resetarJogo();
          });
        } else {
          socket.emit('mensagem', { mensagem: 'Boa! Letra correta!', letrasAdivinhadas: letrasAdivinhadas[socket.id], palavraAtualizada: palavraAtualizada});
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
  for(let id in erros){
    erros[id] = 0;
  }
  io.emit('resetar', { palavraAtualizada: palavraSecreta.split('').map(letra => '_').join(' '), mensagem: 'Jogo resetado!', erros});
}

server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
