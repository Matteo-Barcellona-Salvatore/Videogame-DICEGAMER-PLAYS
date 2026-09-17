function shadeColor(hex, percent) {
    var f = parseInt(hex.slice(1), 16),
        t = percent < 0 ? 0 : 255,
        p = Math.abs(percent) / 100,
        R = f >> 16, G = (f >> 8) & 0x00FF, B = f & 0x0000FF;
    return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)).toString(16).slice(1);
}

function drawTitleStyleText(ctx, text, x, y, fontSize, time) {
    ctx.save();
    ctx.translate(x, y);

    var breathe = 1 + Math.sin(time / 750) * 0.02;
    ctx.scale(breathe, breathe);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + fontSize + "px Consolas";

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillText(text, 6, 10);

    ctx.fillStyle = shadeColor("#0c3d24", -10);
    for (var i = 3; i > 0; i--) {
        ctx.fillText(text, i * 1.6, i * 1.6);
    }

    var glow = 14 + Math.sin(time / 330) * 8;
    ctx.shadowColor = "rgba(255, 210, 90, 0.65)";
    ctx.shadowBlur = glow;

    var hue = 45 + Math.sin(time / 1000) * 15;
    var grad = ctx.createLinearGradient(0, -40, 0, 40);
    grad.addColorStop(0, "hsl(" + hue + ", 95%, 78%)");
    grad.addColorStop(0.5, "hsl(" + (hue - 10) + ", 90%, 58%)");
    grad.addColorStop(1, "hsl(" + (hue - 20) + ", 85%, 40%)");
    ctx.fillStyle = grad;
    ctx.fillText(text, 0, 0);

    ctx.shadowBlur = 0;
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(10, 25, 15, 0.9)";
    ctx.strokeText(text, 0, 0);

    ctx.save();
    ctx.beginPath();
    ctx.rect(-800, -60, 1600, 34);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(text, 0, -6);
    ctx.restore();

    ctx.restore();
}

function drawSettingsText(ctx, text, x, y, fontSize) {
    ctx.save();
    ctx.translate(x, y);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold " + fontSize + "px Consolas";

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(10, 25, 15, 0.85)";
    ctx.strokeText(text, 0, 0);

    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, 0, 0);

    ctx.restore();
}

var soundEnabled = true;
var btnSoundAudio = new Audio("sound/buttons.wav");

function playButtonSound() {
    if (!soundEnabled) return;
    try {
        btnSoundAudio.currentTime = 0;
        btnSoundAudio.play();
    } catch (e) {}
}

function component(width, height, color, x, y, type, text) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.text = text;
    this.hover = false;
    this.scale = 1;

    this.update = function() {
        var ctx = myGameArea.context;
        if (this.type == "text") {
            drawTitleStyleText(ctx, this.text, this.x, this.y, parseInt(this.width, 10), myGameArea.time);
        } else {
            var target = this.hover ? 1.08 : 1;
            var ease = 1 - Math.pow(0.001, myGameArea.dt);
            this.scale += (target - this.scale) * ease;

            ctx.save();
            var cx = this.x + this.width / 2;
            var cy = this.y + this.height / 2;
            ctx.translate(cx, cy);
            ctx.scale(this.scale, this.scale);
            ctx.translate(-cx, -cy);

            var r = 16;
            var x = this.x, y = this.y, w = this.width, h = this.height;

            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
            ctx.closePath();

            var grad = ctx.createLinearGradient(x, y, x, y + h);
            grad.addColorStop(0, shadeColor(this.color, this.hover ? 30 : 10));
            grad.addColorStop(1, shadeColor(this.color, this.hover ? 0 : -18));
            ctx.fillStyle = grad;

            ctx.shadowColor = this.hover ? this.color : "rgba(0,0,0,0.4)";
            ctx.shadowBlur = this.hover ? 20 : 6;
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = this.hover ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)";
            ctx.shadowBlur = 0;
            ctx.stroke();

            ctx.fillStyle = "white";
            ctx.font = "32px Consolas";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
            ctx.restore();
        }
    };

    this.isClicked = function(mx, my) {
        return mx >= this.x && mx <= this.x + this.width &&
               my >= this.y && my <= this.y + this.height;
    };
}

