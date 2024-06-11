const socket = io();

const mensagens = document.getElementById('mensagens');
const chuteInput = document.getElementById('chute');

socket.on('mensagem', (data) => {
  mensagens.innerHTML += `<p>${data.mensagem}</p>`;
  if (data.letrasAdivinhadas) {
    mensagens.innerHTML += `<p>Letras adivinhadas: ${data.letrasAdivinhadas.join(', ')}</p>`;
  }
});

socket.on('vencedor', (data) => {
  mensagens.innerHTML += `<p>O jogador ${data.vencedor} venceu! A palavra era: ${data.palavraSecreta}</p>`;
});

function enviarChute() {
  const letra = chuteInput.value;
  socket.emit('chutar', letra);
  chuteInput.value = '';
}
