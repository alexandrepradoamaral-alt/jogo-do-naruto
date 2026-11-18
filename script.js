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
const gravidade = 0.6;
let anguloShuriken = 0; 

// TECLADO
const teclas = {};
window.addEventListener("keydown", (e) => teclas[e.code] = true);
window.addEventListener("keyup", (e) => teclas[e.code] = false);

// NARUTO (JOGADOR)
const jogador = {
    x: 50, y: 300, largura: 30, altura: 30,
    velX: 0, velY: 0, velocidade: 5, forcaPulo: -12,
    noChao: false, cor: "#e67e22", 
    direcao: 1 
};

// SHURIKENS
let shurikens = [];
let podeAtirar = true;

// DADOS DAS FASES (Cenários e Inimigos)
const fases = [
    {   // FASE 1 - A Aldeia da Folha
        corTopo: "#4facfe", corFundoBase: "#00f2fe", 
        plataformas: [
            { x: 0, y: 380, largura: 800, altura: 20 },
            { x: 200, y: 300, largura: 100, altura: 20 },
            { x: 400, y: 220, largura: 100, altura: 20 }
        ],
        inimigos: [
            { x: 400, y: 350, largura: 30, altura: 30, vel: 2, dir: 1, minX: 300, maxX: 500, cor: "#c0392b" }
        ],
        porta: { x: 700, y: 330, largura: 40, altura: 50 } 
    },
    {   // FASE 2 - A Floresta da Morte
        corTopo: "#2c3e50", corFundoBase: "#000000", 
        plataformas: [
            { x: 0, y: 380, largura: 300, altura: 20 },
            { x: 400, y: 380, largura: 400, altura: 20 },
            { x: 150, y: 280, largura: 80, altura: 20 },
            { x: 350, y: 200, largura: 80, altura: 20 },
            { x: 550, y: 150, largura: 80, altura: 20 }
        ],
        inimigos: [
            { x: 450, y: 350, largura: 30, altura: 30, vel: 3, dir: -1, minX: 400, maxX: 750, cor: "#8e44ad" },
            { x: 550, y: 120, largura: 30, altura: 30, vel: 1.5, dir: 1, minX: 500, maxX: 600, cor: "#8e44ad" }
        ],
        porta: { x: 750, y: 100, largura: 40, altura: 50 }
    }
];

let plataformasAtuais = [];
let inimigosAtuais = [];
let portaAtual = {};
let faseAtiva = null;

function carregarFase(index) {
    if (index >= fases.length) {
        vitoria = true;
        mensagemEl.innerText = "Tornaste-te um Hokage! Venceste!";
        restartBtn.style.display = "block";
        return;
    }
    faseAtiva = fases[index];
    plataformasAtuais = JSON.parse(JSON.stringify(faseAtiva.plataformas));
    inimigosAtuais = JSON.parse(JSON.stringify(faseAtiva.inimigos));
    portaAtual = Object.assign({}, faseAtiva.porta);
    
    jogador.x = 50;
    jogador.y = 300;
    jogador.velY = 0;
    shurikens = [];
}

window.addEventListener("keydown", (e) => {
    if (e.code === "KeyF" && podeAtirar && !gameOver && !vitoria) {
        shurikens.push({
            x: jogador.x + 15,
            y: jogador.y + 15,
            velX: 10 * jogador.direcao,
            tamanho: 12
        });
        podeAtirar = false;
        setTimeout(() => podeAtirar = true, 400);
    }
});

