// ============================================================
//  GAME CỜ CARO - MÃ NGUỒN CÓ CHÚ THÍCH ĐẦY ĐỦ
//  Thuật toán AI: Greedy Heuristic Scoring (Đánh giá tham lam)
// ============================================================


// ============================================================
//  CLASS: SoundEffects - Quản lý toàn bộ âm thanh hiệu ứng
//  Sử dụng Web Audio API để tạo âm thanh tổng hợp (không dùng file âm thanh)
// ============================================================
class SoundEffects {
    constructor() {
        this.enabled = true;  // Cờ bật/tắt âm thanh toàn cục
        this.ctx = null;      // AudioContext - "động cơ" xử lý âm thanh, khởi tạo lười (lazy init)
    }

    // Khởi tạo AudioContext lần đầu tiên khi cần (tránh lỗi autoplay policy của trình duyệt)
    init() {
        if (!this.ctx) {
            // Tương thích trình duyệt cũ (webkit prefix cho Safari)
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // Âm thanh khi nhấn các nút bấm trong giao diện
    playClick() {
        if (!this.enabled) return; // Thoát sớm nếu tắt âm thanh
        this.init();

        let osc = this.ctx.createOscillator(); // Tạo nguồn tạo sóng âm
        let gain = this.ctx.createGain();       // Tạo node điều chỉnh âm lượng

        osc.connect(gain);                      // Nối chuỗi: Oscillator → Gain → Loa
        gain.connect(this.ctx.destination);
        osc.type = 'sine';                      // Dạng sóng hình sin (âm mềm, tròn)

        // Tần số bắt đầu 400Hz, tăng dần lên 800Hz trong 0.08 giây → tạo cảm giác "click" nảy
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

        // Âm lượng bắt đầu 0.1, giảm nhanh về 0.01 trong 0.1 giây → âm ngắn, gọn
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();                             // Phát âm ngay lập tức
        osc.stop(this.ctx.currentTime + 0.1);   // Dừng sau 0.1 giây
    }

    // Âm thanh khi đặt quân cờ (khác nhau cho X và O)
    playPlacePiece(isX) {
        if (!this.enabled) return;
        this.init();

        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle'; // Sóng tam giác - âm sắc rõ hơn, ít mềm hơn sine

        // X phát tần số thấp hơn (330Hz), O phát cao hơn (440Hz) → phân biệt 2 quân
        osc.frequency.setValueAtTime(isX ? 330 : 440, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    // Âm thanh chiến thắng - phát 4 nốt nhạc liên tiếp tạo giai điệu đi lên (arpeggio)
    playWin() {
        if (!this.enabled) return;
        this.init();

        let now = this.ctx.currentTime;
        // Bộ 4 nốt nhạc: C4 → E4 → G4 → C5 (hợp âm Đô trưởng đi lên)
        const notes = [261.63, 329.63, 392.00, 523.25];

        notes.forEach((freq, idx) => {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';

            // Mỗi nốt cách nhau 0.12 giây, tạo hiệu ứng arpeggio
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0, now + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.12 + 0.05); // Fade in nhanh
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.4); // Fade out từ từ

            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.4);
        });
    }

    // Âm thanh thua cuộc - 4 nốt đi xuống, dùng sóng sawtooth (khàn, nặng nề)
    playLose() {
        if (!this.enabled) return;
        this.init();

        let now = this.ctx.currentTime;
        // Bộ 4 nốt đi xuống: G4 → F4 → Eb4 → C4 (giai điệu buồn)
        const notes = [392.00, 349.23, 311.13, 261.63];

        notes.forEach((freq, idx) => {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth'; // Sóng răng cưa - âm cứng, rít → cảm giác thất bại

            osc.frequency.setValueAtTime(freq, now + idx * 0.15); // Nốt cách nhau 0.15s (chậm hơn win)
            gain.gain.setValueAtTime(0, now + idx * 0.15);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.15 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + 0.5);

            osc.start(now + idx * 0.15);
            osc.stop(now + idx * 0.15 + 0.5);
        });
    }

    // Âm thanh hòa cờ - 2 oscillator gần nhau về tần số tạo hiệu ứng "rung" (beating)
    playDraw() {
        if (!this.enabled) return;
        this.init();

        let osc1 = this.ctx.createOscillator();
        let osc2 = this.ctx.createOscillator();
        let gain = this.ctx.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);
        osc1.type = 'sine';
        osc2.type = 'sine';

        // 2 oscillator chênh nhau 5Hz (300 vs 305) → tạo hiệu ứng "rung" 5 lần/giây
        osc1.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc2.frequency.setValueAtTime(305, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6); // Âm dài hơn (0.6s)

