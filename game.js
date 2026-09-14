var DICE_COLORS_LIST = ["normal", "red", "blue", "yellow"];
var diceSoundAudio = new Audio("sound/dices.wav");

var GAME_MODES = [
    { id: "solo", label: "Solo Classic", humans: 1, cpus: 0, type: "race", target: 50 },
    { id: "vscpu", label: "Vs CPU", humans: 1, cpus: 1, type: "race", target: 30 },
    { id: "duel", label: "2 Player Duel", humans: 2, cpus: 0, type: "race", target: 30 },
    { id: "ffa4", label: "4 Player Free-for-All", humans: 4, cpus: 0, type: "race", target: 40 },
    { id: "tourney", label: "CPU Tournament (1v3)", humans: 1, cpus: 3, type: "race", target: 40 },
    { id: "sudden", label: "Sudden Death Showdown", humans: 1, cpus: 3, type: "sudden" },
    { id: "survival", label: "Survival (3 Lives)", humans: 1, cpus: 0, type: "survival", target: 60, lives: 3 },
    { id: "highlow", label: "High-Low Streak", humans: 1, cpus: 0, type: "highlow" },
    { id: "vscpu3", label: "Vs CPU (3 Dice)", humans: 1, cpus: 1, type: "race", target: 45, diceCount: 3 },
    { id: "vscpu4", label: "Vs CPU (4 Dice)", humans: 1, cpus: 1, type: "race", target: 60, diceCount: 4 }
];

