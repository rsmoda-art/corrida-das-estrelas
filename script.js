// ATENÇÃO: Substitua o link abaixo pela sua URL do Google Apps Script que termina em /exec
const URL_API = "https://script.google.com/macros/s/AKfycbzAmYptdFkB4lFZ08dCBVkMZDAXYQS7E4h8JPzHgRaygF20y3daOHl-633DQClmYShVjA/exec"; 

let participantes = [];

// Função de Carga Inicial
async function carregarDados() {
    try {
        const response = await fetch(URL_API);
        if (!response.ok) throw new Error('Falha na rede');
        participantes = await response.json();
        
        // Remove mensagem de carregamento e mostra a lista
        const lista = document.getElementById('lista-participantes');
        if (participantes.length === 0) {
            lista.innerText = "Nenhum jovem encontrado na planilha.";
        } else {
            renderizarPontuacao();
        }
    } catch (error) {
        console.error("Erro ao carregar:", error);
        document.getElementById('lista-participantes').innerText = "Erro de conexão. Verifique o link do Google.";
    }
}

// ETAPA 1: Renderizar Ranking Geral
function renderizarRankingGeral() {
    const podio = document.getElementById('podio');
    podio.innerHTML = ''; 
    
    // Organiza do MAIOR para o MENOR
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
                <div class="info-ranking" style="width: 100%; text-align: center;">
                    <div class="nome-ranking" style="display: block; margin-top: 10px; font-weight: bold;">${p.nome}</div>
                    <div class="total-estrelas" style="display: block; margin-top: 5px; color: gold;">${p.pontos} ⭐</div>
                </div>
            </div>`;
    });
}

// Navegação para Ranking Geral
function irParaGeral() {
    document.getElementById('tela-principal').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'none';
    document.getElementById('tela-ranking').style.display = 'block';
    
    // Ajuste de Botões
    document.getElementById('btn-geral').style.display = 'none';
    document.getElementById('btn-semana').style.display = 'none';
    document.getElementById('btn-nav').style.display = 'inline-block';
    
    renderizarRankingGeral();
}

// Voltar para Início
function voltarPontos() {
    document.getElementById('tela-ranking').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'none';
    document.getElementById('tela-principal').style.display = 'block';
    
    document.getElementById('btn-geral').style.display = 'inline-block';
    document.getElementById('btn-semana').style.display = 'inline-block';
    document.getElementById('btn-nav').style.display = 'none';
    
    renderizarPontuacao();
}

// Mantém sua função renderizarPontuacao e atualizarPonto aqui...
function renderizarPontuacao() {
    const lista = document.getElementById('lista-participantes');
    lista.innerHTML = '';
    participantes.forEach((p, index) => {
        lista.innerHTML += `
            <div class="linha-participante">
                <img src="fotos/${p.nome}.png" class="foto" onerror="this.src='https://via.placeholder.com/60?text=S/F'">
                <div class="nome">${p.nome}</div>
                <div class="botoes-container">
                    <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Presença', 1)">P (1)</button>
                    <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Bíblia', 2)">B (2)</button>
                    <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Revista', 2)">R (2)</button>
                    <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Oferta', 2)">O (2)</button>
                </div>
            </div>`;
    });
}

async function atualizarPonto(index, pilar, valor) {
    if(confirm(`+${valor} estrelas para ${participantes[index].nome}?`)) {
        participantes[index].pontos += valor; 
        document.getElementById('som-moeda').play();
        renderizarPontuacao();
        await fetch(URL_API, { method: 'POST', body: JSON.stringify(participantes[index]) });
    }
}

carregarDados();