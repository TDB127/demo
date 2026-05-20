class SoundEffects {
    constructor() { this.enabled = true; this.ctx = null; }
    init() { if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } }
    playClick() {
        if (!this.enabled) return; this.init();
        let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination); osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }
    playPlacePiece(isX) {
        if (!this.enabled) return; this.init();
        let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination); osc.type = 'triangle';
        osc.frequency.setValueAtTime(isX ? 330 : 440, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.start(); osc.stop(this.ctx.currentTime + 0.12);
    }
    playWin() {
        if (!this.enabled) return; this.init();
        let now = this.ctx.currentTime; const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination); osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12); gain.gain.setValueAtTime(0, now + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.12 + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.4);
            osc.start(now + idx * 0.12); osc.stop(now + idx * 0.12 + 0.4);
        });
    }
    playLose() {
        if (!this.enabled) return; this.init();
        let now = this.ctx.currentTime; const notes = [392.00, 349.23, 311.13, 261.63];
        notes.forEach((freq, idx) => {
            let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination); osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.15); gain.gain.setValueAtTime(0, now + idx * 0.15);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.15 + 0.05); gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.5);
            osc.start(now + idx * 0.15); osc.stop(now + idx * 0.15 + 0.5);
        });
    }
    playDraw() {
        if (!this.enabled) return; this.init();
        let osc1 = this.ctx.createOscillator(), osc2 = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc1.connect(gain); osc2.connect(gain); gain.connect(this.ctx.destination); osc1.type = 'sine'; osc2.type = 'sine';
        osc1.frequency.setValueAtTime(300, this.ctx.currentTime); osc2.frequency.setValueAtTime(305, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
        osc1.start(); osc2.start(); osc1.stop(this.ctx.currentTime + 0.6); osc2.stop(this.ctx.currentTime + 0.6);
    }
}

const audio = new SoundEffects();

let BOARD_SIZE = 20;
let board = [];
let currentPlayer = 'X'; 
let isGameOver = false;
let gameMode = 'PvC'; 
let difficulty = 'medium'; 
let aiStarts = false; 
let moveHistory = []; 
let zoomLevel = 100; 
let scores = { X: 0, O: 0, draw: 0 };

