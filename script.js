const URL_API = "https://script.google.com/macros/s/AKfycbzAmYptdFkB4lFZ08dCBVkMZDAXYQS7E4h8JPzHgRaygF20y3daOHl-633DQClmYShVjA/exec";
let participantes = [];

// Modal
let participanteSelecionadoIndex = null;

/* -----------------------------
   FOTO: robusto contra 404
   Tenta:
   1) ./fotos/NOME.png
   2) ./NOME.png
   3) placeholder
------------------------------*/
function fotoUrlPreferida(nome) {
  return encodeURI(`./fotos/${nome}.png`);
}
function fotoUrlAlternativa(nome) {
  return encodeURI(`./${nome}.png`);
}
function handleImageError(imgEl, nome) {
  const atual = imgEl.getAttribute("data-try") || "1";

  if (atual === "1") {
    imgEl.setAttribute("data-try", "2");
    imgEl.src = fotoUrlAlternativa(nome);
    return;
  }

  imgEl.src = "https://via.placeholder.com/85?text=S/F";
}

/* -----------------------------
   CARREGAR / ATUALIZAR DADOS
------------------------------*/
async function carregarDados() {
  try {
    const response = await fetch(URL_API, { method: "GET" });
    if (!response.ok) throw new Error("Falha na rede");

    participantes = await response.json();

    const lista = document.getElementById("lista-participantes");
    if (!participantes || participantes.length === 0) {
      lista.innerText = "Nenhum jovem encontrado na planilha.";
      return;
    }

    renderizarPontuacao();
  } catch (error) {
    console.error("Erro ao carregar:", error);
    const lista = document.getElementById("lista-participantes");
    if (lista) lista.innerText = "Erro ao conectar com o Google Sheets.";
  }
}

async function buscarAtualizacoes() {
  try {
    const response = await fetch(URL_API, { method: "GET" });
    if (!response.ok) return;

    const novosDados = await response.json();
    if (JSON.stringify(novosDados) !== JSON.stringify(participantes)) {
      participantes = novosDados;

      const telaRanking = document.getElementById("tela-ranking");
      const estaNoRanking = telaRanking && telaRanking.style.display === "block";

      if (estaNoRanking) renderizarRanking();
      else renderizarPontuacao();
    }
  } catch (e) {
    // silencioso
  }
}
setInterval(buscarAtualizacoes, 10000);

/* -----------------------------
   RENDER: PONTUAÇÃO (TELA INICIAL)
------------------------------*/
function renderizarPontuacao() {
  const lista = document.getElementById("lista-participantes");
  if (!lista) return;

  lista.innerHTML = "";

  participantes.forEach((p, index) => {
    lista.innerHTML += `
      <div class="linha-participante">
        <img 
          src="${fotoUrlPreferida(p.nome)}"
          class="foto"
          data-try="1"
          onerror="handleImageError(this, '${escapeAspas(p.nome)}')"
          alt="Foto ${escapeHtml(p.nome)}"
        >
        <div class="nome">${escapeHtml(p.nome)}</div>

        <div class="botoes-container">
          <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Presença', 1)">Presença (1)</button>
          <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Bíblia', 2)">Bíblia (2)</button>
          <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Revista', 2)">Revista (2)</button>
          <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Oferta', 2)">Oferta (2)</button>
          <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Visitantes', 3)">Visitantes (3)</button>
          <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Aluno Efetivo', 2)">Efetivo (2)</button>
          <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Pergunta', 3)">Pergunta (3)</button>
          <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Apoio', 1)">Apoio (1)</button>
        </div>
      </div>`;
  });
}

function atualizarTelaAtual() {
  const telaRanking = document.getElementById("tela-ranking");
  const estaNoRanking = telaRanking && telaRanking.style.display === "block";
  if (estaNoRanking) renderizarRanking();
  else renderizarPontuacao();
}

/* -----------------------------
   REGRAS DE PONTOS + SALVAR
------------------------------*/
async function atualizarPonto(index, pilar, valor) {
  const p = participantes[index];
  if (!p) return;

  const sinal = valor >= 0 ? "+" : "";
  const ok = confirm(`Confirmar ${sinal}${valor} estrela(s) para ${p.nome} em ${pilar}?`);
  if (!ok) return;

  // total geral (não deixa negativo)
  const novoTotal = (p.pontos || 0) + valor;
  p.pontos = Math.max(0, novoTotal);

  // por pilar (campos do Sheets)
  const mapa = {
    "Presença": "presenca",
    "Bíblia": "biblia",
    "Revista": "revista",
    "Oferta": "oferta",
    "Visitantes": "visitantes",
    "Aluno Efetivo": "efetivo",
    "Pergunta": "pergunta",
    "Apoio": "apoio",
  };

  const chave = mapa[pilar];
  if (chave) {
    const novoPilar = (p[chave] || 0) + valor;
    p[chave] = Math.max(0, novoPilar);
  }

  // som (toca apenas quando adiciona ponto)
  if (valor > 0) {
    const audio = document.getElementById("som-moeda");
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  }

  atualizarTelaAtual();

  // envia pro Sheets
  try {
    await fetch(URL_API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(p),
    });
  } catch (e) {
    console.warn("Falha ao enviar ao Sheets (ficou só local até atualizar):", e);
  }
}

