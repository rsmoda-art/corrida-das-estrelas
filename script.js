const URL_API = "https://script.google.com/macros/s/AKfycbzAmYptdFkB4lFZ08dCBVkMZDAXYQS7E4h8JPzHgRaygF20y3daOHl-633DQClmYShVjA/exec"; 
let participantes = [];

// 1. CARGA INICIAL (Mantido original)
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

// 2. ATUALIZAÇÃO EM TEMPO REAL (Mantido original)
async function buscarAtualizacoes() {
    try {
        const response = await fetch(URL_API);
        if (response.ok) {
            const novosDados = await response.json();
            
            if (JSON.stringify(novosDados) !== JSON.stringify(participantes)) {
                participantes = novosDados;
                
                // Atualiza a tela que estiver visível no momento
                if (document.getElementById('tela-ranking').style.display === 'block') {
                    renderizarRanking();
                } else if (document.getElementById('tela-ranking-semana').style.display === 'block') {
                    renderizarRankingSemanaSimple();
                } else {
                    renderizarPontuacao();
                }
            }
        }
    } catch (error) {
        console.warn("Falha na sincronização em tempo real");
    }
}

setInterval(buscarAtualizacoes, 10000);

// 3. RENDERIZAÇÃO DA PONTUAÇÃO (Mantido original)
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
                    <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Apoio', 1)">Resposta em Aula (1)</button>
                </div>
            </div>`;
    });
}

// 4. ATUALIZAR PONTO (Mantido original)
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

// 5. RENDERIZAR RANKING GERAL (Mantido original com gráfico)
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

// --- NOVAS FUNÇÕES DE NAVEGAÇÃO E RANKING SEMANAL ---

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

function renderizarRankingSemanaSimple() {
    const podioSemana = document.getElementById('podio-semana');
    podioSemana.innerHTML = '';
    
    // Calcula o total da semana somando os pilares de cada um
    // Isso garante que se o geral for 1000, mas na semana ele fez 10, apareça 10.
    const ordenados = [...participantes].sort((a, b) => {
        let totalA = (a.presenca||0) + (a.biblia||0) + (a.revista||0) + (a.oferta||0) + (a.visitantes||0) + (a.efetivo||0) + (a.pergunta||0) + (a.apoio||0);
        let totalB = (b.presenca||0) + (b.biblia||0) + (b.revista||0) + (b.oferta||0) + (b.visitantes||0) + (b.efetivo||0) + (b.pergunta||0) + (b.apoio||0);
        return totalB - totalA;
    });

    ordenados.forEach(p => {
        let totalSemana = (p.presenca||0) + (p.biblia||0) + (p.revista||0) + (p.oferta||0) + (p.visitantes||0) + (p.efetivo||0) + (p.pergunta||0) + (p.apoio||0);
        
        // Tabela lateral com os pilares
        let pilaresHTML = `
            <div style="font-size: 0.65rem; color: #fcf6ba; text-align: left; background: rgba(0,0,0,0.4); padding: 5px; border-radius: 5px; margin-bottom: 5px; width: 90px;">
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
                <div class="info-ranking" style="width: 100%; text-align: center;">
                    <div class="nome-ranking" style="display: block; margin-top: 10px;">${p.nome}</div>
                    <div class="total-estrelas" style="display: block; margin-top: 5px;">${totalSemana} ⭐</div>
                </div>
            </div>`;
    });
}

carregarDados();