function atualizar() {
    if (gameOver || vitoria) return;

    anguloShuriken += 0.3; 

    // Movimento do Naruto
    if (teclas["ArrowLeft"] || teclas["KeyA"]) { 
        jogador.velX = -jogador.velocidade; 
        jogador.direcao = -1;
    } else if (teclas["ArrowRight"] || teclas["KeyD"]) { 
        jogador.velX = jogador.velocidade; 
        jogador.direcao = 1;
    } else { 
        jogador.velX = 0; 
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

    jogador.noChao = false;
    plataformasAtuais.forEach(plat => {
        if (jogador.x < plat.x + plat.largura && jogador.x + jogador.largura > plat.x &&
            jogador.y + jogador.altura >= plat.y && jogador.y + jogador.altura <= plat.y + jogador.velY + 2) {
            jogador.noChao = true;
            jogador.y = plat.y - jogador.altura;
            jogador.velY = 0;
        }
    });

    if (jogador.x < portaAtual.x + portaAtual.largura && jogador.x + jogador.largura > portaAtual.x &&
        jogador.y < portaAtual.y + portaAtual.altura && jogador.y + jogador.altura > portaAtual.y) {
        faseAtual++;
        carregarFase(faseAtual);
    }

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

    inimigosAtuais.forEach(inimigo => {
        inimigo.x += inimigo.vel * inimigo.dir;
        if (inimigo.x <= inimigo.minX || inimigo.x + inimigo.largura >= inimigo.maxX) inimigo.dir *= -1;
        
        if (jogador.x < inimigo.x + inimigo.largura && jogador.x + jogador.largura > inimigo.x &&
            jogador.y < inimigo.y + inimigo.altura && jogador.y + jogador.altura > inimigo.y) {
            perderVida();
        }
    });
}

function perderVida() {
    vidas--;
    if (vidas <= 0) {
        gameOver = true;
        mensagemEl.innerText = "A Missão Falhou!";
        restartBtn.style.display = "block";
    } else {
        jogador.x = 50;
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

function desenhar() {
    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradiente.addColorStop(0, faseAtiva.corTopo);
    gradiente.addColorStop(1, faseAtiva.corFundoBase);
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f1c40f"; 
    ctx.fillRect(portaAtual.x, portaAtual.y, portaAtual.largura, portaAtual.altura);
    ctx.strokeStyle = "#f39c12";
    ctx.lineWidth = 4;
    ctx.strokeRect(portaAtual.x, portaAtual.y, portaAtual.largura, portaAtual.altura);

    plataformasAtuais.forEach(p => {
        ctx.fillStyle = "#8d6e63";
        ctx.fillRect(p.x, p.y + 8, p.largura, p.altura - 8);
        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(p.x, p.y, p.largura, 8);
        ctx.strokeStyle = "#2c3e50";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.largura, p.altura);
    });

    inimigosAtuais.forEach(i => {
        ctx.fillStyle = i.cor;
        ctx.fillRect(i.x, i.y, i.largura, i.altura);
        ctx.fillStyle = "#000";
        let olhoX = i.dir === 1 ? i.x + 15 : i.x + 5;
        ctx.fillRect(olhoX, i.y + 5, 10, 5);
        ctx.strokeStyle = "#000";
        ctx.strokeRect(i.x, i.y, i.largura, i.altura);
    });

    shurikens.forEach(sh => {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(anguloShuriken);
        ctx.fillStyle = "#ecf0f1"; 
        ctx.fillRect(-sh.tamanho/2, -sh.tamanho/2, sh.tamanho, sh.tamanho);
        ctx.fillStyle = "#95a5a6"; 
        ctx.fillRect(-sh.tamanho/4, -sh.tamanho/4, sh.tamanho/2, sh.tamanho/2);
        ctx.restore();
    });

    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
    
    ctx.fillStyle = "#2980b9";
    ctx.fillRect(jogador.x, jogador.y + 4, jogador.largura, 8);
    
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(jogador.x + 10, jogador.y + 5, 10, 6);
    
    ctx.fillStyle = "#fff";
    let olhoX = jogador.direcao === 1 ? jogador.x + 18 : jogador.x + 8;
    ctx.fillRect(olhoX, jogador.y + 16, 4, 4);
    
    ctx.strokeStyle = "#d35400";
    ctx.lineWidth = 2;
    ctx.strokeRect(jogador.x, jogador.y, jogador.largura, jogador.altura);

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(5, 5, 150, 100);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Pontos: " + pontos, 15, 30);
    ctx.fillText("Vidas: " + vidas, 15, 60);
    ctx.fillText("Fase: " + (faseAtual + 1), 15, 90);
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