/* -----------------------------
   RENDER: RANKING GERAL (ESCALA AUTOMÁTICA)
   - máximo do gráfico = maior pontuação atual
   - todos proporcionais ao líder
------------------------------*/
function renderizarRanking() {
  const podio = document.getElementById("podio");
  if (!podio) return;

  podio.innerHTML = "";

  const ordenados = participantes
    .map((p, index) => ({ p, index }))
    .sort((a, b) => (b.p.pontos || 0) - (a.p.pontos || 0));

  const maxPoints = Math.max(0, ...ordenados.map(x => x.p.pontos || 0));
  const VISUAL_STEPS = 40; // altura visual fixa

  ordenados.forEach(({ p, index }) => {
    const total = p.pontos || 0;

    // blocos proporcionais ao máximo
    let blocos = 0;
    if (maxPoints > 0) {
      blocos = Math.round((total / maxPoints) * VISUAL_STEPS);
      if (total > 0 && blocos === 0) blocos = 1; // não some visualmente
    }

    let estrelasHTML = '<div class="coluna-estrelas">';
    for (let i = 0; i < blocos; i++) {
      estrelasHTML += `<div class="estrela-bloco"></div>`;
    }
    estrelasHTML += "</div>";

    podio.innerHTML += `
      <div class="coluna-ranking">
        ${estrelasHTML}

        <img 
          src="${fotoUrlPreferida(p.nome)}"
          class="foto-ranking foto-ranking-click"
          data-try="1"
          onerror="handleImageError(this, '${escapeAspas(p.nome)}')"
          onclick="abrirModalPontos(${index})"
          title="Clique para pontuar"
          alt="Foto ${escapeHtml(p.nome)}"
        >

        <div class="info-ranking">
          <div class="nome-ranking">${escapeHtml(p.nome)}</div>
          <div class="total-estrelas">${total} ⭐</div>
        </div>
      </div>`;
  });
}

/* -----------------------------
   MODAL DE PONTOS (RANKING)
------------------------------*/
function abrirModalPontos(index) {
  participanteSelecionadoIndex = index;
  const p = participantes[index];
  const nome = p?.nome || "Pontuar";

  const titulo = document.getElementById("modal-nome");
  const modal = document.getElementById("modal-pontos");

  if (titulo) titulo.innerText = `Pontuar: ${nome}`;
  if (modal) modal.style.display = "flex";
}

function fecharModalPontos() {
  const modal = document.getElementById("modal-pontos");
  if (modal) modal.style.display = "none";
  participanteSelecionadoIndex = null;
}

function pontuarNoModal(pilar, valor) {
  if (participanteSelecionadoIndex === null) return;
  atualizarPonto(participanteSelecionadoIndex, pilar, valor);
}

/* ✅ NOVO: DESFAZER (-1) */
function desfazerUmNoModal() {
  if (participanteSelecionadoIndex === null) return;

  const p = participantes[participanteSelecionadoIndex];
  if (!p) return;

  if ((p.pontos || 0) <= 0) {
    alert("Este adolescente já está com 0 pontos.");
    return;
  }

  const ok = confirm(`Desfazer 1 ponto de ${p.nome}? (-1 no total)`);
  if (!ok) return;

  // aqui é “desfazer rápido”: tira 1 APENAS do total (evita complicar qual pilar foi clicado errado)
  p.pontos = Math.max(0, (p.pontos || 0) - 1);

  atualizarTelaAtual();

  // salva no Sheets
  fetch(URL_API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(p),
  }).catch(() => {});
}

// fecha modal clicando fora
document.addEventListener("click", (e) => {
  const modal = document.getElementById("modal-pontos");
  if (!modal) return;
  if (modal.style.display === "flex" && e.target === modal) fecharModalPontos();
});

// ESC fecha modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModalPontos();
});

/* -----------------------------
   NAVEGAÇÃO (SEM RANKING SEMANAL)
------------------------------*/
function irParaRankingGeral() {
  const telaPrincipal = document.getElementById("tela-principal");
  const telaRanking = document.getElementById("tela-ranking");

  const btnGeral = document.getElementById("btn-geral");
  const btnVoltar = document.getElementById("btn-voltar");

  if (telaPrincipal) telaPrincipal.style.display = "none";
  if (telaRanking) telaRanking.style.display = "block";

  if (btnGeral) btnGeral.style.display = "none";
  if (btnVoltar) btnVoltar.style.display = "block";

  renderizarRanking();
}

function voltarParaInicio() {
  fecharModalPontos();

  const telaPrincipal = document.getElementById("tela-principal");
  const telaRanking = document.getElementById("tela-ranking");

  const btnGeral = document.getElementById("btn-geral");
  const btnVoltar = document.getElementById("btn-voltar");

  if (telaPrincipal) telaPrincipal.style.display = "block";
  if (telaRanking) telaRanking.style.display = "none";

  if (btnGeral) btnGeral.style.display = "block";
  if (btnVoltar) btnVoltar.style.display = "none";
}

/* -----------------------------
   Helpers de segurança (HTML/aspas)
------------------------------*/
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAspas(str) {
  return String(str).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

/* Start */
carregarDados();