var DiceGame = {
    mode: null,
    players: [],
    turnIndex: 0,
    phase: "idle",
    roundRolls: [],
    currentFaces: [0, 0],
    rollFaces: [0, 0],
    finalFaces: [0, 0],
    rolling: false,
    rollStartAt: 0,
    rollDuration: 700,
    lastRollChangeAt: 0,
    scale: 1,
    jitter: 0,
    cpuTimer: 0,
    flashStartAt: 0,
    turnAdvancePending: false,
    turnAdvanceAt: 0,
    pendingGuessDir: 1,
    highlowTarget: 1,
    resultTitle: "",
    resultSubtitle: "",
    primaryBtn: null,
    higherBtn: null,
    lowerBtn: null,
    menuBtn: null,

    init: function(gameArea, mode) {
        this.mode = mode;
        this.buildPlayers();
        this.turnIndex = 0;
        this.phase = "playing";
        this.roundRolls = [];
        var diceCount = this.getDiceCount();
        this.currentFaces = new Array(diceCount);
        this.rollFaces = new Array(diceCount);
        this.finalFaces = new Array(diceCount);
        for (var i = 0; i < diceCount; i++) {
            this.currentFaces[i] = 0;
            this.rollFaces[i] = 0;
            this.finalFaces[i] = 0;
        }
        this.rolling = false;
        this.scale = 1;
        this.jitter = 0;
        this.cpuTimer = 0;
        this.flashStartAt = 0;
        this.turnAdvancePending = false;
        this.turnAdvanceAt = 0;
        this.resultTitle = "";
        this.resultSubtitle = "";
        this.buildButtons(gameArea);

        if (mode.type === "highlow") {
            this.highlowTarget = 1 + Math.floor(Math.random() * 6);
        }
    },

    buildPlayers: function() {
        var colors = DICE_COLORS_LIST;
        var idx = 0;
        this.players = [];

        for (var h = 0; h < this.mode.humans; h++) {
            this.players.push({
                name: this.mode.humans > 1 ? ("Player " + (h + 1)) : "You",
                isCPU: false,
                color: colors[idx % colors.length],
                score: 0,
                lives: this.mode.lives || 0,
                alive: true
            });
            idx++;
        }

        for (var c = 0; c < this.mode.cpus; c++) {
            this.players.push({
                name: "CPU " + (c + 1),
                isCPU: true,
                color: colors[idx % colors.length],
                score: 0,
                lives: this.mode.lives || 0,
                alive: true
            });
            idx++;
        }
    },

    buildButtons: function(gameArea) {
        var cx = gameArea.canvas.width / 2;
        var btnW = 260, btnH = 80;
        var bottomY = gameArea.canvas.height - 220;

        this.primaryBtn = new component(btnW, btnH, "#2e8b2e", cx - btnW / 2, bottomY, "button", "Roll");
        this.primaryBtn.skipClickSound = true;
        this.higherBtn = new component(btnW, btnH, "#2e8b2e", cx - btnW - 20, bottomY, "button", "Higher");
        this.higherBtn.skipClickSound = true;
        this.lowerBtn = new component(btnW, btnH, "#8b2e2e", cx + 20, bottomY, "button", "Lower");
        this.lowerBtn.skipClickSound = true;
        this.menuBtn = new component(220, 70, "#c0392b", cx - 110, bottomY + btnH + 26, "button", "Select Mode");
    },

    currentPlayer: function() {
        return this.players[this.turnIndex];
    },

    getDiceCount: function() {
        if (this.mode && this.mode.type === "highlow") return 1;
        return (this.mode && this.mode.diceCount) || 2;
    },

    randomFaces: function(n) {
        var arr = [];
        for (var i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 6));
        return arr;
    },

    getButtons: function() {
        if (this.phase === "gameover") {
            this.primaryBtn.text = "Retry";
            return [this.primaryBtn, this.menuBtn];
        }
        if (this.mode && this.mode.type === "highlow") {
            return [this.higherBtn, this.lowerBtn, this.menuBtn];
        }
        var cur = this.currentPlayer();
        if (cur && cur.isCPU) {
            return [this.menuBtn];
        }
        this.primaryBtn.text = "Roll";
        return [this.primaryBtn, this.menuBtn];
    },

    handleClick: function(pos, gameArea) {
        if (this.phase === "gameover") {
            if (this.primaryBtn.isClicked(pos.x, pos.y)) {
                this.init(gameArea, this.mode);
                return;
            }
            if (this.menuBtn.isClicked(pos.x, pos.y)) {
                gameArea.openModes();
                return;
            }
            return;
        }

        if (this.mode.type === "highlow") {
            if (this.higherBtn.isClicked(pos.x, pos.y)) {
                this.highlowRoll(1);
                return;
            }
            if (this.lowerBtn.isClicked(pos.x, pos.y)) {
                this.highlowRoll(-1);
                return;
            }
            if (this.menuBtn.isClicked(pos.x, pos.y)) {
                gameArea.openModes();
                return;
            }
            return;
        }

        if (this.primaryBtn.isClicked(pos.x, pos.y)) {
            var cur = this.currentPlayer();
            if (cur && !cur.isCPU) this.startRoll();
            return;
        }

        if (this.menuBtn.isClicked(pos.x, pos.y)) {
            gameArea.openModes();
        }
    },

    playDiceSound: function() {
        if (typeof soundEnabled !== "undefined" && !soundEnabled) return;
        try {
            diceSoundAudio.currentTime = 0;
            diceSoundAudio.play();
        } catch (e) {}
    },

    startRoll: function() {
        if (this.rolling || this.phase !== "playing" || this.turnAdvancePending) return;
        this.rolling = true;
        this.rollStartAt = performance.now();
        this.lastRollChangeAt = this.rollStartAt;
        this.finalFaces = this.randomFaces(this.getDiceCount());
        this.playDiceSound();
    },

    highlowRoll: function(direction) {
        if (this.rolling || this.phase !== "playing") return;
        this.rolling = true;
        this.pendingGuessDir = direction;
        this.rollStartAt = performance.now();
        this.lastRollChangeAt = this.rollStartAt;
        this.finalFaces = this.randomFaces(1);
        this.playDiceSound();
    },

    resolveHighlow: function() {
        var newVal = this.currentFaces[0] + 1;
        var correct = this.pendingGuessDir === 1 ? newVal > this.highlowTarget : newVal < this.highlowTarget;
        if (correct) {
            this.players[0].score += 1;
            this.highlowTarget = newVal;
        } else {
            this.endGame(this.players[0], true);
        }
    },

    resolveRoll: function(sum) {
        var mode = this.mode;
        var cur = this.currentPlayer();

        if (mode.type === "race") {
            cur.score += sum;
            if (cur.score >= mode.target) {
                this.endGame(cur, false);
            } else {
                this.turnAdvancePending = true;
                this.turnAdvanceAt = performance.now() + 1000;
            }
        } else if (mode.type === "survival") {
            cur.score += sum;
            if (sum === 2) {
                cur.lives -= 1;
                if (cur.lives <= 0) {
                    this.endGame(cur, true);
                    return;
                }
            }
            if (cur.score >= mode.target) {
                this.endGame(cur, false);
            }
        } else if (mode.type === "sudden") {
            this.roundRolls.push({ player: cur, sum: sum });
            var aliveCount = this.players.filter(function(p) { return p.alive; }).length;
            if (this.roundRolls.length >= aliveCount) {
                this.resolveSuddenRound();
            } else {
                this.turnAdvancePending = true;
                this.turnAdvanceAt = performance.now() + 1000;
            }
        }
    },

    resolveSuddenRound: function() {
        var minSum = Math.min.apply(null, this.roundRolls.map(function(r) { return r.sum; }));
        this.roundRolls.forEach(function(r) {
            if (r.sum === minSum) r.player.alive = false;
        });
        this.roundRolls = [];

        var stillAlive = this.players.filter(function(p) { return p.alive; });
        if (stillAlive.length <= 1) {
            this.endGame(stillAlive[0] || null, false);
            return;
        }

        do {
            this.turnIndex = (this.turnIndex + 1) % this.players.length;
        } while (!this.players[this.turnIndex].alive);
    },

    advanceTurn: function() {
        if (this.mode.type === "sudden") {
            do {
                this.turnIndex = (this.turnIndex + 1) % this.players.length;
            } while (!this.players[this.turnIndex].alive);
        } else {
            this.turnIndex = (this.turnIndex + 1) % this.players.length;
        }
    },

    endGame: function(player, isLoss) {
        this.phase = "gameover";
        var mode = this.mode;

        if (mode.type === "survival") {
            this.resultTitle = isLoss ? "GAME OVER" : "YOU WIN!";
            this.resultSubtitle = "Final Score: " + player.score;
            return;
        }

        if (mode.type === "highlow") {
            this.resultTitle = "GAME OVER";
            this.resultSubtitle = "Streak: " + player.score;
            return;
        }

        if (!player) {
            this.resultTitle = "GAME OVER";
            this.resultSubtitle = "Everyone was eliminated!";
            return;
        }

        var humanCount = this.players.filter(function(p) { return !p.isCPU; }).length;

        if (player.isCPU) {
            this.resultTitle = "GAME OVER";
            this.resultSubtitle = player.name + " wins with " + player.score + " points";
        } else if (humanCount > 1) {
            this.resultTitle = player.name + " WINS!";
            this.resultSubtitle = "Final Score: " + player.score;
        } else {
            this.resultTitle = "YOU WIN!";
            this.resultSubtitle = "Final Score: " + player.score;
        }
    },

    updateCpuAndRolling: function(gameArea) {
        var now = performance.now();

        if (this.turnAdvancePending && now >= this.turnAdvanceAt) {
            this.turnAdvancePending = false;
            this.advanceTurn();
        }

        if (this.phase === "playing" && !this.rolling && !this.turnAdvancePending && this.mode.type !== "highlow") {
            var cur = this.currentPlayer();
            if (cur && cur.isCPU) {
                this.cpuTimer += gameArea.dt;
                if (this.cpuTimer > 0.8) {
                    this.cpuTimer = 0;
                    this.startRoll();
                }
            } else {
                this.cpuTimer = 0;
            }
        }

        this.jitter = 0;

        if (this.rolling) {
            if (now - this.lastRollChangeAt > 70) {
                this.rollFaces = this.randomFaces(this.getDiceCount());
                this.lastRollChangeAt = now;
            }
            this.jitter = (Math.random() - 0.5) * 0.35;

            if (now - this.rollStartAt > this.rollDuration) {
                this.rolling = false;
                this.currentFaces = this.finalFaces;
                this.scale = 1.3;

                if (this.mode.type === "highlow") {
                    this.resolveHighlow();
                } else {
                    var sum = 0;
                    for (var f = 0; f < this.currentFaces.length; f++) sum += this.currentFaces[f] + 1;
                    this.resolveRoll(sum);
                }
            }
        }

        var ease = 1 - Math.pow(0.001, gameArea.dt);
        this.scale += (1 - this.scale) * ease;
    },

    drawDice: function(ctx, cx, cy) {
        var facesToShow = this.rolling ? this.rollFaces : this.currentFaces;
        var cur = this.currentPlayer();
        var color = cur ? cur.color : "normal";
        var diceCount = this.getDiceCount();
        var size = diceCount > 2 ? 170 : 220;
        var gap = diceCount > 2 ? 40 : 60;
        var totalWidth = diceCount * size + (diceCount - 1) * gap;
        var startX = cx - totalWidth / 2 + size / 2;
        var centers = [];
        for (var c = 0; c < diceCount; c++) centers.push(startX + c * (size + gap));

        var flashHold = 1000;
        var flashFade = 400;
        var elapsed = performance.now() - this.flashStartAt;
        var flash = 0;
        if (!this.rolling) {
            if (elapsed < flashHold) {
                flash = 1;
            } else if (elapsed < flashHold + flashFade) {
                flash = 1 - (elapsed - flashHold) / flashFade;
            }
        }

        for (var i = 0; i < diceCount; i++) {
            var face = facesToShow[i];
            if (!diceImagesReady[color] || !diceImagesReady[color][face]) continue;

            ctx.save();
            ctx.translate(centers[i], cy);
            ctx.rotate(this.jitter);
            ctx.scale(this.scale, this.scale);
            if (flash > 0) {
                ctx.shadowColor = "rgba(255,255,255,0.95)";
                ctx.shadowBlur = 18 + 24 * flash;
            } else {
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                ctx.shadowBlur = 18;
            }
            ctx.drawImage(diceImages[color][face], -size / 2, -size / 2, size, size);
            ctx.restore();
        }
    },

    drawScoreboard: function(ctx, cx) {
        var y = 250;
        var cur = this.currentPlayer();

        for (var i = 0; i < this.players.length; i++) {
            var p = this.players[i];
            var prefix = (p === cur && this.phase === "playing") ? "> " : "";
            var status = "";
            if (this.mode.type === "survival") status = "  Lives: " + p.lives;
            if (this.mode.type === "sudden" && !p.alive) status = "  OUT";
            drawSettingsText(ctx, prefix + p.name + ": " + p.score + status, cx, y, 36);
            y += 46;
        }
    },

    drawGameOverOverlay: function(ctx, gameArea, cx, cy) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, cy - 220, gameArea.canvas.width, 320);
        ctx.restore();

        drawTitleStyleText(ctx, this.resultTitle, cx, cy - 120, 76, gameArea.time);
        drawSettingsText(ctx, this.resultSubtitle, cx, cy - 40, 40);
    },

    drawTableBackground: function(ctx, gameArea) {
        var w = gameArea.canvas.width, h = gameArea.canvas.height;
        var grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.08, w / 2, h / 2, w * 0.75);
        grad.addColorStop(0, "#1f7a3d");
        grad.addColorStop(0.7, "#155c2c");
        grad.addColorStop(1, "#0a2f16");

        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    },

    draw: function(gameArea) {
        var ctx = gameArea.context;
        var cx = gameArea.canvas.width / 2;
        var cy = gameArea.canvas.height / 2 - 40;

        this.drawTableBackground(ctx, gameArea);

        drawTitleStyleText(ctx, this.mode.label.toUpperCase(), cx, 150, 62, gameArea.time);

        this.updateCpuAndRolling(gameArea);

        if (this.mode.type === "highlow") {
            drawSettingsText(ctx, "Beat this number: " + this.highlowTarget, cx, 250, 44);
            drawSettingsText(ctx, "Streak: " + this.players[0].score, cx, 300, 36);
        } else {
            this.drawScoreboard(ctx, cx);
        }

        this.drawDice(ctx, cx, cy);

        if (this.phase === "gameover") {
            this.drawGameOverOverlay(ctx, gameArea, cx, cy);
        } else if (this.mode.type !== "highlow") {
            var cur = this.currentPlayer();
            if (cur) {
                drawSettingsText(ctx, cur.name + (cur.isCPU ? " (CPU)" : "") + "'s turn", cx, cy - 180, 40);
            }
        }

        var buttons = this.getButtons();
        buttons.forEach(function(b) { b.update(); });
    }
};