        osc1.start(); osc2.start();
        osc1.stop(this.ctx.currentTime + 0.6);
        osc2.stop(this.ctx.currentTime + 0.6);
    }
}

// Tạo instance duy nhất của SoundEffects dùng xuyên suốt game
const audio = new SoundEffects();


// ============================================================
//  BIẾN TRẠNG THÁI GAME (Game State Variables)
// ============================================================

let BOARD_SIZE = 20;        // Kích thước bàn cờ (20×20 ô mặc định)
let board = [];             // Ma trận 2D lưu trạng thái ô: null | 'X' | 'O'
let currentPlayer = 'X';   // Người chơi hiện tại ('X' luôn đi trước)
let isGameOver = false;     // Cờ báo hiệu game đã kết thúc
let gameMode = 'PvC';       // Chế độ chơi: 'PvC' (người vs máy) hoặc 'PvP' (người vs người)
let difficulty = 'medium';  // Độ khó của AI: 'easy' | 'medium' | 'hard'
let aiStarts = false;       // Cho phép AI đi trước hay không
let moveHistory = [];       // Lịch sử các nước đi ({row, col, player}) - dùng cho tính năng Undo
let zoomLevel = 100;        // Mức zoom hiện tại của bàn cờ (60% → 150%)
let scores = { X: 0, O: 0, draw: 0 }; // Bảng điểm tổng trong phiên chơi


// ============================================================
//  ĐỐI TƯỢNG DOM - Lưu trữ tham chiếu tới các phần tử HTML
//  (Truy cập DOM 1 lần rồi cache lại để tối ưu hiệu suất)
// ============================================================
const dom = {
    caroBoard: document.getElementById('caroBoard'),             // Vùng chứa lưới ô cờ
    boardContainer: document.getElementById('boardContainer'),   // Wrapper ngoài bàn cờ (dùng để zoom)
    modePvC: document.getElementById('modePvC'),                 // Nút chọn chế độ Người vs Máy
    modePvP: document.getElementById('modePvP'),                 // Nút chọn chế độ Người vs Người
    diffBtns: document.querySelectorAll('.diff-btn'),            // Tất cả nút chọn độ khó
    sizeBtns: document.querySelectorAll('[data-size]'),          // Tất cả nút chọn kích thước bàn cờ
    difficultySection: document.getElementById('difficultySection'), // Khu vực chọn độ khó
    firstMoveSection: document.getElementById('firstMoveSection'),   // Khu vực chọn ai đi trước
    firstPlayer: document.getElementById('firstPlayer'),         // Nút "Người chơi đi trước"
    firstAI: document.getElementById('firstAI'),                 // Nút "AI đi trước"
    btnUndo: document.getElementById('btnUndo'),                 // Nút hoàn tác nước đi
    btnNewGame: document.getElementById('btnNewGame'),           // Nút bắt đầu ván mới
    btnResetScore: document.getElementById('btnResetScore'),     // Nút xóa điểm số
    scoreX: document.getElementById('scoreX'),                   // Hiển thị điểm người chơi X
    scoreO: document.getElementById('scoreO'),                   // Hiển thị điểm người chơi O
    scoreDraw: document.getElementById('scoreDraw'),             // Hiển thị số ván hòa
    labelO: document.getElementById('labelO'),                   // Nhãn "Máy (O)" hoặc "Người chơi O"
    turnBadge: document.getElementById('turnBadge'),             // Badge hiển thị lượt chơi
    turnText: document.getElementById('turnText'),               // Text trong badge lượt chơi
    btnZoomIn: document.getElementById('btnZoomIn'),             // Nút phóng to bàn cờ
    btnZoomOut: document.getElementById('btnZoomOut'),           // Nút thu nhỏ bàn cờ
    zoomText: document.getElementById('zoomText'),               // Hiển thị phần trăm zoom
    helpModal: document.getElementById('helpModal'),             // Modal hướng dẫn chơi
    btnHelp: document.getElementById('btnHelp'),                 // Nút mở modal hướng dẫn
    btnCloseHelp: document.getElementById('btnCloseHelp'),       // Nút đóng modal hướng dẫn
    btnGotIt: document.getElementById('btnGotIt'),               // Nút "Đã hiểu" trong modal
    resultModal: document.getElementById('resultModal'),         // Modal hiển thị kết quả ván đấu
    resultTitle: document.getElementById('resultTitle'),         // Tiêu đề kết quả (Thắng/Thua/Hòa)
    resultText: document.getElementById('resultText'),           // Mô tả chi tiết kết quả
    resultIcon: document.getElementById('resultIcon'),           // Icon kết quả (trophy/skull/handshake)
    btnPlayAgain: document.getElementById('btnPlayAgain'),       // Nút chơi lại trong modal kết quả
    btnSound: document.getElementById('btnSound'),               // Nút bật/tắt âm thanh
    soundIcon: document.getElementById('soundIcon'),             // Icon loa (bật/tắt)
    toast: document.getElementById('toast'),                     // Thanh thông báo nổi (toast)
    toastMsg: document.getElementById('toastMsg'),               // Nội dung text trong toast
    toastIcon: document.getElementById('toastIcon')              // Icon trong toast
};


