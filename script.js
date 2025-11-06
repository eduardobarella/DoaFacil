// =====================
// Sessão do usuário
// =====================
function setUsuarioLogado(usuario) {
  localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
}
function getUsuarioLogado() {
  const raw = localStorage.getItem("usuarioLogado");
  return raw ? JSON.parse(raw) : null;
}
function logout() {
  localStorage.removeItem("usuarioLogado");
  atualizarInterfaceUsuario();
}

// =====================
// UI / Navegação
// =====================
function atualizarInterfaceUsuario() {
  const headerNav = document.querySelector("nav");
  const usuario = getUsuarioLogado();

  if (usuario) {
    headerNav.innerHTML = `
      <div class="user-info">
        <div class="user-avatar">${(usuario.nome || "U").charAt(0).toUpperCase()}</div>
        <span>Olá, ${usuario.nome?.split(" ")[0] || "Usuário"}</span>
      </div>
      <button class="btn-secondary" onclick="logout()">
        <i class="fas fa-sign-out-alt"></i> Sair
      </button>
    `;
  } else {
    headerNav.innerHTML = `
      <button class="btn-secondary" onclick="abrirModal('login')">
        <i class="fas fa-sign-in-alt"></i> Entrar
      </button>
      <button class="btn-primary" onclick="abrirModal('cadastro')">
        <i class="fas fa-user-plus"></i> Cadastrar
      </button>
    `;
  }
}

function abrirModal(tipo) {
  document.getElementById(`modal-${tipo}`).style.display = "flex";
}
function fecharModal(tipo) {
  document.getElementById(`modal-${tipo}`).style.display = "none";
}
window.onclick = function (event) {
  if (event.target.classList?.contains("modal")) {
    event.target.style.display = "none";
  }
};

function mudarAba(event, abaId) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  event.currentTarget.classList.add("active");
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  document.getElementById(abaId).classList.add("active");
}

// =====================
// API helpers
// =====================
const API = "http://localhost:3000";

async function apiPost(path, body) {
  const resp = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.erro || "Erro na requisição");
  return data;
}

async function apiGet(path) {
  const resp = await fetch(`${API}${path}`);
  const data = await resp.json().catch(() => ([]));
  if (!resp.ok) throw new Error(data.erro || "Erro na requisição");
  return data;
}

// =====================
// Cadastro / Login
// =====================
document.getElementById("form-cadastro")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome-completo").value;
  const email = document.getElementById("email-cadastro").value;
  const senha = document.getElementById("senha-cadastro").value;
  const telefone = document.getElementById("telefone").value;
  const endereco = document.getElementById("endereco").value;

  try {
    await apiPost("/register", { nome, telefone, endereco, email, senha });
    alert("Usuário cadastrado com sucesso!");
    fecharModal("cadastro");
    // opcional: login automático, se quiser
    // const login = await apiPost("/login", { email, senha });
    // setUsuarioLogado(login.usuario); atualizarInterfaceUsuario();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("form-login")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email-login").value;
  const senha = document.getElementById("senha-login").value;

  try {
    const data = await apiPost("/login", { email, senha });
    setUsuarioLogado(data.usuario);
    fecharModal("login");
    atualizarInterfaceUsuario();
    alert("Login realizado com sucesso!");
  } catch (err) {
    alert(err.message);
  }
});

// =====================
// Doar (somente logado)
// =====================
document.getElementById("form-doacao")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = getUsuarioLogado();
  if (!user) {
    alert("Você precisa estar logado para doar.");
    abrirModal("login");
    return;
  }

  const alimento = document.getElementById("alimento").value;
  const validade = document.getElementById("validade").value;

  if (!alimento || !validade) {
    alert("Informe alimento e validade.");
    return;
  }

  try {
    await apiPost("/doar", { usuario_id: user.id, alimento, validade });
    alert("Doação cadastrada com sucesso!");
    fecharModal("doacao");
    carregarDoacoes();
    document.getElementById("form-doacao").reset();
  } catch (err) {
    alert(err.message);
  }
});

// =====================
// Lista de doações (API)
// =====================
async function carregarDoacoes() {
  try {
    const doacoes = await apiGet("/doacoes");
    const lista = document.getElementById("lista-doacoes-disponiveis");
    lista.innerHTML = "";

    if (!doacoes.length) {
      lista.innerHTML = '<li class="card"><p>Não há doações disponíveis no momento.</p></li>';
      return;
    }

    doacoes.forEach(d => {
      const li = document.createElement("li");
      li.className = "card";
      li.innerHTML = `
        <h3>${d.alimento}</h3>
        <p>Validade: ${new Date(d.validade).toLocaleDateString("pt-BR")}</p>
        <div class="meta">
          <span>Doador: ${d.nome}</span>
        </div>
        <div class="doacao-actions">
          <button class="btn-success" onclick="alert('📞 ${d.telefone}\\n📍 ${d.endereco}')">
            Contatar
          </button>
        </div>
      `;
      lista.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

// =====================
// Máscara de telefone (cadastro)
// =====================
function mascaraTelefone(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}
document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "telefone") {
    e.target.value = mascaraTelefone(e.target.value);
  }
});

// =====================
// Mapa (se existir na página)
// =====================
try {
  let mapa = L.map("mapaSimulado").setView([-23.55, -46.63], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapa);

  L.marker([-23.55, -46.64]).addTo(mapa).bindPopup("Centro - Doações disponíveis").openPopup();
  L.marker([-23.56, -46.66]).addTo(mapa).bindPopup("Zona Sul - Alimentos não perecíveis");
  L.marker([-23.54, -46.62]).addTo(mapa).bindPopup("Zona Leste - Hortifruti");
} catch (_) { /* ignora se não houver mapa */ }

function abrirModal(id) {
  document.getElementById('modal-' + id).style.display = 'flex';
  document.body.classList.add('modal-aberto');
}

function fecharModal(id) {
  document.getElementById('modal-' + id).style.display = 'none';
  document.body.classList.remove('modal-aberto');
}


// =====================
// Inicialização
// =====================
document.addEventListener("DOMContentLoaded", () => {
  atualizarInterfaceUsuario();
  carregarDoacoes();
});
