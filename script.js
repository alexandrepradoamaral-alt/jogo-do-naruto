const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mensagemEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

// VARIÁVEIS PRINCIPAIS
let pontos = 0;
let vidas = 3;
let faseAtual = 0;
let gameOver = false;
let vitoria = false;
const gravidade = 0.55;
let anguloShuriken = 0;
let frameAnimacao = 0; // Controla o movimento das pernas e braços

// TECLADO
const teclas = {};
window.addEventListener("keydown", (e) => teclas[e.code] = true);
window.addEventListener("keyup", (e) => teclas[e.code] = false);

// NARUTO (JOGADOR - Agora com velocidade ajustada e proporção de personagem)
const jogador = {
    x: 50, y: 300, largura: 28, altura: 42,
    velX: 0, velY: 0, velocidade: 3.5, forcaPulo: -11.5,
    noChao: false, direcao: 1
};

// SHURIKENS
let shurikens = [];
let podeAtirar = true;

// DADOS DAS FASES
const fases = [
    {   // FASE 1 - Aldeia da Folha
        corTopo: "#4facfe", corFundoBase: "#00f2fe",
        plataformas: [
            { x: 0, y: 380, largura: 800, altura: 20 },
            { x: 200, y: 300, largura: 110, altura: 20 },
            { x: 400, y: 220, largura: 110, altura: 20 }
        ],
        inimigos: [
            { x: 400, y: 338, largura: 28, altura: 42, vel: 1.5, dir: 1, minX: 280, maxX: 520, tipo: "renegado" }
        ],
        porta: { x: 710, y: 320, largura: 40, altura: 60 }
    },
    {   // FASE 2 - Floresta da Morte
        corTopo: "#1e272e", corFundoBase: "#485460",
        plataformas: [
            { x: 0, y: 380, largura: 280, altura: 20 },
            { x: 380, y: 380, largura: 420, altura: 20 },
            { x: 150, y: 280, largura: 90, altura: 20 },
            { x: 340, y: 210, largura: 90, altura: 20 },
            { x: 530, y: 150, largura: 100, altura: 20 }
        ],
        inimigos: [
            { x: 450, y: 338, largura: 28, altura: 42, vel: 2, dir: -1, minX: 390, maxX: 740, tipo: "akatsuki" },
            { x: 540, y: 108, largura: 28, altura: 42, vel: 1, dir: 1, minX: 530, maxX: 600, tipo: "renegado" }
        ],
        porta: { x: 740, y: 320, largura: 40, altura: 60 }
    },
    {   // FASE 3 - Vale do Fim
        corTopo: "#2c0703", corFundoBase: "#801313",
        plataformas: [
            { x: 0, y: 380, largura: 180, altura: 20 },
            { x: 250, y: 310, largura: 100, altura: 20 },
            { x: 430, y: 240, largura: 100, altura: 20 },
            { x: 600, y: 170, largura: 200, altura: 20 }
        ],
        inimigos: [
            { x: 260, y: 268, largura: 28, altura: 42, vel: 1.2, dir: 1, minX: 250, maxX: 320, tipo: "akatsuki" },
            { x: 630, y: 128, largura: 28, altura: 42, vel: 2.2, dir: -1, minX: 600, maxX: 730, tipo: "akatsuki" }
        ],
        porta: { x: 740, y: 110, largura: 40, altura: 60 }
    }
];

let plataformasAtuais = [];
let inimigosAtuais = [];
let portaAtual = {};
let faseAtiva = null;

function carregarFase(index) {
    if (index >= fases.length) {
        vitoria = true;
        mensagemEl.style.color = "#2ecc71";
        mensagemEl.innerText = "Tornaste-te um Hokage! Venceste o jogo!";
        restartBtn.style.display = "block";
        return;
    }
    faseAtiva = fases[index];
    plataformasAtuais = JSON.parse(JSON.stringify(faseAtiva.plataformas));
    inimigosAtuais = JSON.parse(JSON.stringify(faseAtiva.inimigos));
    portaAtual = Object.assign({}, faseAtiva.porta);
    
    jogador.x = 40;
    jogador.y = 300;
    jogador.velY = 0;
    shurikens = [];
}

