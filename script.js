const URL_API = "https://script.google.com/macros/s/AKfycbzAmYptdFkB4lFZ08dCBVkMZDAXYQS7E4h8JPzHgRaygF20y3daOHl-633DQClmYShVjA/exec"; 
let participantes = [];

// ✅ controle do modal
let participanteSelecionadoIndex = null;

async function carregarDados() {
  try {
    const response = await fetch(URL_API);
    if (!response.ok) throw new Error('Falha na rede');
    participantes = await response.json();

    if (participantes.length === 0) {
      document.getElementById('lista-participantes').innerText = "Nenhum jovem encontrado na planilha.";
    } else {
      renderizarPontuacao();
    }
  } catch (error) {
    console.error("Erro ao carregar:", error);
    document.getElementById('lista-participantes').innerText = "Erro ao conectar com o Google Sheets.";
  }
}

// ATUALIZAÇÃO EM TEMPO REAL
async function buscarAtualizacoes() {
  try {
    const response = await fetch(URL_API);
    if (response.ok) {
      const novosDados = await response.json();
      if (JSON.stringify(novosDados) !== JSON.stringify(participantes)) {
        participantes = novosDados;

        if (document.getElementById('tela-ranking').style.display === 'block') {
          renderizarRanking();
        } else {
          renderizarPontuacao();
        }
      }
    }
  } catch (e) { console.warn("Erro sincronia"); }
}
setInterval(buscarAtualizacoes, 10000);

function renderizarPontuacao() {
  const lista = document.getElementById('lista-participantes');
  lista.innerHTML = '';
  participantes.forEach((p, index) => {
    lista.innerHTML += `
      <div class="linha-participante">
        <img src="fotos/${p.nome}.png" class="foto" onerror="this.src='https://via.placeholder.com/60?text=S/F'">
        <div class="nome">${p.nome}</div>
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

// ✅ Helper: depois de pontuar, atualiza a tela correta
function atualizarTelaAtual() {
  if (document.getElementById('tela-ranking').style.display === 'block') {
    renderizarRanking();
  } else {
    renderizarPontuacao();
  }
}

// FUNÇÃO: soma no geral e no “pilar” (mantive como está seu modelo)
async function atualizarPonto(index, pilar, valor) {
  if (confirm(`Confirmar +${valor} estrela(s) para ${participantes[index].nome} em ${pilar}?`)) {

    // 1) Soma no total geral
    participantes[index].pontos = (participantes[index].pontos || 0) + valor;

    // 2) Soma no pilar (mantém seu modelo do Sheets)
    const mapa = {
      'Presença': 'presenca',
      'Bíblia': 'biblia',
      'Revista': 'revista',
      'Oferta': 'oferta',
      'Visitantes': 'visitantes',
      'Aluno Efetivo': 'efetivo',
      'Pergunta': 'pergunta',
      'Apoio': 'apoio'
    };

    const chavePilar = mapa[pilar];
    if (chavePilar) {
      participantes[index][chavePilar] = (participantes[index][chavePilar] || 0) + valor;
    }

    document.getElementById('som-moeda').play();
    atualizarTelaAtual();

    // 3) Envia pro Sheets
    await fetch(URL_API, {
      method: 'POST',
      body: JSON.stringify(participantes[index])
    });
  }
}

function renderizarRanking() {
  const podio = document.getElementById('podio');
  podio.innerHTML = '';

  // ✅ importante: manter o index original pra pontuar certo no modal
  const ordenados = participantes
    .map((p, index) => ({ p, index }))
    .sort((a, b) => (b.p.pontos || 0) - (a.p.pontos || 0));

  ordenados.forEach(({ p, index }) => {
    let estrelasHTML = '<div style="display: flex; flex-direction: column-reverse; align-items: center;">';
    for (let i = 0; i < Math.min((p.pontos || 0), 40); i++) {
      estrelasHTML += `<div class="estrela-bloco"></div>`;
    }
    estrelasHTML += '</div>';

    podio.innerHTML += `
      <div class="coluna-ranking">
        ${estrelasHTML}

        <!-- ✅ agora a foto abre o pop-up -->
        <img 
          src="fotos/${p.nome}.png" 
          class="foto-ranking foto-ranking-click" 
          onclick="abrirModalPontos(${index})"
          onerror="this.src='https://via.placeholder.com/85?text=S/F'"
          title="Clique para pontuar"
        >

        <div class="info-ranking">
          <div class="nome-ranking">${p.nome}</div>
          <div class="total-estrelas">${p.pontos || 0} ⭐</div>
        </div>
      </div>`;
  });
}

/* -----------------------------
   ✅ MODAL DE PONTOS
------------------------------*/
function abrirModalPontos(index) {
  participanteSelecionadoIndex = index;
  const nome = participantes[index]?.nome || "Pontuar";
  document.getElementById('modal-nome').innerText = `Pontuar: ${nome}`;
  document.getElementById('modal-pontos').style.display = 'flex';
}

function fecharModalPontos() {
  document.getElementById('modal-pontos').style.display = 'none';
  participanteSelecionadoIndex = null;
}

function pontuarNoModal(pilar, valor) {
  if (participanteSelecionadoIndex === null) return;
  atualizarPonto(participanteSelecionadoIndex, pilar, valor);
}

// fecha clicando fora do conteúdo
document.addEventListener('click', (e) => {
  const modal = document.getElementById('modal-pontos');
  if (!modal) return;
  if (modal.style.display === 'flex' && e.target === modal) {
    fecharModalPontos();
  }
});

// NAVEGAÇÃO
function irParaRankingGeral() {
  document.getElementById('tela-principal').style.display = 'none';
  document.getElementById('tela-ranking').style.display = 'block';

  document.getElementById('btn-geral').style.display = 'none';
  document.getElementById('btn-voltar').style.display = 'block';

  renderizarRanking();
}

function voltarParaInicio() {
  fecharModalPontos();

  document.getElementById('tela-principal').style.display = 'block';
  document.getElementById('tela-ranking').style.display = 'none';

  document.getElementById('btn-geral').style.display = 'block';
  document.getElementById('btn-voltar').style.display = 'none';
}

carregarDados();