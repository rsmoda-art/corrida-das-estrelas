const URL_API = "https://script.google.com/macros/s/AKfycbzAmYptdFkB4lFZ08dCBVkMZDAXYQS7E4h8JPzHgRaygF20y3daOHl-633DQClmYShVjA/exec"; 
let participantes = [];

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
                } else if (document.getElementById('tela-ranking-semana').style.display === 'block') {
                    renderizarRankingSemanaSimple();
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

// FUNÇÃO CRÍTICA: CORRIGIDA PARA SOMAR NO GERAL E NO SEMANAL
async function atualizarPonto(index, pilar, valor) {
    if(confirm(`Confirmar +${valor} estrela(s) para ${participantes[index].nome} em ${pilar}?`)) {
        
        // 1. Soma no Total Geral (Coluna B)
        participantes[index].pontos = (participantes[index].pontos || 0) + valor; 
        
        // 2. Mapeia o nome do botão para a propriedade técnica (Colunas C a J)
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
        if(chavePilar) {
            // Soma no valor específico do pilar (Ranking Semanal)
            participantes[index][chavePilar] = (participantes[index][chavePilar] || 0) + valor;
        }

        document.getElementById('som-moeda').play();
        renderizarPontuacao();

        // 3. Envia o objeto completo para o Google Sheets
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
        for(let i = 0; i < Math.min(p.pontos, 40); i++) {
            estrelasHTML += `<div class="estrela-bloco"></div>`;
        }
        estrelasHTML += '</div>';
        podio.innerHTML += `
            <div class="coluna-ranking">
                ${estrelasHTML}
                <img src="fotos/${p.nome}.png" class="foto-ranking" onerror="this.src='https://via.placeholder.com/85?text=S/F'">
                <div class="info-ranking">
                    <div class="nome-ranking">${p.nome}</div>
                    <div class="total-estrelas">${p.pontos} ⭐</div>
                </div>
            </div>`;
    });
}

function renderizarRankingSemanaSimple() {
    const podioSemana = document.getElementById('podio-semana');
    podioSemana.innerHTML = '';
    
    // Ordena pela soma dos pilares da semana
    const ordenados = [...participantes].sort((a, b) => {
        let totalA = (a.presenca||0)+(a.biblia||0)+(a.revista||0)+(a.oferta||0)+(a.visitantes||0)+(a.efetivo||0)+(a.pergunta||0)+(a.apoio||0);
        let totalB = (b.presenca||0)+(b.biblia||0)+(b.revista||0)+(b.oferta||0)+(b.visitantes||0)+(b.efetivo||0)+(b.pergunta||0)+(b.apoio||0);
        return totalB - totalA;
    });

    ordenados.forEach(p => {
        let totalS = (p.presenca||0)+(p.biblia||0)+(p.revista||0)+(p.oferta||0)+(p.visitantes||0)+(p.efetivo||0)+(p.pergunta||0)+(p.apoio||0);
        
        let pilaresHTML = `
            <div style="font-size: 0.65rem; color: #fcf6ba; text-align: left; background: rgba(0,0,0,0.4); padding: 5px; border-radius: 5px; margin-bottom: 5px; width: 95px;">
                <div style="display:flex; justify-content:space-between"><span>Pres:</span> <span>${p.presenca||0}</span></div>
                <div style="display:flex; justify-content:space-between"><span>Bíb:</span> <span>${p.biblia||0}</span></div>
                <div style="display:flex; justify-content:space-between"><span>Rev:</span> <span>${p.revista||0}</span></div>
                <div style="display:flex; justify-content:space-between"><span>Of:</span> <span>${p.oferta||0}</span></div>
                <div style="display:flex; justify-content:space-between"><span>Vis:</span> <span>${p.visitantes||0}</span></div>
                <div style="display:flex; justify-content:space-between"><span>Efe:</span> <span>${p.efetivo||0}</span></div>
                <div style="display:flex; justify-content:space-between"><span>Per:</span> <span>${p.pergunta||0}</span></div>
                <div style="display:flex; justify-content:space-between"><span>Apo:</span> <span>${p.apoio||0}</span></div>
            </div>`;

        podioSemana.innerHTML += `
            <div class="coluna-ranking">
                ${pilaresHTML}
                <img src="fotos/${p.nome}.png" class="foto-ranking" onerror="this.src='https://via.placeholder.com/85?text=S/F'">
                <div class="info-ranking">
                    <div class="nome-ranking">${p.nome}</div>
                    <div class="total-estrelas">${totalS} ⭐</div>
                </div>
            </div>`;
    });
}

// NAVEGAÇÃO
function irParaRankingGeral() {
    document.getElementById('tela-principal').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'none';
    document.getElementById('tela-ranking').style.display = 'block';
    document.getElementById('btn-geral').style.display = 'none';
    document.getElementById('btn-semana').style.display = 'none';
    document.getElementById('btn-voltar').style.display = 'block';
    renderizarRanking(); 
}

function irParaRankingSemana() {
    document.getElementById('tela-principal').style.display = 'none';
    document.getElementById('tela-ranking').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'block';
    document.getElementById('btn-geral').style.display = 'none';
    document.getElementById('btn-semana').style.display = 'none';
    document.getElementById('btn-voltar').style.display = 'block';
    renderizarRankingSemanaSimple(); 
}

function voltarParaInicio() {
    document.getElementById('tela-principal').style.display = 'block';
    document.getElementById('tela-ranking').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'none';
    document.getElementById('btn-geral').style.display = 'block';
    document.getElementById('btn-semana').style.display = 'block';
    document.getElementById('btn-voltar').style.display = 'none';
}

carregarDados();