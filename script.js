const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mensagemEl = document.getElementById("message");
const restartBtn = document.getElementById("restartBtn");

// CONTROLE DE 60 FPS (Mantém a velocidade normal em qualquer monitor)
let ultimoTempo = 0;
const fpsIntervalo = 1000 / 60;

// VARIÁVEIS DO JOGO
let pontos = 0;
let vidas = 3;
let chakra = 100;
let faseAtual = 0;
let gameOver = false;
let vitoria = false;
const gravidade = 0.55;
let anguloShuriken = 0;
let frameAnimacao = 0;

let nuvens = [
    { x: 100, y: 50, vel: 0.3 },
    { x: 400, y: 80, vel: 0.2 },
    { x: 700, y: 40, vel: 0.4 }
];

// CONTROLES
const teclas = {};
window.addEventListener("keydown", function(e) {
    teclas[e.code] = true;

    if (gameOver || vitoria) return;

    // TECLA F: SHURIKEN
    if (e.code === "KeyF" && podeAtirar) {
        shurikens.push({
            x: jogador.x + 14,
            y: jogador.y + 20,
            velX: 8 * jogador.direcao,
            tamanho: 14
        });
        podeAtirar = false;
        setTimeout(function() { podeAtirar = true; }, 400);
    }

    // TECLA R: RASENGAN
    if (e.code === "KeyR" && chakra >= 50) {
        chakra -= 50;
        rasengans.push({
            x: jogador.x + (jogador.direcao === 1 ? 30 : -20),
            y: jogador.y + 15,
            velX: 6 * jogador.direcao,
            raio: 18,
            vida: 60
        });
    }
});

window.addEventListener("keyup", function(e) {
    teclas[e.code] = false;
});

// JOGADOR (NARUTO)
const jogador = {
    x: 50,
    y: 300,
    largura: 28,
    altura: 42,
    velX: 0,
    velY: 0,
    velocidade: 2.6,
    forcaPulo: -11.5,
    noChao: false,
    direcao: 1,
    invulneravel: false
};

let shurikens = [];
let rasengans = [];
let particulas = [];
let podeAtirar = true;

// FASES DO JOGO
const fases = [
    {
        nome: "Aldeia da Folha",
        corTopo: "#2980b9",
        corFundoBase: "#6dd5fa",
        corMontanha: "#5dade2",
        plataformas: [
            { x: 0, y: 380, largura: 800, altura: 20 },
            { x: 200, y: 300, largura: 110, altura: 20 },
            { x: 380, y: 220, largura: 110, altura: 20 },
            { x: 560, y: 290, largura: 90, altura: 20 }
        ],
        inimigos: [
            { x: 400, y: 338, largura: 28, altura: 42, vel: 1.4, dir: 1, minX: 280, maxX: 550, tipo: "renegado", hp: 1, maxHp: 1 }
        ],
        porta: { x: 720, y: 310, largura: 50, altura: 70 }
    },
    {
        nome: "Floresta da Morte",
        corTopo: "#0f2027",
        corFundoBase: "#2c5364",
        corMontanha: "#1c313a",
        plataformas: [
            { x: 0, y: 380, largura: 260, altura: 20 },
            { x: 350, y: 380, largura: 450, altura: 20 },
            { x: 140, y: 280, largura: 90, altura: 20 },
            { x: 305, y: 210, largura: 90, altura: 20 },
            { x: 475, y: 150, largura: 100, altura: 20 }
        ],
        inimigos: [
            { x: 450, y: 338, largura: 28, altura: 42, vel: 1.8, dir: -1, minX: 360, maxX: 700, tipo: "akatsuki", hp: 2, maxHp: 2 },
            { x: 485, y: 108, largura: 28, altura: 42, vel: 1.0, dir: 1, minX: 475, maxX: 545, tipo: "renegado", hp: 1, maxHp: 1 }
        ],
        porta: { x: 730, y: 310, largura: 50, altura: 70 }
    },
    {
        nome: "Vale do Fim - CHEFE",
        corTopo: "#1a0000",
        corFundoBase: "#660000",
        corMontanha: "#330000",
        plataformas: [
            { x: 0, y: 380, largura: 800, altura: 20 },
            { x: 150, y: 280, largura: 120, altura: 20 },
            { x: 530, y: 280, largura: 120, altura: 20 },
            { x: 340, y: 200, largura: 120, altura: 20 }
        ],
        inimigos: [
            { x: 400, y: 338, largura: 28, altura: 42, vel: 2.2, dir: -1, minX: 250, maxX: 730, tipo: "chefe", hp: 5, maxHp: 5 },
            { x: 160, y: 238, largura: 28, altura: 42, vel: 1.1, dir: 1, minX: 150, maxX: 240, tipo: "akatsuki", hp: 2, maxHp: 2 }
        ],
        porta: { x: 730, y: 310, largura: 50, altura: 70 }
    }
];

