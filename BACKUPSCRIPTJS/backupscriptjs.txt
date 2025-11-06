let mapa = L.map('mapaSimulado').setView([-23.55, -46.63], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);

function abrirFormulario() {
  document.getElementById('formulario').style.display = 'block';
}

async function enviarDoacao() {
  const nome = document.getElementById('nome').value;
  const alimento = document.getElementById('alimento').value;
  const validade = document.getElementById('validade').value;

  const resposta = await fetch('http://localhost:3000/doar', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ nome, alimento, validade })
  });

  if (resposta.ok) {
    alert('Doação enviada!');
    carregarDoacoes();
  }
}

async function carregarDoacoes() {
  const resposta = await fetch('http://localhost:3000/doacoes');
  const dados = await resposta.json();
  const lista = document.getElementById('doacoes');
  lista.innerHTML = '';
  dados.forEach(d => {
    const li = document.createElement('li');
    li.textContent = `${d.nome} doou ${d.alimento} (Validade: ${d.validade})`;
    lista.appendChild(li);
  });
}