const dom = {
    caroBoard: document.getElementById('caroBoard'),
    boardContainer: document.getElementById('boardContainer'),
    modePvC: document.getElementById('modePvC'),
    modePvP: document.getElementById('modePvP'),
    diffBtns: document.querySelectorAll('.diff-btn'),
    sizeBtns: document.querySelectorAll('[data-size]'),
    difficultySection: document.getElementById('difficultySection'),
    firstMoveSection: document.getElementById('firstMoveSection'),
    firstPlayer: document.getElementById('firstPlayer'),
    firstAI: document.getElementById('firstAI'),
    btnUndo: document.getElementById('btnUndo'),
    btnNewGame: document.getElementById('btnNewGame'),
    btnResetScore: document.getElementById('btnResetScore'),
    scoreX: document.getElementById('scoreX'),
    scoreO: document.getElementById('scoreO'),
    scoreDraw: document.getElementById('scoreDraw'),
    labelO: document.getElementById('labelO'),
    turnBadge: document.getElementById('turnBadge'),
    turnText: document.getElementById('turnText'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    zoomText: document.getElementById('zoomText'),
    helpModal: document.getElementById('helpModal'),
    btnHelp: document.getElementById('btnHelp'),
    btnCloseHelp: document.getElementById('btnCloseHelp'),
    btnGotIt: document.getElementById('btnGotIt'),
    resultModal: document.getElementById('resultModal'),
    resultTitle: document.getElementById('resultTitle'),
    resultText: document.getElementById('resultText'),
    resultIcon: document.getElementById('resultIcon'),
    btnPlayAgain: document.getElementById('btnPlayAgain'),
    btnSound: document.getElementById('btnSound'),
    soundIcon: document.getElementById('soundIcon'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg'),
    toastIcon: document.getElementById('toastIcon')
};

function showToast(message, type = 'success') {
    dom.toastMsg.innerText = message;
    dom.toastIcon.className = type === 'success' ? "fa-solid fa-circle-check text-green-500 text-lg" : "fa-solid fa-triangle-exclamation text-amber-500 text-lg";
    dom.toast.classList.remove('translate-y-20', 'opacity-0');
    dom.toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
        dom.toast.classList.remove('translate-y-0', 'opacity-100');
        dom.toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

function initBoardUI() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    dom.caroBoard.innerHTML = '';
    dom.caroBoard.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, minmax(0, 1fr))`;
    
    let cellSizeClass = "w-8 h-8 md:w-10 md:h-10"; 
    if (BOARD_SIZE === 20) {
        cellSizeClass = "w-7 h-7 md:w-9 md:h-9";
    } else if (BOARD_SIZE === 25) {
        cellSizeClass = "w-6 h-6 md:w-7.5 md:h-7.5 text-xs md:text-base";
    }
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = `${cellSizeClass} bg-gray-900 border border-gray-800 flex items-center justify-center font-bold cursor-pointer transition-all hover:bg-gray-800 select-none relative`;
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            cell.addEventListener('click', () => handleCellClick(r, c));
            dom.caroBoard.appendChild(cell);
        }
    }
}

function updateZoom() {
    dom.boardContainer.style.transform = `scale(${zoomLevel / 100})`;
    dom.zoomText.innerText = `${zoomLevel}%`;
}

function checkWin(r, c, player) {
    const directions = [
        [[0, 1], [0, -1]],   
        [[1, 0], [-1, 0]],   
        [[1, 1], [-1, -1]],  
        [[1, -1], [-1, 1]]   
    ];

    for (let d = 0; d < directions.length; d++) {
        let count = 1;
        let winningCells = [[r, c]];
        
        for (let i = 0; i < 2; i++) {
            let dr = directions[d][i][0];
            let dc = directions[d][i][1];
            let nr = r + dr;
            let nc = c + dc;
            
            while (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
                count++;
                winningCells.push([nr, nc]);
                nr += dr;
                nc += dc;
            }
        }
        
        if (count >= 5) return winningCells; 
    }
    return null;
}

function isBoardFull() {
    return board.every(row => row.every(cell => cell !== null));
}

function evaluateCell(row, col, targetPlayer) {
    let score = 0;
    const directions = [[0,1], [1,0], [1,1], [1,-1]];

    for (let [dr, dc] of directions) {
        let count = 1;
        let openEnds = 0;

        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === targetPlayer) {
            count++; r += dr; c += dc;
        }
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) openEnds++;

        r = row - dr; c = col - dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === targetPlayer) {
            count++; r -= dr; c -= dc;
        }
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) openEnds++;

        score += getPatternScore(count, openEnds);
    }
    return score;
}

function getPatternScore(count, openEnds) {
    if (count >= 5) return 100000;
    if (count === 4) {
        if (openEnds === 2) return 10000;
        if (openEnds === 1) return 1200;
    }
    if (count === 3) {
        if (openEnds === 2) return 1000;
        if (openEnds === 1) return 150;
    }
    if (count === 2) {
        if (openEnds === 2) return 120;
        if (openEnds === 1) return 20;
    }
    return 2;
}

function makeAIMove() {
    if (isGameOver) return;
    
    let bestScore = -1;
    let bestMoves = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === null) {
                let attackScore = evaluateCell(r, c, 'O');
                let defenseScore = evaluateCell(r, c, 'X');
                
                let totalScore = attackScore + defenseScore * (difficulty === 'hard' ? 1.5 : 1.0);
                
                if (moveHistory.length < 4) {
                    const centerDist = Math.abs(r - BOARD_SIZE/2) + Math.abs(c - BOARD_SIZE/2);
                    totalScore += (BOARD_SIZE - centerDist);
                }

                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestMoves = [[r, c]];
                } else if (totalScore === bestScore) {
                    bestMoves.push([r, c]);
                }
            }
        }
    }

    let chosenMove;
    if (difficulty === 'easy' && Math.random() > 0.4 && bestMoves.length > 1) {
        chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    } else {
        chosenMove = bestMoves[0];
    }

    if (chosenMove) {
        executeMove(chosenMove[0], chosenMove[1]);
    }
}

function handleCellClick(r, c) {
    if (isGameOver || board[r][c] !== null) return;
    if (gameMode === 'PvC' && currentPlayer === 'O') return;

    executeMove(r, c);

    if (gameMode === 'PvC' && !isGameOver) {
        setTimeout(() => makeAIMove(), 300);
    }
}

function executeMove(r, c) {
    board[r][c] = currentPlayer;
    moveHistory.push({row: r, col: c, player: currentPlayer});
    audio.playPlacePiece(currentPlayer === 'X');

    const index = r * BOARD_SIZE + c;
    const cell = dom.caroBoard.children[index];
    cell.innerText = currentPlayer;
    cell.className += currentPlayer === 'X' ? ' text-rose-500 neon-glow-x' : ' text-blue-500 neon-glow-o';

    dom.btnUndo.disabled = false;

    const winCells = checkWin(r, c, currentPlayer);
    if (winCells) {
        endGame(currentPlayer, winCells);
        return;
    }

    if (isBoardFull()) {
        endGame('draw');
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnUI();
}

function updateTurnUI() {
    dom.turnText.innerText = `Lượt của ${currentPlayer}`;
    if (currentPlayer === 'X') {
        dom.turnBadge.className = "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold";
        dom.turnBadge.querySelector('span').className = "w-3 h-3 rounded-full bg-rose-500 animate-pulse";
    } else {
        dom.turnBadge.className = "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold";
        dom.turnBadge.querySelector('span').className = "w-3 h-3 rounded-full bg-blue-500 animate-pulse";
    }
}

function endGame(result, winCells = null) {
    isGameOver = true;
    dom.btnUndo.disabled = true;

    if (result === 'draw') {
        scores.draw++;
        dom.scoreDraw.innerText = scores.draw;
        dom.resultTitle.innerText = "HÒA CỜ!";
        dom.resultText.innerText = `Trận đấu bất phân thắng bại trên lưới ${BOARD_SIZE}x${BOARD_SIZE}!`;
        dom.resultIcon.className = "fa-solid fa-handshake text-4xl text-white";
        audio.playDraw();
        
        // Hiện thông báo kết quả ngay nếu hòa
        dom.resultModal.classList.remove('hidden');
    } else {
        scores[result]++;
        dom.scoreX.innerText = scores.X;
        dom.scoreO.innerText = scores.O;
        
        // BƯỚC QUAN TRỌNG: Kích hoạt class 'winning-cell' (Hiệu ứng nhấp nháy vàng từ file CSS) lên các ô thắng cuộc trước
        if (winCells) {
            winCells.forEach(([r, c]) => {
                dom.caroBoard.children[r * BOARD_SIZE + c].classList.add('winning-cell');
            });
        }

        // Thiết lập nội dung bảng thông báo tương ứng
        if (gameMode === 'PvC') {
            if (result === 'X') {
                dom.resultTitle.innerText = "CHIẾN THẮNG!";
                dom.resultText.innerText = `Bạn xuất sắc chiến thắng máy tính ở cấu hình lưới ${BOARD_SIZE}x${BOARD_SIZE}!`;
                dom.resultIcon.className = "fa-solid fa-trophy text-4xl text-white";
                audio.playWin();
            } else {
                dom.resultTitle.innerText = "THẤT BẠI!";
                dom.resultText.innerText = "AI máy tính đã giành chiến thắng lần này. Hãy thử lại!";
                dom.resultIcon.className = "fa-solid fa-skull-crossbones text-4xl text-white";
                audio.playLose();
            }
        } else {
            dom.resultTitle.innerText = `NGƯỜI CHƠI ${result} THẮNG!`;
            dom.resultText.innerText = `Chúc mừng người chơi quân ${result} đã chiến thắng tuyệt đối trên lưới ${BOARD_SIZE}x${BOARD_SIZE}!`;
            dom.resultIcon.className = "fa-solid fa-trophy text-4xl text-white";
            audio.playWin();
        }

        // Đợi 600ms cho người chơi nhìn rõ đường thắng nhấp nháy rồi mới hiện Modal đè lên bàn cờ
        setTimeout(() => {
            if (isGameOver) { 
                dom.resultModal.classList.remove('hidden');
            }
        }, 600);
    }
}

function startNewGame() {
    isGameOver = false;
    moveHistory = [];
    dom.btnUndo.disabled = true;
    currentPlayer = 'X';
    dom.resultModal.classList.add('hidden');
    initBoardUI();
    updateTurnUI();

    if (gameMode === 'PvC' && aiStarts) {
        currentPlayer = 'O';
        updateTurnUI();
        setTimeout(() => makeAIMove(), 500);
    }
}

// ---- Sự kiện lắng nghe (Event Listeners) ----

dom.modePvC.addEventListener('click', () => {
    audio.playClick();
    gameMode = 'PvC';
    dom.labelO.innerText = "Máy (O)";
    dom.modePvC.className = "py-2.5 px-3 rounded-xl font-medium border text-sm transition-all flex items-center justify-center gap-2 bg-rose-500/10 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/10";
    dom.modePvP.className = "py-2.5 px-3 rounded-xl font-medium border text-sm transition-all flex items-center justify-center gap-2 bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750";
    dom.difficultySection.classList.remove('hidden');
    dom.firstMoveSection.classList.remove('hidden');
    startNewGame();
});

dom.modePvP.addEventListener('click', () => {
    audio.playClick();
    gameMode = 'PvP';
    dom.labelO.innerText = "Người chơi O";
    dom.modePvP.className = "py-2.5 px-3 rounded-xl font-medium border text-sm transition-all flex items-center justify-center gap-2 bg-rose-500/10 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/10";
    dom.modePvC.className = "py-2.5 px-3 rounded-xl font-medium border text-sm transition-all flex items-center justify-center gap-2 bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750";
    dom.difficultySection.classList.add('hidden');
    dom.firstMoveSection.classList.add('hidden');
    startNewGame();
});

dom.diffBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        audio.playClick();
        dom.diffBtns.forEach(b => b.className = "diff-btn py-2 px-1 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800 transition-all");
        e.target.className = "diff-btn py-2 px-1 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400 transition-all";
        difficulty = e.target.dataset.diff;
        showToast(`Đã chuyển độ khó sang: ${difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'}`, 'warning');
    });
});

