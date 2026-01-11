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
        document.getElementById('lista-participantes').innerText = "Erro ao conectar com o Google Sheets. Verifique a URL e as permissões.";
    }
}

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
        participantes[index].pontos += valor; // Adiciona o peso correto (1, 2 ou 3)
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
    const ordenados = [...participantes].sort((a, b) => a.pontos - b.pontos);

    ordenados.forEach(p => {
        let estrelas = '';
        // Mostra visualmente até 50 blocos para não quebrar o layout se tiverem muitos pontos
        const limiteVisual = Math.min(p.pontos, 50); 
        for(let i=0; i<limiteVisual; i++) {
            estrelas += `<div class="estrela-bloco"></div>`;
        }
        podio.innerHTML += `
            <div class="coluna-ranking">
                ${estrelas}
                <img src="fotos/${p.nome}.png" class="foto" onerror="this.src='https://via.placeholder.com/60?text=S/F'">
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