window.addEventListener("keydown", (e) => {
    if (e.code === "KeyF" && podeAtirar && !gameOver && !vitoria) {
        shurikens.push({
            x: jogador.x + 14,
            y: jogador.y + 20,
            velX: 8.5 * jogador.direcao,
            tamanho: 14
        });
        podeAtirar = false;
        setTimeout(() => podeAtirar = true, 450);
    }
});

function atualizar() {
    if (gameOver || vitoria) return;

    anguloShuriken += 0.35;

    // Movimento do Naruto
    if (teclas["ArrowLeft"] || teclas["KeyA"]) { 
        jogador.velX = -jogador.velocidade; 
        jogador.direcao = -1;
        frameAnimacao += 0.25;
    } else if (teclas["ArrowRight"] || teclas["KeyD"]) { 
        jogador.velX = jogador.velocidade; 
        jogador.direcao = 1;
        frameAnimacao += 0.25;
    } else { 
        jogador.velX = 0; 
        frameAnimacao = 0; // Fica parado em posição normal
    }

    if ((teclas["Space"] || teclas["ArrowUp"] || teclas["KeyW"]) && jogador.noChao) {
        jogador.velY = jogador.forcaPulo;
        jogador.noChao = false;
    }

    jogador.velY += gravidade;
    jogador.x += jogador.velX;
    jogador.y += jogador.velY;

    if (jogador.x < 0) jogador.x = 0;
    if (jogador.x + jogador.largura > canvas.width) jogador.x = canvas.width - jogador.largura;
    if (jogador.y > canvas.height) perderVida();

    // Colisão com Plataformas
    jogador.noChao = false;
    plataformasAtuais.forEach(plat => {
        if (jogador.x < plat.x + plat.largura && jogador.x + jogador.largura > plat.x &&
            jogador.y + jogador.altura >= plat.y && jogador.y + jogador.altura <= plat.y + jogador.velY + 4) {
            jogador.noChao = true;
            jogador.y = plat.y - jogador.altura;
            jogador.velY = 0;
        }
    });

    // Passar de Fase (Portal/Pergaminho)
    if (jogador.x < portaAtual.x + portaAtual.largura && jogador.x + jogador.largura > portaAtual.x &&
        jogador.y < portaAtual.y + portaAtual.altura && jogador.y + jogador.altura > portaAtual.y) {
        faseAtual++;
        carregarFase(faseAtual);
    }

    // Shurikens
    for (let i = shurikens.length - 1; i >= 0; i--) {
        let sh = shurikens[i];
        sh.x += sh.velX;
        
        if (sh.x < 0 || sh.x > canvas.width) {
            shurikens.splice(i, 1);
            continue;
        }

        for (let j = inimigosAtuais.length - 1; j >= 0; j--) {
            let inimigo = inimigosAtuais[j];
            if (sh.x < inimigo.x + inimigo.largura && sh.x + sh.tamanho > inimigo.x &&
                sh.y < inimigo.y + inimigo.altura && sh.y + sh.tamanho > inimigo.y) {
                inimigosAtuais.splice(j, 1);
                shurikens.splice(i, 1);
                pontos += 50;
                break;
            }
        }
    }

    // Inimigos
    inimigosAtuais.forEach(inimigo => {
        inimigo.x += inimigo.vel * inimigo.dir;
        if (inimigo.x <= inimigo.minX || inimigo.x + inimigo.largura >= inimigo.maxX) inimigo.dir *= -1;
        
        if (jogador.x + 4 < inimigo.x + inimigo.largura - 4 && jogador.x + jogador.largura - 4 > inimigo.x + 4 &&
            jogador.y + 4 < inimigo.y + inimigo.altura && jogador.y + jogador.altura > inimigo.y + 4) {
            perderVida();
        }
    });
}

function perderVida() {
    vidas--;
    if (vidas <= 0) {
        gameOver = true;
        mensagemEl.style.color = "#e74c3c";
        mensagemEl.innerText = "A Missão Falhou!";
        restartBtn.style.display = "block";
    } else {
        jogador.x = 40;
        jogador.y = 300;
        jogador.velY = 0;
    }
}

