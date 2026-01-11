const URL_API = "https://script.google.com/macros/s/AKfycbzAmYptdFkB4lFZ08dCBVkMZDAXYQS7E4h8JPzHgRaygF20y3daOHl-633DQClmYShVjA/exec"; 
let participantes = [];

// 1. CARGA INICIAL
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

// 2. ATUALIZAÇÃO EM TEMPO REAL (Busca silenciosa em segundo plano)
async function buscarAtualizacoes() {
    try {
        const response = await fetch(URL_API);
        if (response.ok) {
            const novosDados = await response.json();
            
            // Verifica se houve mudança nos pontos para evitar "piscar" a tela sem necessidade
            if (JSON.stringify(novosDados) !== JSON.stringify(participantes)) {
                participantes = novosDados;
                
                // Atualiza a tela que estiver visível no momento
                const rankingVisivel = document.getElementById('tela-ranking').style.display === 'block';
                if (rankingVisivel) {
                    renderizarRanking();
                } else {
                    renderizarPontuacao();
                }
            }
        }
    } catch (error) {
        console.warn("Falha na sincronização em tempo real");
    }
}

// Configura para verificar a planilha a cada 10 segundos
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
        participantes[index].pontos += valor; 
        document.getElementById('som-moeda').play();
        renderizarPontuacao();

        await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify(participantes[index])
        });
    }
}

function renderizarRanking() {
    const podio = document.getElementById('podio');
    podio.innerHTML = '';
    const ordenados = [...participantes].sort((a, b) => b.pontos - a.pontos);

    ordenados.forEach(p => {
        let estrelasHTML = '<div style="display: flex; flex-direction: column-reverse; align-items: center;">';
        const limiteVisual = Math.min(p.pontos, 40); 
        
        for(let i = 0; i < limiteVisual; i++) {
            estrelasHTML += `<div class="estrela-bloco"></div>`;
        }
        estrelasHTML += '</div>';

        podio.innerHTML += `
            <div class="coluna-ranking">
                ${estrelasHTML}
                <img src="fotos/${p.nome}.png" class="foto-ranking" onerror="this.src='https://via.placeholder.com/85?text=S/F'">
                <div class="info-ranking" style="width: 100%; text-align: center; word-wrap: break-word;">
                    <div class="nome-ranking" style="display: block; margin-top: 10px;">${p.nome}</div>
                    <div class="total-estrelas" style="display: block; margin-top: 5px;">${p.pontos} ⭐</div>
                </div>
            </div>`;
    });
}

function trocarTela() {
    const principal = document.getElementById('tela-principal');
    const ranking = document.getElementById('tela-ranking');
    const btn = document.getElementById('btn-nav');

    if (ranking.style.display === 'none' || ranking.style.display === '') {
        renderizarRanking();
        ranking.style.display = 'block';
        principal.style.display = 'none';
        btn.innerText = 'VOLTAR PARA PONTOS';
    } else {
        ranking.style.display = 'none';
        principal.style.display = 'block';
        btn.innerText = 'VER RANKING';
    }
}

carregarDados();