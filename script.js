const URL_API = "SUA_URL_DO_GOOGLE"; 
let participantes = [];

async function carregarDados() {
    const response = await fetch(URL_API);
    participantes = await response.json();
    renderizarPontuacao();
}

function renderizarPontuacao() {
    const lista = document.getElementById('lista-participantes');
    lista.innerHTML = '';
    participantes.forEach((p, index) => {
        lista.innerHTML += `
            <div class="linha-participante">
                <img src="https://via.placeholder.com/60" class="foto">
                <div class="nome"><strong>${p.nome}</strong></div>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Presença')">PRESENÇA</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Bíblia')">BÍBLIA</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Oferta')">OFERTA</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Pergunta')">PERGUNTA</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Apoio')">APOIO</button>
            </div>`;
    });
}

async function atualizarPonto(index, pilar) {
    if(confirm(`Adicionar estrela para ${participantes[index].nome} em ${pilar}?`)) {
        participantes[index].pontos++;
        document.getElementById('som-moeda').play();
        
        // Renderiza na tela imediatamente para ser rápido
        renderizarPontuacao();

        // Envia para o Google Sheets
        await fetch(URL_API, {
            method: 'POST',
            body: JSON.stringify(participantes[index])
        });
    }
}

function renderizarRanking() {
    const podio = document.getElementById('podio');
    podio.innerHTML = '';
    const ordenados = [...participantes].sort((a, b) => a.pontos - b.pontos);

    ordenados.forEach(p => {
        let estrelas = '';
        for(let i=0; i<p.pontos; i++) {
            estrelas += `<div class="estrela-bloco"></div>`;
        }
        podio.innerHTML += `
            <div class="coluna-ranking">
                ${estrelas}
                <img src="https://via.placeholder.com/60" class="foto">
                <div style="font-size:12px; font-weight:bold">${p.nome}</div>
                <div style="color:gold">${p.pontos} ⭐</div>
            </div>`;
    });
}

function trocarTela() {
    const principal = document.getElementById('tela-principal');
    const ranking = document.getElementById('tela-ranking');
    const btn = document.getElementById('btn-nav');

    if (ranking.style.display === 'none') {
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