function reiniciarJogo() {
    vidas = 3;
    pontos = 0;
    faseAtual = 0;
    gameOver = false;
    vitoria = false;
    mensagemEl.innerText = "";
    restartBtn.style.display = "none";
    carregarFase(faseAtual);
    loop();
}

// FUNÇÃO PARA DESENHAR O NARUTO EM PIXEL ART COM BRAÇOS E PERNAS
function desenharNaruto(x, y, dir, anim) {
    ctx.save();
    // Espelha o personagem se estiver virado para a esquerda
    if (dir === -1) {
        ctx.translate(x + 28, y);
        ctx.scale(-1, 1);
        x = 0;
        y = 0;
    }

    let passo = Math.sin(anim) * 4; // Calcula o balanço das pernas e braços
    if (!jogador.noChao) passo = 4; // Pose de salto

    // 1. PERNAS E SANDÁLIAS NINJA (Laranja e Azul escuro)
    ctx.fillStyle = "#e67e22"; // Calça laranja
    ctx.fillRect(x + 6 - passo, y + 30, 6, 9);  // Perna esquerda
    ctx.fillRect(x + 16 + passo, y + 30, 6, 9); // Perna direita
    
    ctx.fillStyle = "#2c3e50"; // Sandálias ninja
    ctx.fillRect(x + 6 - passo, y + 39, 7, 3);
    ctx.fillRect(x + 16 + passo, y + 39, 7, 3);

    // 2. BRAÇO DE TRÁS
    ctx.fillStyle = "#d35400";
    ctx.fillRect(x + 10 + passo, y + 19, 6, 10);

    // 3. TRONCO / CASACO (Laranja com ombros pretos)
    ctx.fillStyle = "#e67e22"; // Laranja principal
    ctx.fillRect(x + 6, y + 17, 16, 13);
    ctx.fillStyle = "#222"; // Parte preta nos ombros e zíper
    ctx.fillRect(x + 6, y + 17, 16, 4);
    ctx.fillRect(x + 16, y + 17, 2, 13);

    // 4. BRAÇO DA FRENTE E MÃO
    ctx.fillStyle = "#f39c12"; // Manga laranja
    ctx.fillRect(x + 10 - passo, y + 19, 6, 8);
    ctx.fillStyle = "#ffcc99"; // Mão cor de pele
    ctx.fillRect(x + 10 - passo, y + 27, 5, 4);

    // 5. CABEÇA E ROSTO
    ctx.fillStyle = "#ffcc99"; // Pele
    ctx.fillRect(x + 6, y + 5, 16, 12);
    // Olho azul e marquinhas na bochecha
    ctx.fillStyle = "#2980b9";
    ctx.fillRect(x + 17, y + 10, 3, 3);
    ctx.fillStyle = "#b37700";
    ctx.fillRect(x + 13, y + 13, 3, 1);
    ctx.fillRect(x + 13, y + 15, 3, 1);

    // 6. BANDANA DA ALDEIA DA FOLHA
    ctx.fillStyle = "#1f618d"; // Tecido azul
    ctx.fillRect(x + 5, y + 5, 18, 4);
    ctx.fillStyle = "#bdc3c7"; // Placa de metal
    ctx.fillRect(x + 12, y + 5, 10, 4);
    // Pontas da bandana voando atrás
    ctx.fillStyle = "#1f618d";
    ctx.fillRect(x + 1, y + 6, 4, 3);
    ctx.fillRect(x - 1, y + 8, 3, 3);

    // 7. CABELO LOIRO ESPETADO
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(x + 5, y + 1, 18, 4);
    ctx.fillRect(x + 3, y + 3, 4, 3);
    ctx.fillRect(x + 8, y - 2, 4, 3);
    ctx.fillRect(x + 14, y - 2, 4, 3);
    ctx.fillRect(x + 19, y + 1, 4, 3);

    ctx.restore();
}