dom.firstPlayer.addEventListener('click', () => {
    audio.playClick();
    aiStarts = false;
    dom.firstPlayer.className = "first-btn py-2 px-3 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-all";
    dom.firstAI.className = "first-btn py-2 px-3 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800 transition-all";
    startNewGame();
});

dom.firstAI.addEventListener('click', () => {
    audio.playClick();
    aiStarts = true;
    dom.firstAI.className = "first-btn py-2 px-3 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-all";
    dom.firstPlayer.className = "first-btn py-2 px-3 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800 transition-all";
    startNewGame();
});

dom.sizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        audio.playClick();
        dom.sizeBtns.forEach(b => b.className = "size-btn px-3 py-1 rounded text-xs font-bold transition-all border border-gray-800 bg-gray-900 text-gray-400");
        e.target.className = "size-btn px-3 py-1 rounded text-xs font-bold transition-all border border-rose-500/30 bg-rose-500/10 text-rose-400";
        BOARD_SIZE = parseInt(e.target.dataset.size);
        showToast(`Đã thay đổi bàn cờ thành kích thước ${BOARD_SIZE}x${BOARD_SIZE}`, 'success');
        startNewGame();
    });
});

dom.btnUndo.addEventListener('click', () => {
    if (moveHistory.length === 0 || isGameOver) return;
    audio.playClick();

    if (gameMode === 'PvC') {
        if (moveHistory.length >= 2) {
            for (let i = 0; i < 2; i++) {
                let lastMove = moveHistory.pop();
                board[lastMove.row][lastMove.col] = null;
                let index = lastMove.row * BOARD_SIZE + lastMove.col;
                dom.caroBoard.children[index].innerText = '';
                dom.caroBoard.children[index].className = dom.caroBoard.children[index].className.replace('text-rose-500 neon-glow-x', '').replace('text-blue-500 neon-glow-o', '');
            }
            currentPlayer = 'X';
        }
    } else {
        let lastMove = moveHistory.pop();
        board[lastMove.row][lastMove.col] = null;
        let index = lastMove.row * BOARD_SIZE + lastMove.col;
        dom.caroBoard.children[index].innerText = '';
        dom.caroBoard.children[index].className = dom.caroBoard.children[index].className.replace('text-rose-500 neon-glow-x', '').replace('text-blue-500 neon-glow-o', '');
        currentPlayer = lastMove.player;
    }

    if (moveHistory.length === 0) dom.btnUndo.disabled = true;
    updateTurnUI();
});