let plataformasAtuais = [];
let inimigosAtuais = [];
let portaAtual = {};
let faseAtiva = fases[0];

function carregarFase(index) {
    if (index >= fases.length) {
        vitoria = true;
        mensagemEl.style.color = "#2ecc71";
        mensagemEl.innerText = "Parabéns! Derrotaste a Akatsuki e tornaste-te Hokage!";
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
    rasengans = [];
    particulas = [];
}

function criarFumo(x, y, cor) {
    for (let i = 0; i < 15; i++) {
        particulas.push({
            x: x + 14,
            y: y + 20,
            velX: (Math.random() - 0.5) * 6,
            velY: (Math.random() - 0.5) * 6,
            raio: Math.random() * 8 + 4,
            vida: 25,
            cor: cor
        });
    }
}

function atualizar() {
    if (gameOver || vitoria) return;

    anguloShuriken += 0.3;
    if (chakra < 100) chakra += 0.15;

    nuvens.forEach(function(n) {
        n.x -= n.vel;
        if (n.x < -100) n.x = canvas.width + 50;
    });

    if (teclas["ArrowLeft"] || teclas["KeyA"]) {
        jogador.velX = -jogador.velocidade;
        jogador.direcao = -1;
        frameAnimacao += 0.18;
    } else if (teclas["ArrowRight"] || teclas["KeyD"]) {
        jogador.velX = jogador.velocidade;
        jogador.direcao = 1;
        frameAnimacao += 0.18;
    } else {
        jogador.velX = 0;
        frameAnimacao = 0;
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
    plataformasAtuais.forEach(function(plat) {
        if (jogador.x < plat.x + plat.largura &&
            jogador.x + jogador.largura > plat.x &&
            jogador.y + jogador.altura >= plat.y &&
            jogador.y + jogador.altura <= plat.y + jogador.velY + 4) {
            jogador.noChao = true;
            jogador.y = plat.y - jogador.altura;
            jogador.velY = 0;
        }
    });

    if (inimigosAtuais.length === 0) {
        if (jogador.x < portaAtual.x + portaAtual.largura &&
            jogador.x + jogador.largura > portaAtual.x &&
            jogador.y < portaAtual.y + portaAtual.altura &&
            jogador.y + jogador.altura > portaAtual.y) {
            faseAtual++;
            carregarFase(faseAtual);
        }
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
            if (sh.x < inimigo.x + inimigo.largura &&
                sh.x + sh.tamanho > inimigo.x &&
                sh.y < inimigo.y + inimigo.altura &&
                sh.y + sh.tamanho > inimigo.y) {
                inimigo.hp--;
                shurikens.splice(i, 1);
                criarFumo(inimigo.x, inimigo.y, "#fff");
                if (inimigo.hp <= 0) {
                    inimigosAtuais.splice(j, 1);
                    pontos += (inimigo.tipo === "chefe" ? 300 : 50);
                }
                break;
            }
        }
    }

    for (let i = rasengans.length - 1; i >= 0; i--) {
        let ras = rasengans[i];
        ras.x += ras.velX;
        ras.vida--;
        if (ras.vida <= 0 || ras.x < 0 || ras.x > canvas.width) {
            rasengans.splice(i, 1);
            continue;
        }

        for (let j = inimigosAtuais.length - 1; j >= 0; j--) {
            let inimigo = inimigosAtuais[j];
            if (ras.x - ras.raio < inimigo.x + inimigo.largura &&
                ras.x + ras.raio > inimigo.x &&
                ras.y - ras.raio < inimigo.y + inimigo.altura &&
                ras.y + ras.raio > inimigo.y) {
                inimigo.hp -= 3;
                rasengans.splice(i, 1);
                criarFumo(inimigo.x, inimigo.y, "#3498db");
                if (inimigo.hp <= 0) {
                    inimigosAtuais.splice(j, 1);
                    pontos += (inimigo.tipo === "chefe" ? 300 : 100);
                }
                break;
            }
        }
    }

    for (let i = particulas.length - 1; i >= 0; i--) {
        let p = particulas[i];
        p.x += p.velX;
        p.y += p.velY;
        p.vida--;
        if (p.vida <= 0) particulas.splice(i, 1);
    }

    inimigosAtuais.forEach(function(inimigo) {
        inimigo.x += inimigo.vel * inimigo.dir;
        if (inimigo.x <= inimigo.minX || inimigo.x + inimigo.largura >= inimigo.maxX) {
            inimigo.dir *= -1;
        }

        if (!jogador.invulneravel &&
            jogador.x + 5 < inimigo.x + inimigo.largura - 5 &&
            jogador.x + jogador.largura - 5 > inimigo.x + 5 &&
            jogador.y + 5 < inimigo.y + inimigo.altura &&
            jogador.y + jogador.altura > inimigo.y + 5) {
            perderVida();
        }
    });
}

function perderVida() {
    vidas--;
    criarFumo(jogador.x, jogador.y, "#e74c3c");
    if (vidas <= 0) {
        gameOver = true;
        mensagemEl.style.color = "#e74c3c";
        mensagemEl.innerText = "A Missão Falhou!";
        restartBtn.style.display = "block";
    } else {
        jogador.x = 40;
        jogador.y = 300;
        jogador.velY = 0;
        jogador.invulneravel = true;
        setTimeout(function() { jogador.invulneravel = false; }, 1500);
    }
}

function reiniciarJogo() {
    vidas = 3;
    pontos = 0;
    chakra = 100;
    faseAtual = 0;
    gameOver = false;
    vitoria = false;
    mensagemEl.innerText = "";
    restartBtn.style.display = "none";
    carregarFase(faseAtual);
    ultimoTempo = performance.now();
    requestAnimationFrame(loop);
}

function desenharCenario() {
    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradiente.addColorStop(0, faseAtiva.corTopo);
    gradiente.addColorStop(1, faseAtiva.corFundoBase);
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    nuvens.forEach(function(n) {
        ctx.fillRect(n.x, n.y, 70, 20);
        ctx.fillRect(n.x + 15, n.y - 10, 40, 15);
    });

    ctx.fillStyle = faseAtiva.corMontanha;
    ctx.beginPath();
    ctx.moveTo(0, 380);
    ctx.lineTo(150, 200);
    ctx.lineTo(350, 380);
    ctx.lineTo(500, 180);
    ctx.lineTo(750, 380);
    ctx.fill();
}

function desenharPortal() {
    let x = portaAtual.x;
    let y = portaAtual.y;
    let aberto = inimigosAtuais.length === 0;

    ctx.fillStyle = aberto ? "#e74c3c" : "#555";
    ctx.fillRect(x + 8, y + 10, 8, 60);
    ctx.fillRect(x + 34, y + 10, 8, 60);

    ctx.fillStyle = aberto ? "#c0392b" : "#333";
    ctx.fillRect(x, y + 5, 50, 8);
    ctx.fillRect(x + 4, y + 18, 42, 5);

    if (aberto) {
        ctx.fillStyle = "rgba(241, 196, 15, 0.4)";
        ctx.fillRect(x + 16, y + 23, 18, 47);
    }
}

function desenharNaruto(x, y, dir, anim) {
    if (jogador.invulneravel && Math.floor(Date.now() / 100) % 2 === 0) return;

    ctx.save();
    if (dir === -1) {
        ctx.translate(x + 28, y);
        ctx.scale(-1, 1);
        x = 0;
        y = 0;
    }

    let passo = Math.sin(anim) * 4;
    if (!jogador.noChao) passo = 4;

    ctx.fillStyle = "#e67e22";
    ctx.fillRect(x + 6 - passo, y + 30, 6, 9);
    ctx.fillRect(x + 16 + passo, y + 30, 6, 9);
    ctx.fillStyle = "#1a252f";
    ctx.fillRect(x + 6 - passo, y + 39, 7, 3);
    ctx.fillRect(x + 16 + passo, y + 39, 7, 3);

    ctx.fillStyle = "#d35400";
    ctx.fillRect(x + 10 + passo, y + 19, 6, 10);

    ctx.fillStyle = "#e67e22";
    ctx.fillRect(x + 6, y + 17, 16, 13);
    ctx.fillStyle = "#111";
    ctx.fillRect(x + 6, y + 17, 16, 4);
    ctx.fillRect(x + 16, y + 17, 2, 13);

    ctx.fillStyle = "#f39c12";
    ctx.fillRect(x + 10 - passo, y + 19, 6, 8);
    ctx.fillStyle = "#ffcc99";
    ctx.fillRect(x + 10 - passo, y + 27, 5, 4);

    ctx.fillStyle = "#ffcc99";
    ctx.fillRect(x + 6, y + 5, 16, 12);
    ctx.fillStyle = "#2980b9";
    ctx.fillRect(x + 17, y + 10, 3, 3);
    ctx.fillStyle = "#b37700";
    ctx.fillRect(x + 13, y + 13, 3, 1);
    ctx.fillRect(x + 13, y + 15, 3, 1);

    ctx.fillStyle = "#1f618d";
    ctx.fillRect(x + 5, y + 5, 18, 4);
    ctx.fillStyle = "#bdc3c7";
    ctx.fillRect(x + 12, y + 5, 10, 4);
    ctx.fillStyle = "#1f618d";
    ctx.fillRect(x + 1, y + 6, 4, 3);
    ctx.fillRect(x - 1, y + 8, 3, 3);

    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(x + 5, y + 1, 18, 4);
    ctx.fillRect(x + 3, y + 3, 4, 3);
    ctx.fillRect(x + 8, y - 2, 4, 3);
    ctx.fillRect(x + 14, y - 2, 4, 3);
    ctx.fillRect(x + 19, y + 1, 4, 3);

    ctx.restore();
}

function desenharInimigo(inimigo) {
    let x = inimigo.x;
    let y = inimigo.y;
    let passo = Math.sin(Date.now() * 0.008) * 3;
    let corManto = inimigo.tipo === "renegado" ? "#4a235a" : "#111";

    ctx.fillStyle = "#111";
    ctx.fillRect(x + 6 - passo, y + 30, 6, 12);
    ctx.fillRect(x + 16 + passo, y + 30, 6, 12);
    ctx.fillStyle = corManto;
    ctx.fillRect(x + 5, y + 16, 18, 16);

    if (inimigo.tipo !== "renegado") {
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x + 10, y + 21, 7, 4);
    }

    ctx.fillStyle = corManto;
    ctx.fillRect(x + 2, y + 18 + passo, 4, 10);
    ctx.fillRect(x + 22, y + 18 - passo, 4, 10);

    if (inimigo.tipo === "chefe") {
        ctx.fillStyle = "#e67e22";
        ctx.fillRect(x + 7, y + 5, 14, 11);
        ctx.fillStyle = "#ff0000";
        let olhoX = inimigo.dir === 1 ? x + 16 : x + 9;
        ctx.fillRect(olhoX, y + 8, 3, 3);
    } else {
        ctx.fillStyle = "#ffcc99";
        ctx.fillRect(x + 7, y + 5, 14, 11);
        ctx.fillStyle = "#222";
        ctx.fillRect(x + 7, y + 11, 14, 5);
        ctx.fillStyle = "#ff0000";
        let olhoOffset = inimigo.dir === 1 ? 14 : 8;
        ctx.fillRect(x + olhoOffset, y + 8, 3, 2);
        ctx.fillRect(x + olhoOffset + 4, y + 8, 3, 2);
    }

    if (inimigo.maxHp > 1) {
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y - 8, 28, 4);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(x, y - 8, (inimigo.hp / inimigo.maxHp) * 28, 4);
    }
}