// FUNÇÃO PARA DESENHAR INIMIGOS NINJA
function desenharInimigo(inimigo) {
    let x = inimigo.x;
    let y = inimigo.y;
    let passo = Math.sin(Date.now() * 0.01) * 3;
    let corManto = inimigo.tipo === "akatsuki" ? "#111" : "#4a235a";

    // Pernas
    ctx.fillStyle = "#222";
    ctx.fillRect(x + 6 - passo, y + 30, 6, 12);
    ctx.fillRect(x + 16 + passo, y + 30, 6, 12);

    // Corpo / Manto Ninja
    ctx.fillStyle = corManto;
    ctx.fillRect(x + 5, y + 16, 18, 16);

    // Nuvem vermelha se for Akatsuki
    if (inimigo.tipo === "akatsuki") {
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x + 10, y + 21, 7, 4);
    }

    // Braços
    ctx.fillStyle = corManto;
    ctx.fillRect(x + 2, y + 18 + passo, 4, 10);
    ctx.fillRect(x + 22, y + 18 - passo, 4, 10);

    // Cabeça e Máscara Ninja
    ctx.fillStyle = "#ffcc99";
    ctx.fillRect(x + 7, y + 5, 14, 11);
    ctx.fillStyle = "#222"; // Máscara tapando a boca
    ctx.fillRect(x + 7, y + 11, 14, 5);

    // Olhos vermelhos ameaçadores
    ctx.fillStyle = "#ff0000";
    let olhoOffset = inimigo.dir === 1 ? 14 : 8;
    ctx.fillRect(x + olhoOffset, y + 8, 3, 2);
    ctx.fillRect(x + olhoOffset + 4, y + 8, 3, 2);

    // Bandana preta
    ctx.fillStyle = "#000";
    ctx.fillRect(x + 6, y + 4, 16, 3);
}

// FUNÇÃO PARA DESENHAR SHURIKEN DE 4 PONTAS
function desenharShuriken(sh) {
    ctx.save();
    ctx.translate(sh.x, sh.y);
    ctx.rotate(anguloShuriken);
    
    ctx.fillStyle = "#bdc3c7"; // Metal
    // Lâmina horizontal
    ctx.fillRect(-sh.tamanho/2, -2, sh.tamanho, 4);
    // Lâmina vertical
    ctx.fillRect(-2, -sh.tamanho/2, 4, sh.tamanho);
    
    // Centro escuro (furo da shuriken)
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(-2, -2, 4, 4);
    
    ctx.restore();
}

function desenhar() {
    // Céu em Degradê
    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradiente.addColorStop(0, faseAtiva.corTopo);
    gradiente.addColorStop(1, faseAtiva.corFundoBase);
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Portal de Saída (Torii / Portal Dourado)
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(portaAtual.x, portaAtual.y, portaAtual.largura, portaAtual.altura);
    ctx.fillStyle = "#e67e22";
    ctx.fillRect(portaAtual.x + 5, portaAtual.y + 5, portaAtual.largura - 10, portaAtual.altura - 5);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(portaAtual.x, portaAtual.y, portaAtual.largura, portaAtual.altura);

    // Plataformas (Relva e Terra)
    plataformasAtuais.forEach(p => {
        ctx.fillStyle = "#6e473b";
        ctx.fillRect(p.x, p.y + 7, p.largura, p.altura - 7);
        ctx.fillStyle = "#27ae60";
        ctx.fillRect(p.x, p.y, p.largura, 7);
        ctx.strokeStyle = "#1e272e";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.largura, p.altura);
    });

    // Desenhar Inimigos
    inimigosAtuais.forEach(i => desenharInimigo(i));

    // Desenhar Shurikens
    shurikens.forEach(sh => desenharShuriken(sh));

    // Desenhar Naruto
    desenharNaruto(jogador.x, jogador.y, jogador.direcao, frameAnimacao);

    // Placar
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(10, 10, 140, 85);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Arial";
    ctx.fillText("Pontos: " + pontos, 20, 32);
    ctx.fillText("Vidas: " + vidas, 20, 56);
    ctx.fillText("Fase: " + (faseAtual + 1) + " / " + fases.length, 20, 80);
}

function loop() {
    if (!gameOver && !vitoria) {
        atualizar();
        desenhar();
        requestAnimationFrame(loop);
    }
}

carregarFase(0);
loop();