function particle(canvasW, canvasH) {
    this.reset = function() {
        this.x = Math.random() * canvasW;
        this.y = canvasH + Math.random() * 100;
        this.r = 1.5 + Math.random() * 3;
        this.speed = (0.3 + Math.random() * 1.2) * 60;
        this.drift = (Math.random() - 0.5) * 0.6 * 60;
        this.alpha = 0.15 + Math.random() * 0.4;
    };
    this.reset();
    this.y = Math.random() * canvasH;

    this.update = function(ctx, dt) {
        this.y -= this.speed * dt;
        this.x += this.drift * dt;
        if (this.y < -10) this.reset();

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = "#9be8b0";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };
}

var DICE_SETS = {
    normal: ["img/dice.png", "img/dice2.png", "img/dice3.png", "img/dice4.png", "img/dice5.png", "img/dice6.png"],
    red: ["img/dicer.png", "img/dicer2.png", "img/dicer3.png", "img/dicer4.png", "img/dicer5.png", "img/dicer6.png"],
    blue: ["img/diceb.png", "img/diceb2.png", "img/diceb3.png", "img/diceb4.png", "img/diceb5.png", "img/diceb6.png"],
    yellow: ["img/dicey.png", "img/dicey2.png", "img/dicey3.png", "img/dicey4.png", "img/dicey5.png", "img/dicey6.png"]
};
var diceImages = {};
var diceImagesReady = {};

function loadDiceImages(onAllSettled) {
    var setNames = Object.keys(DICE_SETS);
    var total = 0;
    setNames.forEach(function(name) { total += DICE_SETS[name].length; });
    var remaining = total;

    setNames.forEach(function(name) {
        diceImages[name] = [];
        diceImagesReady[name] = [];
        DICE_SETS[name].forEach(function(src, idx) {
            var img = new Image();
            diceImagesReady[name][idx] = false;
            img.onload = function() {
                diceImagesReady[name][idx] = true;
                remaining--;
                if (remaining === 0 && onAllSettled) onAllSettled();
            };
            img.onerror = function() {
                diceImagesReady[name][idx] = false;
                remaining--;
                if (remaining === 0 && onAllSettled) onAllSettled();
            };
            img.src = src;
            diceImages[name][idx] = img;
        });
    });
}

function crossingDice(canvasW, canvasH) {
    this.size = 0;
    this.spin = 0;
    this.spinSpeed = 0;
    this.face = 0;
    this.flash = 0;
    this.nextChangeAt = 0;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;

    this.spawn = function(canvasW, canvasH) {
        var margin = 80;
        var edge = Math.floor(Math.random() * 4);
        var speed = (1.2 + Math.random() * 2.2) * 60;

        if (edge === 0) {
            this.x = Math.random() * canvasW;
            this.y = -margin;
            this.vx = (Math.random() - 0.5) * 1.4 * 60;
            this.vy = speed;
        } else if (edge === 1) {
            this.x = Math.random() * canvasW;
            this.y = canvasH + margin;
            this.vx = (Math.random() - 0.5) * 1.4 * 60;
            this.vy = -speed;
        } else if (edge === 2) {
            this.x = -margin;
            this.y = Math.random() * canvasH;
            this.vx = speed;
            this.vy = (Math.random() - 0.5) * 1.4 * 60;
        } else {
            this.x = canvasW + margin;
            this.y = Math.random() * canvasH;
            this.vx = -speed;
            this.vy = (Math.random() - 0.5) * 1.4 * 60;
        }

        this.size = 50 + Math.random() * 35;
        this.spin = Math.random() * Math.PI * 2;
        this.spinSpeed = (Math.random() - 0.5) * 3.6;
        this.face = Math.floor(Math.random() * 6);
        this.flash = 0;
        this.nextChangeAt = performance.now() + 3000 + Math.random() * 2000;
    };

    this.spawn(canvasW, canvasH);
    var headStart = Math.random() * 6;
    this.x += this.vx * headStart;
    this.y += this.vy * headStart;

    this.update = function(ctx, canvasW, canvasH, dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.spin += this.spinSpeed * dt;

        var margin = 100;
        if (this.x < -margin || this.x > canvasW + margin || this.y < -margin || this.y > canvasH + margin) {
            this.spawn(canvasW, canvasH);
        }

        var now = performance.now();
        if (now >= this.nextChangeAt) {
            var newFace;
            do { newFace = Math.floor(Math.random() * 6); } while (newFace === this.face);
            this.face = newFace;
            this.flash = 1;
            this.nextChangeAt = now + 3000 + Math.random() * 2000;
        }
        if (this.flash > 0) this.flash -= dt * 2.4;

        if (!diceImagesReady.normal || !diceImagesReady.normal[this.face]) return;
        var img = diceImages.normal[this.face];

        var s = this.size;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spin);

        if (this.flash > 0) {
            ctx.shadowColor = "rgba(255,255,255,0.9)";
            ctx.shadowBlur = 20 * this.flash;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.drawImage(img, -s / 2, -s / 2, s, s);
        ctx.restore();
    };
}

