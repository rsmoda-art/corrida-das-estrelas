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

    // Se for domingo (0) ou se já passou do horário de reset no sábado
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
        renderizarPontuacao();
    } catch (error) {
        console.error("Erro:", error);
    }
}

// Atualizada para salvar também no semanal
async function atualizarPonto(index, pilar, valor) {
    if(confirm(`Confirmar +${valor} estrela(s) para ${participantes[index].nome} em ${pilar}?`)) {
        const nome = participantes[index].nome;
        
        // Ranking Geral (Nuvem)
        participantes[index].pontos += valor; 
        
        // Ranking Semanal (Local)
        if (!rankingSemanal[nome]) {
            rankingSemanal[nome] = { total: 0, pilares: {} };
        }
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
    
    let ordenados;
    if (isSemanal) {
        ordenados = [...participantes].sort((a, b) => (rankingSemanal[b.nome]?.total || 0) - (rankingSemanal[a.nome]?.total || 0));
    } else {
        ordenados = [...participantes].sort((a, b) => b.pontos - a.pontos);
    }

    ordenados.forEach(p => {
        const pontosSemana = rankingSemanal[p.nome] || { total: 0, pilares: {} };
        const totalExibir = isSemanal ? pontosSemana.total : p.pontos;
        
        let estrelasHTML = '<div style="display: flex; flex-direction: column-reverse; align-items: center;">';
        for(let i = 0; i < Math.min(totalExibir, 40); i++) {
            estrelasHTML += `<div class="estrela-bloco"></div>`;
        }
        estrelasHTML += '</div>';

        // HTML dos pilares (apenas para tela semanal)
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
                <div class="info-ranking">
                    <div class="nome-ranking">${p.nome}</div>
                    <div class="total-estrelas">${totalExibir} ⭐</div>
                </div>
            </div>`;
    });
}

// Funções de Navegação
function irParaGeral() {
    document.getElementById('tela-principal').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'none';
    document.getElementById('tela-ranking').style.display = 'block';
    document.getElementById('btn-nav').innerText = 'VOLTAR';
    document.getElementById('btn-nav').onclick = voltarPontos;
    renderizarRanking('podio', false);
}

function irParaSemana() {
    document.getElementById('tela-principal').style.display = 'none';
    document.getElementById('tela-ranking').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'block';
    document.getElementById('btn-semana').innerText = 'VOLTAR';
    document.getElementById('btn-semana').onclick = voltarPontos;
    renderizarRanking('podio-semana', true);
}

function voltarPontos() {
    document.getElementById('tela-principal').style.display = 'block';
    document.getElementById('tela-ranking').style.display = 'none';
    document.getElementById('tela-ranking-semana').style.display = 'none';
    document.getElementById('btn-nav').innerText = 'RANKING GERAL';
    document.getElementById('btn-nav').onclick = irParaGeral;
    document.getElementById('btn-semana').innerText = 'RANKING SEMANA';
    document.getElementById('btn-semana').onclick = irParaSemana;
}

carregarDados();