function desenhar() {
    desenharCenario();
    desenharPortal();

    plataformasAtuais.forEach(function(p) {
        ctx.fillStyle = "#5d4037";
        ctx.fillRect(p.x, p.y + 7, p.largura, p.altura - 7);
        ctx.fillStyle = "#27ae60";
        ctx.fillRect(p.x, p.y, p.largura, 7);
        ctx.strokeStyle = "#1e272e";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.largura, p.altura);
    });

    inimigosAtuais.forEach(function(i) {
        desenharInimigo(i);
    });

    shurikens.forEach(function(sh) {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(anguloShuriken);
        ctx.fillStyle = "#bdc3c7";
        ctx.fillRect(-sh.tamanho / 2, -2, sh.tamanho, 4);
        ctx.fillRect(-2, -sh.tamanho / 2, 4, sh.tamanho);
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
    });

    rasengans.forEach(function(ras) {
        ctx.beginPath();
        ctx.arc(ras.x, ras.y, ras.raio, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(52, 152, 219, 0.7)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ras.x, ras.y, ras.raio * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
    });

    particulas.forEach(function(p) {
        ctx.fillStyle = p.cor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fill();
    });

    desenharNaruto(jogador.x, jogador.y, jogador.direcao, frameAnimacao);

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, 10, 210, 105);
    ctx.strokeStyle = "#e67e22";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 210, 105);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Arial";
    ctx.fillText("Fase: " + faseAtiva.nome, 20, 30);
    ctx.fillText("Pontos: " + pontos + "  |  Vidas: " + vidas, 20, 52);

    ctx.fillText("Chakra (Tecla R):", 20, 74);
    ctx.fillStyle = "#333";
    ctx.fillRect(20, 80, 180, 12);
    ctx.fillStyle = chakra >= 50 ? "#00f2fe" : "#2980b9";
    ctx.fillRect(20, 80, (chakra / 100) * 180, 12);

    if (inimigosAtuais.length > 0) {
        ctx.fillStyle = "#f1c40f";
        ctx.font = "bold 13px Arial";
        ctx.fillText("Derrote os inimigos para abrir o portal!", 520, 25);
    }
}

function loop(tempoAtual) {
    if (gameOver || vitoria) return;
    requestAnimationFrame(loop);

    if (!ultimoTempo) ultimoTempo = tempoAtual;
    const decorrido = tempoAtual - ultimoTempo;

    if (decorrido >= fpsIntervalo) {
        ultimoTempo = tempoAtual - (decorrido % fpsIntervalo);
        atualizar();
        desenhar();
    }
}

carregarFase(0);
requestAnimationFrame(loop);
// FIM DO CÓDIGO