dom.btnNewGame.addEventListener('click', () => { audio.playClick(); startNewGame(); });
dom.btnPlayAgain.addEventListener('click', () => { audio.playClick(); startNewGame(); });

dom.btnResetScore.addEventListener('click', () => {
    audio.playClick();
    scores = { X: 0, O: 0, draw: 0 };
    dom.scoreX.innerText = 0;
    dom.scoreO.innerText = 0;
    dom.scoreDraw.innerText = 0;
    showToast("Đã xóa toàn bộ điểm số thành công!", "success");
});

dom.btnZoomIn.addEventListener('click', () => { if (zoomLevel < 150) { zoomLevel += 10; updateZoom(); } });
dom.btnZoomOut.addEventListener('click', () => { if (zoomLevel > 60) { zoomLevel -= 10; updateZoom(); } });

dom.btnSound.addEventListener('click', () => {
    audio.enabled = !audio.enabled;
    dom.soundIcon.className = audio.enabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark text-rose-500";
    showToast(audio.enabled ? "Đã bật âm thanh hiệu ứng" : "Đã tắt âm thanh hiệu ứng", audio.enabled ? "success" : "warning");
});

dom.btnHelp.addEventListener('click', () => dom.helpModal.classList.remove('hidden'));
dom.btnCloseHelp.addEventListener('click', () => dom.helpModal.classList.add('hidden'));
dom.btnGotIt.addEventListener('click', () => dom.helpModal.classList.add('hidden'));

// Khởi chạy ứng dụng lần đầu
initBoardUI();