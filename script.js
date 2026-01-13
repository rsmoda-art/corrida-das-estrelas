const URL_API = "https://script.google.com/macros/s/AKfycbzAmYptdFkB4lFZ08dCBVkMZDAXYQS7E4h8JPzHgRaygF20y3daOHl-633DQClmYShVjA/exec"; 
let participantes = [];

// Gerenciamento do Ranking Semanal (LocalStorage)
let rankingSemanal = JSON.parse(localStorage.getItem('rankingSemana')) || {};

// Função para verificar se é hora de zerar (Sábado 23:59)
function verificarResetSemanal() {
    const agora = new Date();
    const diaSemana = agora.getDay(); // 6 é Sábado
    const hora = agora.getHours();
    const minuto = agora.getMinutes();

    const ultimoReset = localStorage.getItem('ultimoResetSemana');
    const dataAtualString = agora.toDateString();

    if (diaSemana === 6 && hora === 23 && minuto === 59 && ultimoReset !== dataAtualString) {
        rankingSemanal = {};
        localStorage.setItem('rankingSemana', JSON.stringify(rankingSemanal));
        localStorage.setItem('ultimoResetSemana', dataAtualString);
    }
}

async function carregarDados() {
    verificarResetSemanal();
    try {
        const response = await fetch(URL_API);
        if (!response.ok) throw new Error('Falha na rede');
        participantes = await response.json();
        
        // Garante que o texto de carregamento suma e a tela apareça
        const container = document.getElementById('lista-participantes');
        if (participantes.length === 0) {
            container.innerText = "Nenhum jovem encontrado na planilha.";
        } else {
            renderizarPontuacao();
        }
    } catch (error) {
        console.error("Erro:", error);
        document.getElementById('lista-participantes').innerText = "Erro ao conectar com o Google Sheets.";
    }
}

// ATUALIZAÇÃO EM TEMPO REAL (Busca silenciosa)
async function buscarAtualizacoes() {
    try {
        const response = await fetch(URL_API);
        if (response.ok) {
            const novosDados = await response.json();
            if (JSON.stringify(novosDados) !== JSON.stringify(participantes)) {
                participantes = novosDados;
                // Atualiza apenas a tela que estiver aberta
                if (document.getElementById('tela-ranking').style.display === 'block') {
                    renderizarRanking('podio', false);
                } else if (document.getElementById('tela-ranking-semana').style.display === 'block') {
                    renderizarRanking('podio-semana', true);
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
                    <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Aluno Efetivo', 2)">Aluno Efetivo (2)</button>
                    <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Pergunta', 3)">Pergunta (3)</button>
                    <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Apoio', 1)">Apoio (1)</button>
                </div>
            </div>`;
    });
}

async function atualizarPonto(index, pilar, valor) {
    if(confirm(`Confirmar +${valor} estrela(s) para ${participantes[index].nome} em ${pilar}?`)) {
        const nome = participantes[index].nome;
        participantes[index].pontos += valor; 
        
        if (!rankingSemanal[nome]) rankingSemanal[nome] = { total: 0, pilares: {} };
        rankingSemanal[nome].total += valor;
        rankingSemanal[nome].pilares[pilar] = (rankingSemanal[nome].pilares[pilar] || 0) + valor;
        
        localStorage.setItem('rankingSemana', JSON.stringify(rankingSemanal));
        document.getElementById('som-moeda').play();
        
        renderizarPontuacao();
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(participantes[index]) });
    }
}

function renderizarRanking(containerId, isSemanal) {
    const podio = document.getElementById(containerId);
    podio.innerHTML = '';
    
    let ordenados = isSemanal 
        ? [...participantes].sort((a, b) => (rankingSemanal[b.nome]?.total || 0) - (rankingSemanal[a.nome]?.total || 0))
        : [...participantes].sort((a, b) => b.pontos - a.pontos);

    ordenados.forEach(p => {
        const pontosSemana = rankingSemanal[p.nome] || { total: 0, pilares: {} };
        const totalExibir = isSemanal ? pontosSemana.total : p.pontos;
        
        let estrelasHTML = '<div style="display: flex; flex-direction: column-reverse; align-items: center;">';
        for(let i = 0; i < Math.min(totalExibir, 40); i++) {
            estrelasHTML += `<div class="estrela-bloco"></div>`;
        }
        estrelasHTML += '</div>';

        let pilaresHTML = '';
        if (isSemanal) {
            pilaresHTML = `<div class="tabela-pilares">`;
            const listaPilares = ['Presença', 'Bíblia', 'Revista', 'Oferta', 'Visitantes', 'Aluno Efetivo', 'Pergunta', 'Apoio'];
            listaPilares.forEach(pil => {
                pilaresHTML += `<div class="pilar-item"><span>${pil}:</span> <span>${pontosSemana.pilares[pil] || 0}</span></div>`;
            });
            pilaresHTML += `</div>`;
        }

        podio.innerHTML += `
            <div class="coluna-ranking">
                ${isSemanal ? pilaresHTML : ''}
                ${estrelasHTML}
                <img src="fotos/${p.nome}.png" class="foto-ranking" onerror="this.src='https://via.placeholder.com/85?text=S/F'">
                <div class="info-ranking" style="width: 100%; text-align: center; word-wrap: break-word;">
                    <div class="nome-ranking" style="display: block; margin-top: 10px;">${p.nome}</div>
                    <div class="total-estrelas" style="display: block; margin-top: 5px;">${totalExibir} ⭐</div>
                </div>
            </div>`;
    });
}

// NAVEGAÇÃO CORRIGIDA
function irParaGeral() {
    document.getElementById('tela-principal').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'none';
    document.getElementById('tela-ranking').style.display = 'block';
    
    // Mostra apenas o botão Voltar
    document.getElementById('btn-geral').style.display = 'none';
    document.getElementById('btn-semana').style.display = 'none';
    document.getElementById('btn-nav').style.display = 'inline-block';
    
    renderizarRanking('podio', false);
}

function irParaSemana() {
    document.getElementById('tela-principal').style.display = 'none';
    document.getElementById('tela-ranking').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'block';
    
    // Mostra apenas o botão Voltar
    document.getElementById('btn-geral').style.display = 'none';
    document.getElementById('btn-semana').style.display = 'none';
    document.getElementById('btn-nav').style.display = 'inline-block';
    
    renderizarRanking('podio-semana', true);
}

function voltarPontos() {
    document.getElementById('tela-principal').style.display = 'block';
    document.getElementById('tela-ranking').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'none';
    
    // Restaura botões originais
    document.getElementById('btn-geral').style.display = 'inline-block';
    document.getElementById('btn-semana').style.display = 'inline-block';
    document.getElementById('btn-nav').style.display = 'none';
    
    renderizarPontuacao();
}

// Certifique-se de que os IDs dos botões no seu HTML batam com estes:
// btn-geral, btn-semana e btn-nav (o de voltar)

carregarDados();