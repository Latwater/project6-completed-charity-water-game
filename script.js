console.log('Charity Water Project script loaded.');

const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const feedback = document.getElementById('feedback');
const startBtn = document.getElementById('start-btn');
const bucket = document.getElementById('bucket');

let score = 0;
let timeLeft = 30;
let gameInterval = null;
let dropInterval = null;
let gameActive = false;
let bucketX = 120; // initial position (centered)
const bucketWidth = 80;
const bucketHeight = 40;
let highScore = localStorage.getItem('cw_highscore') ? parseInt(localStorage.getItem('cw_highscore')) : 0;

function setBucketPosition(x) {
    // Clamp bucket within game area
    bucketX = Math.max(0, Math.min(gameArea.clientWidth - bucketWidth, x));
    bucket.style.left = bucketX + 'px';
}

function handleMouseMove(e) {
    if (!gameActive) return;
    const rect = gameArea.getBoundingClientRect();
    let x = e.clientX - rect.left - bucketWidth / 2;
    setBucketPosition(x);
}

function handleKeyDown(e) {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft') {
        setBucketPosition(bucketX - 24);
    } else if (e.key === 'ArrowRight') {
        setBucketPosition(bucketX + 24);
    }
}

function randomX() {
    // Keep drops within game area
    return Math.floor(Math.random() * (gameArea.clientWidth - 36));
}

function createDrop() {
    const isWater = Math.random() < 0.7; // 70% water, 30% pollutant
    const drop = document.createElement('div');
    drop.className = isWater ? 'water-drop' : 'pollutant-drop';
    drop.style.left = randomX() + 'px';
    drop.style.top = '-48px';
    drop.dataset.type = isWater ? 'water' : 'pollutant';

    gameArea.appendChild(drop);

    // Animate drop falling
    let y = -48;
    // Slower speeds: reduce by about 30%
    const speed = isWater ? 1.7 + Math.random() * 0.7 : 1.3 + Math.random() * 0.7; // px per frame, slight random
    const dropX = parseInt(drop.style.left);

    function fall() {
        if (!gameActive) {
            drop.remove();
            return;
        }
        y += speed;
        drop.style.top = y + 'px';

        // Check for collision with bucket
        if (
            y + 48 >= gameArea.clientHeight - bucketHeight - 4 && // bottom of drop at bucket
            y + 48 <= gameArea.clientHeight + 8 // allow a little leeway
        ) {
            const dropLeft = parseInt(drop.style.left);
            const dropRight = dropLeft + 36;
            const bucketLeft = bucketX;
            const bucketRight = bucketX + bucketWidth;
            // Check horizontal overlap
            if (dropRight > bucketLeft && dropLeft < bucketRight) {
                // Caught!
                if (drop.dataset.type === 'water') {
                    score++;
                    showFeedback('Great! +1', true);
                } else {
                    score = Math.max(0, score - 2);
                    showFeedback('Pollutant! -2', false);
                }
                updateScore();
                drop.remove();
                return;
            }
        }

        if (y > gameArea.clientHeight) {
            // Drop missed
            if (drop.dataset.type === 'water') {
                // Optional: penalty for missing water drops
                // score = Math.max(0, score - 1);
                // showFeedback('Missed! -1', false);
                // updateScore();
            }
            drop.remove();
        } else {
            requestAnimationFrame(fall);
        }
    }
    requestAnimationFrame(fall);
}

function updateScore() {
    scoreDisplay.textContent = 'Score: ' + score;
}

function updateTimer() {
    timerDisplay.textContent = 'Time: ' + timeLeft;
}

function showFeedback(msg, positive) {
    feedback.textContent = msg;
    feedback.style.color = positive ? '#ffd600' : '#888';
    setTimeout(() => {
        feedback.textContent = '';
    }, 800);
}

function startGame() {
    score = 0;
    timeLeft = 30;
    updateScore();
    updateTimer();
    feedback.textContent = '';
    gameArea.innerHTML = '';
    gameArea.appendChild(bucket);
    setBucketPosition((gameArea.clientWidth - bucketWidth) / 2);
    gameActive = true;
    startBtn.disabled = true;

    // Drop generator
    dropInterval = setInterval(createDrop, 700);

    // Timer
    gameInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(dropInterval);
    let newHigh = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('cw_highscore', highScore);
        newHigh = true;
    }
    feedback.textContent = `Game Over! Final Score: ${score}` + 
        (newHigh ? " 🎉 New High Score!" : ` | High Score: ${highScore}`);
    startBtn.disabled = false;
}

startBtn.addEventListener('click', () => {
    if (!gameActive) startGame();
});

// Move bucket with mouse inside game area
gameArea.addEventListener('mousemove', handleMouseMove);
// Move bucket with arrow keys
window.addEventListener('keydown', handleKeyDown);