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
                <div class="nome"><strong>${p.nome}</strong></div>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Presença', 1)">PRESENÇA (1)</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Bíblia', 2)">BÍBLIA (2)</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Revista', 2)">REVISTA (2)</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Oferta', 2)">OFERTA (2)</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Visitante', 3)">VISITANTES (3)</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Aluno Efetivo', 2)">ALUNO EFETIVO (2)</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Pergunta Surpresa', 3)">PERGUNTA (3)</button>
                <button class="btn-ponto" onclick="atualizarPonto(${index}, 'Apoio', 1)">APOIO (1)</button>
            </div>`;
    });
}

async function atualizarPonto(index, pilar, valor) {
    if(confirm(`Adicionar ${valor} estrela(s) para ${participantes[index].nome} em ${pilar}?`)) {
        // Agora somamos o valor específico do critério
        participantes[index].pontos += valor;
        document.getElementById('som-moeda').play();
        
        renderizarPontuacao();

        // Envia para o Google Sheets (a planilha receberá o novo total)
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