var myGameArea = {
    canvas: document.createElement("canvas"),
    animationFrame: null,
    running: false,
    screen: "menu",
    time: 0,
    dt: 0,
    lastFrameAt: 0,
    particles: [],
    dice: [],
    modeButtons: [],
    modesBackBtn: null,

    transition: 0,
    transitionDuration: 0.18,
    showExitConfirm: false,
    modalScale: 0,

    triggerTransition: function() {
        this.transition = 1;
    },

    start: function() {
        this.canvas.width = 1600;
        this.canvas.height = 1300;

        this.context = this.canvas.getContext("2d", { alpha: false });
        document.body.appendChild(this.canvas);

        var self = this;
        function resizeCanvas() {
            var scale = Math.min(
                window.innerWidth / self.canvas.width,
                window.innerHeight / self.canvas.height,
                1
            );
            self.canvas.style.width = (self.canvas.width * scale) + "px";
            self.canvas.style.height = (self.canvas.height * scale) + "px";
        }
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        for (var i = 0; i < 35; i++) {
            this.particles.push(new particle(this.canvas.width, this.canvas.height));
        }

        var cx = this.canvas.width / 2;
        var cy = this.canvas.height / 2;

        var btnW = 260, btnH = 80, gap = 26;
        var btnCount = 4;
        var totalBtnHeight = (btnH * btnCount) + (gap * (btnCount - 1));
        var btnX = cx - btnW / 2;
        var btnStartY = cy - totalBtnHeight / 2 + 60;

        var titleY = btnStartY - 160;
        this.title = new component("110px", "Consolas", "white", cx, titleY, "text", "DICEGAMER-PLAYS");

        this.playBtn = new component(btnW, btnH, "#2e8b2e", btnX, btnStartY, "button", "Play");
        this.settingsBtn = new component(btnW, btnH, "#c9a227", btnX, btnStartY + (btnH + gap), "button", "How to Play");
        this.optionsBtn = new component(btnW, btnH, "#3a6ea5", btnX, btnStartY + (btnH + gap) * 2, "button", "Settings");
        this.exitBtn = new component(btnW, btnH, "#c0392b", btnX, btnStartY + (btnH + gap) * 3, "button", "Exit");

        this.settingsTitleY = titleY;
        this.settingsLines = [
            "Each turn, press ROLL to throw two dice",
            "Your score goes up by the total of both dice",
            "RACE MODES: be first to reach the target score",
            "(Solo, Vs CPU, Duel, Free-for-All, Tournament)",
            "SUDDEN DEATH: everyone rolls once per round",
            "The lowest roll each round is eliminated",
            "Last player standing wins the game",
            "SURVIVAL: rolling a 2 costs you one life",
            "Reach the target score before you lose all lives",
            "HIGH-LOW: guess if the next roll is higher or lower",
            "Correct guesses build your streak, one miss ends it",
            "Press MENU anytime to return to the main menu"
        ];

        var settingsLinesBottom = this.settingsTitleY + 140 + this.settingsLines.length * 58;
        this.backBtn = new component(220, 70, "#c0392b", cx - 110, settingsLinesBottom + 20, "button", "Back");

        var optionsBtnW = 420, optionsBtnH = 80, optionsGap = 26;
        var optionsStartY = titleY + 160;
        this.fullscreenBtn = new component(optionsBtnW, optionsBtnH, "#6a4a9c", cx - optionsBtnW / 2, optionsStartY, "button", "Fullscreen");
        this.soundBtn = new component(optionsBtnW, optionsBtnH, "#3a6ea5", cx - optionsBtnW / 2, optionsStartY + (optionsBtnH + optionsGap), "button", "Sound: ON");
        this.optionsBackBtn = new component(220, 70, "#c0392b", cx - 110, optionsStartY + (optionsBtnH + optionsGap) * 2 + 20, "button", "Back");

        var modalBtnW = 260, modalBtnH = 100, modalGap = 80;
        var modalBtnY = cy + 110;
        this.yesExitBtn = new component(modalBtnW, modalBtnH, "#2e8b2e", cx - modalBtnW - modalGap / 2, modalBtnY, "button", "Yes");
        this.noExitBtn = new component(modalBtnW, modalBtnH, "#c0392b", cx + modalGap / 2, modalBtnY, "button", "No");

        var DICE_COUNT = 12;
        for (var d = 0; d < DICE_COUNT; d++) {
            this.dice.push(new crossingDice(this.canvas.width, this.canvas.height));
        }
        loadDiceImages();

        this.creditsText = "Project by Matteo Barcellona 2026-2027";
        this.creditsX = cx;
        this.creditsY = this.canvas.height - 50;

        this.canvas.style.cursor = "default";

        this.canvas.addEventListener("mousemove", function(e) {
            var pos = self.getMousePos(e);
            var overAny = false;
            var buttons = self.getActiveButtons();

            buttons.forEach(function(btn) {
                var isOver = btn.isClicked(pos.x, pos.y);
                btn.hover = isOver;
                if (isOver) overAny = true;
            });

            self.canvas.style.cursor = overAny ? "pointer" : "default";
        });

        this.canvas.addEventListener("click", function(e) {
            var pos = self.getMousePos(e);

            var activeButtons = self.getActiveButtons();
            for (var bi = 0; bi < activeButtons.length; bi++) {
                if (activeButtons[bi].skipClickSound) continue;
                if (activeButtons[bi].isClicked(pos.x, pos.y)) {
                    playButtonSound();
                    break;
                }
            }

            if (self.showExitConfirm) {
                if (self.yesExitBtn.isClicked(pos.x, pos.y)) {
                    self.closeExitConfirm();
                    self.exit();
                } else if (self.noExitBtn.isClicked(pos.x, pos.y)) {
                    self.closeExitConfirm();
                }
                return;
            }

            if (self.screen === "menu") {
                if (self.playBtn.isClicked(pos.x, pos.y)) self.openModes();
                if (self.exitBtn.isClicked(pos.x, pos.y)) self.openExitConfirm();
                if (self.settingsBtn.isClicked(pos.x, pos.y)) self.openSettings();
                if (self.optionsBtn.isClicked(pos.x, pos.y)) self.openOptions();
            } else if (self.screen === "modes") {
                for (var i = 0; i < self.modeButtons.length; i++) {
                    if (self.modeButtons[i].btn.isClicked(pos.x, pos.y)) {
                        self.startMode(self.modeButtons[i].mode);
                        return;
                    }
                }
                if (self.modesBackBtn && self.modesBackBtn.isClicked(pos.x, pos.y)) {
                    self.screen = "menu";
                    self.triggerTransition();
                }
            } else if (self.screen === "settings") {
                if (self.backBtn.isClicked(pos.x, pos.y)) self.closeSettings();
            } else if (self.screen === "options") {
                if (self.fullscreenBtn.isClicked(pos.x, pos.y)) self.toggleFullscreen();
                if (self.soundBtn.isClicked(pos.x, pos.y)) self.toggleSound();
                if (self.optionsBackBtn.isClicked(pos.x, pos.y)) self.closeOptions();
            } else if (self.screen === "game") {
                if (typeof DiceGame !== "undefined" && DiceGame.handleClick) {
                    DiceGame.handleClick(pos, self);
                }
            }
        });

        this.renderLoop();
    },

    getActiveButtons: function() {
        if (this.showExitConfirm) return [this.yesExitBtn, this.noExitBtn];
        if (this.screen === "settings") return [this.backBtn];
        if (this.screen === "options") return [this.fullscreenBtn, this.soundBtn, this.optionsBackBtn];
        if (this.screen === "modes") {
            var arr = this.modeButtons.map(function(x) { return x.btn; });
            if (this.modesBackBtn) arr.push(this.modesBackBtn);
            return arr;
        }
        if (this.screen === "game") {
            if (typeof DiceGame !== "undefined" && DiceGame.getButtons) return DiceGame.getButtons();
            return [];
        }
        return [this.playBtn, this.settingsBtn, this.optionsBtn, this.exitBtn];
    },

    getMousePos: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var scaleX = this.canvas.width / rect.width;
        var scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    clear: function() {
        var ctx = this.context;
        var grad = ctx.createLinearGradient(0, 0, 0, this.canvas.height);

        if (this.screen === "settings") {
            var shift = Math.sin(this.time / 3300) * 15;
            grad.addColorStop(0, shadeColor("#6e5c1b", shift / 10));
            grad.addColorStop(1, "#3a300e");
        } else if (this.screen === "options") {
            var shiftOptions = Math.sin(this.time / 3300) * 15;
            grad.addColorStop(0, shadeColor("#1b3a6e", shiftOptions / 10));
            grad.addColorStop(1, "#0e1c3a");
        } else if (this.screen === "modes") {
            var shiftModes = Math.sin(this.time / 3300) * 15;
            grad.addColorStop(0, shadeColor("#1b6e2f", shiftModes / 10));
            grad.addColorStop(1, "#0e3a17");
        } else if (this.screen === "game") {
            var shiftGame = Math.sin(this.time / 3300) * 15;
            grad.addColorStop(0, shadeColor("#155c2c", shiftGame / 10));
            grad.addColorStop(1, "#0a2f16");
        } else {
            var shiftMenu = Math.sin(this.time / 3300) * 20;
            grad.addColorStop(0, shadeColor("#1b3a2f", shiftMenu / 10));
            grad.addColorStop(1, "#0e211a");
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (var i = 0; i < this.particles.length; i++) {
            this.particles[i].update(ctx, this.dt);
        }
    },

    drawDice: function() {
        var ctx = this.context;
        for (var i = 0; i < this.dice.length; i++) {
            this.dice[i].update(ctx, this.canvas.width, this.canvas.height, this.dt);
        }
    },

    drawMenu: function() {
        this.drawDice();
        this.title.update();
        this.playBtn.update();
        this.settingsBtn.update();
        this.optionsBtn.update();
        this.exitBtn.update();

        var ctx = this.context;
        ctx.save();
        ctx.globalAlpha = 0.6;
        drawSettingsText(ctx, this.creditsText, this.creditsX, this.creditsY, 26);
        ctx.restore();
    },

    drawSettings: function() {
        var ctx = this.context;


        var lineGap = 58;
        var titleToFirstLine = 140;
        var blockHeight = titleToFirstLine + (this.settingsLines.length - 1) * lineGap;
        var titleY = this.canvas.height / 2 - blockHeight / 2;

        drawSettingsText(ctx, "HOW TO PLAY", this.canvas.width / 2, titleY, 90);

        var lineY = titleY + titleToFirstLine;
        for (var i = 0; i < this.settingsLines.length; i++) {
            drawSettingsText(ctx, this.settingsLines[i], this.canvas.width / 2, lineY, 36);
            lineY += lineGap;
        }

        this.backBtn.x = this.canvas.width / 2 - this.backBtn.width / 2;
        this.backBtn.y = lineY + 20;
        this.backBtn.update();
    },

    drawOptions: function() {
        var ctx = this.context;
        drawSettingsText(ctx, "SETTINGS", this.canvas.width / 2, this.settingsTitleY, 90);

        this.fullscreenBtn.update();
        this.soundBtn.update();
        this.optionsBackBtn.update();
    },

    buildModeButtons: function() {
        var cx = this.canvas.width / 2;
        var top = 260;
        var btnW = 900, btnH = 76, gap = 10;
        var palette = ["#2e8b6a", "#2e6a8b", "#6a2e8b", "#8b6a2e", "#8b2e4a", "#2e8b3f", "#4a2e8b", "#8b4a2e"];

        this.modeButtons = [];

        if (typeof GAME_MODES !== "undefined") {
            for (var i = 0; i < GAME_MODES.length; i++) {
                var mode = GAME_MODES[i];
                var y = top + i * (btnH + gap);
                var btn = new component(btnW, btnH, palette[i % palette.length], cx - btnW / 2, y, "button", mode.label);
                this.modeButtons.push({ btn: btn, mode: mode });
            }
        }

        var backY = top + this.modeButtons.length * (btnH + gap) + 10;
        this.modesBackBtn = new component(220, 70, "#c0392b", cx - 110, backY, "button", "Back");
    },

    drawModes: function() {
        var ctx = this.context;
        drawSettingsText(ctx, "SELECT MODE", this.canvas.width / 2, 150, 80);
        drawSettingsText(ctx, "Choose a mode and play", this.canvas.width / 2, 205, 32);

        for (var i = 0; i < this.modeButtons.length; i++) {
            this.modeButtons[i].btn.update();
        }

        if (this.modesBackBtn) this.modesBackBtn.update();
    },

    drawUI: function() {
        if (this.screen === "menu") {
            this.drawMenu();
        } else if (this.screen === "settings") {
            this.drawSettings();
        } else if (this.screen === "options") {
            this.drawOptions();
        } else if (this.screen === "modes") {
            this.drawModes();
        } else if (this.screen === "game") {
            if (typeof DiceGame !== "undefined" && DiceGame.draw) {
                DiceGame.draw(this);
            }
        }
    },

    drawExitConfirm: function() {
        var ctx = this.context;
        var ease = 1 - Math.pow(0.0001, this.dt);
        this.modalScale += (1 - this.modalScale) * ease;

        var cx = this.canvas.width / 2;
        var cy = this.canvas.height / 2;

        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.modalScale, this.modalScale);
        ctx.translate(-cx, -cy);

        var boxW = 900, boxH = 480;
        var r = 20;
        var x = cx - boxW / 2, y = cy - boxH / 2;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + boxW, y, x + boxW, y + boxH, r);
        ctx.arcTo(x + boxW, y + boxH, x, y + boxH, r);
        ctx.arcTo(x, y + boxH, x, y, r);
        ctx.arcTo(x, y, x + boxW, y, r);
        ctx.closePath();

        var grad = ctx.createLinearGradient(x, y, x, y + boxH);
        grad.addColorStop(0, "#20262c");
        grad.addColorStop(1, "#12161a");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 30;
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.shadowBlur = 0;
        ctx.stroke();

        drawSettingsText(ctx, "Do you want to exit the game?", cx, y + 130, 54);

        this.yesExitBtn.update();
        this.noExitBtn.update();

        ctx.restore();
    },

    drawTransition: function() {
        if (this.transition <= 0) return;
        var ctx = this.context;
        ctx.save();
        ctx.globalAlpha = this.transition;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.restore();

        this.transition -= this.dt / this.transitionDuration;
        if (this.transition < 0) this.transition = 0;
    },

    renderLoop: function() {
        var self = this;
        function frame(now) {
            if (!self.lastFrameAt) self.lastFrameAt = now;
            self.dt = Math.min((now - self.lastFrameAt) / 1000, 0.05);
            self.lastFrameAt = now;
            self.time += self.dt * 1000;

            self.clear();
            self.drawUI();
            if (self.showExitConfirm) self.drawExitConfirm();
            self.drawTransition();
            if (self.running) {
                updateGameArea();
            }
            self.animationFrame = requestAnimationFrame(frame);
        }
        this.animationFrame = requestAnimationFrame(frame);
    },

    openModes: function() {
        this.buildModeButtons();
        this.screen = "modes";
        this.triggerTransition();
    },

    startMode: function(mode) {
        this.triggerTransition();
        this.screen = "game";
        this.running = true;
        if (typeof DiceGame !== "undefined" && DiceGame.init) {
            DiceGame.init(this, mode);
        }
    },

    exit: function() {
        this.running = false;
        try {
            window.open("", "_self");
            window.close();
        } catch (e) {}
    },

    openExitConfirm: function() {
        this.showExitConfirm = true;
        this.modalScale = 0;
    },

    closeExitConfirm: function() {
        this.showExitConfirm = false;
    },

    openSettings: function() {
        this.screen = "settings";
        this.triggerTransition();
    },

    closeSettings: function() {
        this.screen = "menu";
        this.triggerTransition();
    },

    openOptions: function() {
        this.screen = "options";
        this.triggerTransition();
    },

    closeOptions: function() {
        this.screen = "menu";
        this.triggerTransition();
    },

    toggleSound: function() {
        soundEnabled = !soundEnabled;
        this.soundBtn.text = soundEnabled ? "Sound: ON" : "Sound: OFF";
        this.soundBtn.color = soundEnabled ? "#3a6ea5" : "#5a5a5a";
    },

    toggleFullscreen: function() {
        if (!document.fullscreenElement) {
            if (this.canvas.requestFullscreen) this.canvas.requestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    }
};

function updateGameArea() {
}

myGameArea.start();