// ============================================================
//  HÀM: showToast - Hiển thị thông báo nổi tạm thời
// ============================================================
function showToast(message, type = 'success') {
    dom.toastMsg.innerText = message; // Gán nội dung tin nhắn

    // Chọn icon phù hợp theo loại thông báo (success = xanh lá, warning = vàng)
    dom.toastIcon.className = type === 'success'
        ? "fa-solid fa-circle-check text-green-500 text-lg"
        : "fa-solid fa-triangle-exclamation text-amber-500 text-lg";

    // Hiện toast bằng cách xóa class ẩn và thêm class hiện (dùng Tailwind transition)
    dom.toast.classList.remove('translate-y-20', 'opacity-0');
    dom.toast.classList.add('translate-y-0', 'opacity-100');

    // Tự động ẩn toast sau 3 giây
    setTimeout(() => {
        dom.toast.classList.remove('translate-y-0', 'opacity-100');
        dom.toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}


// ============================================================
//  HÀM: initBoardUI - Khởi tạo lại bàn cờ (UI + dữ liệu)
// ============================================================
function initBoardUI() {
    // Reset ma trận dữ liệu: tạo mảng 2D BOARD_SIZE×BOARD_SIZE toàn giá trị null
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));

    dom.caroBoard.innerHTML = ''; // Xóa toàn bộ ô cờ cũ khỏi DOM

    // Thiết lập CSS Grid với số cột = BOARD_SIZE
    dom.caroBoard.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, minmax(0, 1fr))`;

    // Điều chỉnh kích thước ô theo kích thước bàn cờ để vừa màn hình
    let cellSizeClass = "w-8 h-8 md:w-10 md:h-10"; // Mặc định cho 15×15
    if (BOARD_SIZE === 20) {
        cellSizeClass = "w-7 h-7 md:w-9 md:h-9";   // Nhỏ hơn cho 20×20
    } else if (BOARD_SIZE === 25) {
        cellSizeClass = "w-6 h-6 md:w-7.5 md:h-7.5 text-xs md:text-base"; // Nhỏ nhất cho 25×25
    }

    // Tạo BOARD_SIZE × BOARD_SIZE ô div và thêm vào lưới
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = document.createElement('div');

            // Gán class Tailwind cho styling ô cờ
            cell.className = `${cellSizeClass} bg-gray-900 border border-gray-800 flex items-center justify-center font-bold cursor-pointer transition-all hover:bg-gray-800 select-none relative`;

            // Lưu vị trí hàng/cột vào dataset để dùng khi xử lý click
            cell.dataset.row = r;
            cell.dataset.col = c;

            // Gán sự kiện click cho từng ô
            cell.addEventListener('click', () => handleCellClick(r, c));

            dom.caroBoard.appendChild(cell); // Thêm ô vào bàn cờ
        }
    }
}


// ============================================================
//  HÀM: updateZoom - Áp dụng mức zoom lên bàn cờ
// ============================================================
function updateZoom() {
    // Dùng CSS transform scale thay vì thay đổi kích thước thật → không ảnh hưởng layout
    dom.boardContainer.style.transform = `scale(${zoomLevel / 100})`;
    dom.zoomText.innerText = `${zoomLevel}%`; // Cập nhật text hiển thị phần trăm
}


// ============================================================
//  HÀM: checkWin - Kiểm tra thắng cuộc sau mỗi nước đi
//
//  Thuật toán: Duyệt 4 hướng từ ô vừa đặt, đếm quân liên tiếp
//  Trả về: mảng các ô tạo thành 5 quân liên tiếp, hoặc null
// ============================================================
function checkWin(r, c, player) {
    // Định nghĩa 4 cặp hướng kiểm tra (mỗi cặp là 2 chiều đối nhau)
    const directions = [
        [[0, 1], [0, -1]],   // Ngang: phải và trái
        [[1, 0], [-1, 0]],   // Dọc: xuống và lên
        [[1, 1], [-1, -1]],  // Chéo chính: xuống-phải và lên-trái
        [[1, -1], [-1, 1]]   // Chéo phụ: xuống-trái và lên-phải
    ];

    for (let d = 0; d < directions.length; d++) {
        let count = 1;                       // Đếm số quân liên tiếp (bắt đầu từ 1 = ô hiện tại)
        let winningCells = [[r, c]];        // Lưu danh sách ô thắng (để tô sáng sau này)

        // Duyệt theo 2 chiều của mỗi hướng
        for (let i = 0; i < 2; i++) {
            let dr = directions[d][i][0]; // Delta hàng
            let dc = directions[d][i][1]; // Delta cột
            let nr = r + dr;
            let nc = c + dc;

            // Tiến dọc theo hướng cho đến khi ra ngoài bàn hoặc gặp quân khác/ô trống
            while (
                nr >= 0 && nr < BOARD_SIZE &&
                nc >= 0 && nc < BOARD_SIZE &&
                board[nr][nc] === player
            ) {
                count++;
                winningCells.push([nr, nc]);
                nr += dr;
                nc += dc;
            }
        }

        // Nếu đếm được >= 5 quân liên tiếp → chiến thắng
        if (count >= 5) return winningCells;
    }

    return null; // Chưa có ai thắng
}


// ============================================================
//  HÀM: isBoardFull - Kiểm tra bàn cờ đã đầy chưa (→ hòa)
// ============================================================
function isBoardFull() {
    // Dùng Array.every(): nếu mọi ô đều khác null → bàn cờ đầy
    return board.every(row => row.every(cell => cell !== null));
}


// ============================================================
//  HÀM: evaluateCell - Tính điểm cho một ô trống (dùng bởi AI)
//
//  ĐÂY LÀ TRÁI TIM CỦA THUẬT TOÁN AI
//  Thuật toán: Greedy Heuristic Scoring
//  - Duyệt 4 hướng qua ô cần đánh giá
//  - Đếm quân liên tiếp + số đầu mở (open ends) cho mỗi hướng
//  - Tra bảng điểm theo mẫu (pattern) để tính điểm tổng
// ============================================================
function evaluateCell(row, col, targetPlayer) {
    let score = 0;
    // Chỉ cần duyệt 4 hướng một chiều (không cần 8 vì đếm theo cả 2 chiều trong vòng lặp)
    const directions = [[0,1], [1,0], [1,1], [1,-1]];

    for (let [dr, dc] of directions) {
        let count = 1;    // Số quân liên tiếp (tính cả ô đang xét)
        let openEnds = 0; // Số đầu hở (0, 1, hoặc 2) → đầu hở càng nhiều, mối đe dọa càng lớn

        // === Đếm theo chiều thuận (dr, dc) ===
        let r = row + dr;
        let c = col + dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === targetPlayer) {
            count++; r += dr; c += dc;
        }
        // Kiểm tra ô kế tiếp sau chuỗi: nếu trống → đầu hở
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) openEnds++;

        // === Đếm theo chiều ngược (-dr, -dc) ===
        r = row - dr; c = col - dc;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === targetPlayer) {
            count++; r -= dr; c -= dc;
        }
        // Kiểm tra ô kế tiếp sau chuỗi ngược: nếu trống → đầu hở
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === null) openEnds++;

        // Cộng điểm theo pattern (count + openEnds) cho hướng này
        score += getPatternScore(count, openEnds);
    }

    return score; // Tổng điểm của ô theo người chơi targetPlayer
}


// ============================================================
//  HÀM: getPatternScore - Bảng tra điểm theo mẫu cờ
//
//  Đây là "bảng điểm kinh nghiệm" (heuristic lookup table)
//  Nguyên tắc: chuỗi dài + nhiều đầu hở = điểm cao = mối đe dọa lớn
// ============================================================
function getPatternScore(count, openEnds) {
    if (count >= 5) return 100000;  // Đã thắng! Điểm tối đa tuyệt đối

    if (count === 4) {
        if (openEnds === 2) return 10000;  // Bốn quân, 2 đầu hở → chắc thắng (không thể chặn được)
        if (openEnds === 1) return 1200;   // Bốn quân, 1 đầu hở → sắp thắng
    }
    if (count === 3) {
        if (openEnds === 2) return 1000;   // Ba quân, 2 đầu hở → mối đe dọa nghiêm trọng
        if (openEnds === 1) return 150;    // Ba quân, 1 đầu hở → mối đe dọa trung bình
    }
    if (count === 2) {
        if (openEnds === 2) return 120;    // Hai quân, 2 đầu hở → bắt đầu tạo chuỗi
        if (openEnds === 1) return 20;     // Hai quân, 1 đầu hở → yếu
    }

    return 2; // Quân đơn lẻ hoặc bị chặn hoàn toàn → điểm tối thiểu
}


// ============================================================
//  HÀM: makeAIMove - Tính toán và thực hiện nước đi của AI
//
//  Thuật toán tổng thể: GREEDY HEURISTIC SCORING
//
//  Cách hoạt động:
//  1. Duyệt toàn bộ ô trống trên bàn cờ (brute force)
//  2. Với mỗi ô, tính:
//     - attackScore: nếu AI (O) đánh vào đây → bao nhiêu điểm tấn công?
//     - defenseScore: nếu người chơi (X) đánh vào đây → bao nguy hiểm?
//  3. totalScore = attackScore + defenseScore × hệ_số_phòng_thủ
//  4. Chọn ô có totalScore cao nhất (Greedy - tham lam)
//
//  ƯU ĐIỂM: Đơn giản, nhanh (O(n²)), dễ hiểu
//  NHƯỢC ĐIỂM: Không nhìn trước nhiều bước (không như Minimax),
//              có thể bị đánh bại bởi chiến thuật 2 hướng cùng lúc
// ============================================================
function makeAIMove() {
    if (isGameOver) return; // Không làm gì nếu game đã kết thúc

    let bestScore = -1;   // Điểm tốt nhất tìm được
    let bestMoves = [];   // Danh sách ô có điểm tốt nhất (có thể nhiều ô bằng điểm nhau)

    // Duyệt từng ô trên bàn cờ
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === null) { // Chỉ xét ô trống

                // Tính điểm tấn công: nếu AI đặt quân O vào đây thì được bao nhiêu điểm?
                let attackScore = evaluateCell(r, c, 'O');

                // Tính điểm phòng thủ: nếu X đặt vào đây thì nguy hiểm bao nhiêu?
                let defenseScore = evaluateCell(r, c, 'X');

                // Tổng điểm: Hard tăng hệ số phòng thủ lên 1.5x → AI phòng thủ tích cực hơn
                let totalScore = attackScore + defenseScore * (difficulty === 'hard' ? 1.5 : 1.0);

                // Bonus vị trí trung tâm cho 4 nước đi đầu → AI không đánh góc bàn
                if (moveHistory.length < 4) {
                    const centerDist = Math.abs(r - BOARD_SIZE/2) + Math.abs(c - BOARD_SIZE/2);
                    totalScore += (BOARD_SIZE - centerDist); // Càng gần trung tâm → bonus càng cao
                }

                // Cập nhật danh sách ô tốt nhất
                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestMoves = [[r, c]]; // Tìm thấy ô tốt hơn → reset danh sách
                } else if (totalScore === bestScore) {
                    bestMoves.push([r, c]); // Điểm bằng nhau → thêm vào danh sách
                }
            }
        }
    }

    let chosenMove;
    // Chế độ Easy: 60% khả năng chọn ngẫu nhiên trong bestMoves (không nhất thiết chọn tốt nhất)
    // → Tạo cảm giác AI "ngây thơ", không hoàn hảo
    if (difficulty === 'easy' && Math.random() > 0.4 && bestMoves.length > 1) {
        chosenMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    } else {
        // Medium/Hard: Luôn chọn ô đầu tiên trong bestMoves (điểm cao nhất)
        chosenMove = bestMoves[0];
    }

    if (chosenMove) {
        executeMove(chosenMove[0], chosenMove[1]); // Thực hiện nước đi được chọn
    }
}


// ============================================================
//  HÀM: handleCellClick - Xử lý sự kiện click vào ô cờ
// ============================================================
function handleCellClick(r, c) {
    // Bỏ qua nếu: game đã xong, ô đã có quân, hoặc đang là lượt của AI
    if (isGameOver || board[r][c] !== null) return;
    if (gameMode === 'PvC' && currentPlayer === 'O') return; // Chặn người chơi đánh thay AI

    executeMove(r, c); // Thực hiện nước đi của người chơi

    // Sau nước người chơi, delay 300ms rồi AI đánh (để UI kịp render)
    if (gameMode === 'PvC' && !isGameOver) {
        setTimeout(() => makeAIMove(), 300);
    }
}


// ============================================================
//  HÀM: executeMove - Thực hiện 1 nước đi (cập nhật dữ liệu + UI)
//  Dùng chung cho cả người chơi lẫn AI
// ============================================================
function executeMove(r, c) {
    board[r][c] = currentPlayer; // Ghi quân vào ma trận dữ liệu

    // Ghi vào lịch sử nước đi (để hỗ trợ Undo)
    moveHistory.push({row: r, col: c, player: currentPlayer});

    // Phát âm thanh đặt quân (X hay O)
    audio.playPlacePiece(currentPlayer === 'X');

    // Cập nhật UI: tính chỉ số của ô trong mảng 1 chiều (children)
    const index = r * BOARD_SIZE + c;
    const cell = dom.caroBoard.children[index];
    cell.innerText = currentPlayer; // Hiển thị 'X' hoặc 'O' trong ô

    // Thêm class màu sắc + hiệu ứng glow tương ứng với người chơi
    cell.className += currentPlayer === 'X'
        ? ' text-rose-500 neon-glow-x'   // X: màu đỏ hồng + glow đỏ
        : ' text-blue-500 neon-glow-o';  // O: màu xanh + glow xanh

    dom.btnUndo.disabled = false; // Kích hoạt nút Undo sau khi có nước đi

    // Kiểm tra xem người vừa đánh có thắng không
    const winCells = checkWin(r, c, currentPlayer);
    if (winCells) {
        endGame(currentPlayer, winCells); // Kết thúc game với người thắng
        return;
    }

    // Kiểm tra bàn cờ đầy → hòa
    if (isBoardFull()) {
        endGame('draw');
        return;
    }

    // Chưa xong → đổi lượt chơi
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnUI(); // Cập nhật badge lượt chơi
}


// ============================================================
//  HÀM: updateTurnUI - Cập nhật giao diện badge lượt chơi
// ============================================================
function updateTurnUI() {
    dom.turnText.innerText = `Lượt của ${currentPlayer}`;

    if (currentPlayer === 'X') {
        // Badge màu đỏ hồng cho X
        dom.turnBadge.className = "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold";
        dom.turnBadge.querySelector('span').className = "w-3 h-3 rounded-full bg-rose-500 animate-pulse"; // Chấm nhấp nháy đỏ
    } else {
        // Badge màu xanh cho O
        dom.turnBadge.className = "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold";
        dom.turnBadge.querySelector('span').className = "w-3 h-3 rounded-full bg-blue-500 animate-pulse"; // Chấm nhấp nháy xanh
    }
}


// ============================================================
//  HÀM: endGame - Xử lý kết thúc ván cờ (thắng/thua/hòa)
// ============================================================
function endGame(result, winCells = null) {
    isGameOver = true;           // Đánh dấu game đã kết thúc
    dom.btnUndo.disabled = true; // Khóa nút Undo khi game xong

    if (result === 'draw') {
        // === XỬ LÝ HÒA ===
        scores.draw++;
        dom.scoreDraw.innerText = scores.draw;
        dom.resultTitle.innerText = "HÒA CỜ!";
        dom.resultText.innerText = `Trận đấu bất phân thắng bại trên lưới ${BOARD_SIZE}x${BOARD_SIZE}!`;
        dom.resultIcon.className = "fa-solid fa-handshake text-4xl text-white";
        audio.playDraw();

        dom.resultModal.classList.remove('hidden'); // Hiện modal ngay khi hòa
    } else {
        // === XỬ LÝ THẮNG/THUA ===
        scores[result]++;       // Tăng điểm cho người thắng
        dom.scoreX.innerText = scores.X;
        dom.scoreO.innerText = scores.O;

        // Tô sáng các ô thắng bằng class CSS 'winning-cell' (hiệu ứng nhấp nháy vàng)
        if (winCells) {
            winCells.forEach(([r, c]) => {
                dom.caroBoard.children[r * BOARD_SIZE + c].classList.add('winning-cell');
            });
        }

        // Xác định nội dung modal dựa trên chế độ chơi và người thắng
        if (gameMode === 'PvC') {
            if (result === 'X') {
                // Người chơi thắng AI
                dom.resultTitle.innerText = "CHIẾN THẮNG!";
                dom.resultText.innerText = `Bạn xuất sắc chiến thắng máy tính ở cấu hình lưới ${BOARD_SIZE}x${BOARD_SIZE}!`;
                dom.resultIcon.className = "fa-solid fa-trophy text-4xl text-white";
                audio.playWin();
            } else {
                // AI thắng người chơi
                dom.resultTitle.innerText = "THẤT BẠI!";
                dom.resultText.innerText = "AI máy tính đã giành chiến thắng lần này. Hãy thử lại!";
                dom.resultIcon.className = "fa-solid fa-skull-crossbones text-4xl text-white";
                audio.playLose();
            }
        } else {
            // Chế độ PvP: cả hai người chơi
            dom.resultTitle.innerText = `NGƯỜI CHƠI ${result} THẮNG!`;
            dom.resultText.innerText = `Chúc mừng người chơi quân ${result} đã chiến thắng tuyệt đối trên lưới ${BOARD_SIZE}x${BOARD_SIZE}!`;
            dom.resultIcon.className = "fa-solid fa-trophy text-4xl text-white";
            audio.playWin();
        }

        // Delay 600ms để người chơi thấy đường thắng nhấp nháy TRƯỚC KHI modal xuất hiện
        setTimeout(() => {
            if (isGameOver) { // Kiểm tra lại phòng trường hợp ván mới bắt đầu trước timeout
                dom.resultModal.classList.remove('hidden');
            }
        }, 600);
    }
}


// ============================================================
//  HÀM: startNewGame - Bắt đầu ván cờ mới
// ============================================================
function startNewGame() {
    isGameOver = false;           // Reset cờ kết thúc game
    moveHistory = [];             // Xóa lịch sử nước đi
    dom.btnUndo.disabled = true;  // Vô hiệu hóa Undo (chưa có nước nào)
    currentPlayer = 'X';          // X luôn đi trước mặc định
    dom.resultModal.classList.add('hidden'); // Ẩn modal kết quả
    initBoardUI();                // Vẽ lại bàn cờ mới
    updateTurnUI();               // Cập nhật badge lượt

    // Nếu AI đi trước: đổi lượt sang O và cho AI đánh sau 500ms
    if (gameMode === 'PvC' && aiStarts) {
        currentPlayer = 'O';
        updateTurnUI();
        setTimeout(() => makeAIMove(), 500);
    }
}


// ============================================================
//  EVENT LISTENERS - Lắng nghe sự kiện người dùng
// ============================================================

// Nút chọn chế độ Người vs Máy
dom.modePvC.addEventListener('click', () => {
    audio.playClick();
    gameMode = 'PvC';
    dom.labelO.innerText = "Máy (O)"; // Đổi nhãn từ "Người chơi O" → "Máy (O)"

    // Highlight nút được chọn (active) và bỏ highlight nút kia
    dom.modePvC.className = "py-2.5 px-3 rounded-xl font-medium border text-sm transition-all flex items-center justify-center gap-2 bg-rose-500/10 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/10";
    dom.modePvP.className = "py-2.5 px-3 rounded-xl font-medium border text-sm transition-all flex items-center justify-center gap-2 bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750";

    dom.difficultySection.classList.remove('hidden'); // Hiện khu vực chọn độ khó
    dom.firstMoveSection.classList.remove('hidden');  // Hiện khu vực chọn ai đi trước
    startNewGame();
});

// Nút chọn chế độ Người vs Người
dom.modePvP.addEventListener('click', () => {
    audio.playClick();
    gameMode = 'PvP';
    dom.labelO.innerText = "Người chơi O"; // Đổi nhãn từ "Máy (O)" → "Người chơi O"

    dom.modePvP.className = "py-2.5 px-3 rounded-xl font-medium border text-sm transition-all flex items-center justify-center gap-2 bg-rose-500/10 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/10";
    dom.modePvC.className = "py-2.5 px-3 rounded-xl font-medium border text-sm transition-all flex items-center justify-center gap-2 bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750";

    dom.difficultySection.classList.add('hidden'); // Ẩn khu vực độ khó (PvP không cần)
    dom.firstMoveSection.classList.add('hidden');  // Ẩn khu vực ai đi trước
    startNewGame();
});

// Các nút chọn độ khó (Dễ / Vừa / Khó)
dom.diffBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        audio.playClick();

        // Reset toàn bộ về style không active
        dom.diffBtns.forEach(b => b.className = "diff-btn py-2 px-1 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800 transition-all");

        // Highlight nút đang được chọn
        e.target.className = "diff-btn py-2 px-1 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400 transition-all";

        difficulty = e.target.dataset.diff; // Cập nhật biến độ khó từ data attribute

        // Hiển thị thông báo thay đổi độ khó
        showToast(`Đã chuyển độ khó sang: ${difficulty === 'easy' ? 'Dễ' : difficulty === 'medium' ? 'Vừa' : 'Khó'}`, 'warning');
    });
});

// Nút "Người chơi đi trước"
dom.firstPlayer.addEventListener('click', () => {
    audio.playClick();
    aiStarts = false; // AI không đi trước
    // Highlight nút được chọn
    dom.firstPlayer.className = "first-btn py-2 px-3 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-all";
    dom.firstAI.className = "first-btn py-2 px-3 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800 transition-all";
    startNewGame(); // Bắt đầu ván mới với cấu hình mới
});

// Nút "AI đi trước"
dom.firstAI.addEventListener('click', () => {
    audio.playClick();
    aiStarts = true; // AI đi trước
    dom.firstAI.className = "first-btn py-2 px-3 rounded-lg text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-400 transition-all";
    dom.firstPlayer.className = "first-btn py-2 px-3 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800/50 text-gray-400 hover:bg-gray-800 transition-all";
    startNewGame();
});

// Các nút chọn kích thước bàn cờ (15×15, 20×20, 25×25)
dom.sizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        audio.playClick();

        // Reset style tất cả nút size
        dom.sizeBtns.forEach(b => b.className = "size-btn px-3 py-1 rounded text-xs font-bold transition-all border border-gray-800 bg-gray-900 text-gray-400");

        // Highlight nút được chọn
        e.target.className = "size-btn px-3 py-1 rounded text-xs font-bold transition-all border border-rose-500/30 bg-rose-500/10 text-rose-400";

        BOARD_SIZE = parseInt(e.target.dataset.size); // Cập nhật kích thước từ data attribute
        showToast(`Đã thay đổi bàn cờ thành kích thước ${BOARD_SIZE}x${BOARD_SIZE}`, 'success');
        startNewGame(); // Khởi tạo lại bàn cờ với kích thước mới
    });
});

// Nút Undo - Hoàn tác nước đi
dom.btnUndo.addEventListener('click', () => {
    if (moveHistory.length === 0 || isGameOver) return;
    audio.playClick();

    if (gameMode === 'PvC') {
        // PvC: Hoàn tác 2 nước (1 của AI + 1 của người) để giữ lượt cho người chơi
        if (moveHistory.length >= 2) {
            for (let i = 0; i < 2; i++) {
                let lastMove = moveHistory.pop(); // Lấy nước đi cuối ra khỏi lịch sử
                board[lastMove.row][lastMove.col] = null; // Xóa quân khỏi ma trận

                let index = lastMove.row * BOARD_SIZE + lastMove.col;
                dom.caroBoard.children[index].innerText = ''; // Xóa quân khỏi UI

                // Xóa class màu sắc của quân cờ
                dom.caroBoard.children[index].className = dom.caroBoard.children[index].className
                    .replace('text-rose-500 neon-glow-x', '')
                    .replace('text-blue-500 neon-glow-o', '');
            }
            currentPlayer = 'X'; // Sau undo, luôn là lượt của người chơi X
        }
    } else {
        // PvP: Chỉ hoàn tác 1 nước
        let lastMove = moveHistory.pop();
        board[lastMove.row][lastMove.col] = null;
        let index = lastMove.row * BOARD_SIZE + lastMove.col;
        dom.caroBoard.children[index].innerText = '';
        dom.caroBoard.children[index].className = dom.caroBoard.children[index].className
            .replace('text-rose-500 neon-glow-x', '')
            .replace('text-blue-500 neon-glow-o', '');
        currentPlayer = lastMove.player; // Trả lại lượt cho người vừa hoàn tác
    }

    // Vô hiệu hóa Undo nếu không còn nước nào trong lịch sử
    if (moveHistory.length === 0) dom.btnUndo.disabled = true;
    updateTurnUI(); // Cập nhật badge lượt
});

// Nút Ván Mới và Nút Chơi Lại (cùng hành động)
dom.btnNewGame.addEventListener('click', () => { audio.playClick(); startNewGame(); });
dom.btnPlayAgain.addEventListener('click', () => { audio.playClick(); startNewGame(); });

// Nút Reset điểm số
dom.btnResetScore.addEventListener('click', () => {
    audio.playClick();
    scores = { X: 0, O: 0, draw: 0 }; // Reset object điểm số
    dom.scoreX.innerText = 0;
    dom.scoreO.innerText = 0;
    dom.scoreDraw.innerText = 0;
    showToast("Đã xóa toàn bộ điểm số thành công!", "success");
});

// Nút Zoom In (phóng to)
dom.btnZoomIn.addEventListener('click', () => {
    if (zoomLevel < 150) { zoomLevel += 10; updateZoom(); } // Giới hạn tối đa 150%
});

// Nút Zoom Out (thu nhỏ)
dom.btnZoomOut.addEventListener('click', () => {
    if (zoomLevel > 60) { zoomLevel -= 10; updateZoom(); } // Giới hạn tối thiểu 60%
});

// Nút bật/tắt âm thanh
dom.btnSound.addEventListener('click', () => {
    audio.enabled = !audio.enabled; // Toggle trạng thái âm thanh

    // Cập nhật icon tương ứng (loa bình thường vs loa gạch chéo đỏ)
    dom.soundIcon.className = audio.enabled
        ? "fa-solid fa-volume-high"
        : "fa-solid fa-volume-xmark text-rose-500";

    showToast(
        audio.enabled ? "Đã bật âm thanh hiệu ứng" : "Đã tắt âm thanh hiệu ứng",
        audio.enabled ? "success" : "warning"
    );
});

// Nút mở modal hướng dẫn
dom.btnHelp.addEventListener('click', () => dom.helpModal.classList.remove('hidden'));

// Nút đóng modal hướng dẫn (2 nút: X góc trên và nút "Đã hiểu")
dom.btnCloseHelp.addEventListener('click', () => dom.helpModal.classList.add('hidden'));
dom.btnGotIt.addEventListener('click', () => dom.helpModal.classList.add('hidden'));


// ============================================================
//  KHỞI CHẠY ỨNG DỤNG
//  Gọi khi trang web load xong, tạo bàn cờ ban đầu
// ============================================================
initBoardUI();