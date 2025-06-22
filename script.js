console.log('Charity Water Project script loaded.');

const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const feedback = document.getElementById('feedback');
const startBtn = document.getElementById('start-btn');
const bucket = document.getElementById('bucket');
const difficultySelect = document.getElementById('difficulty');
const bgMusic = document.getElementById('bg-music');
const soundBtn = document.getElementById('sound-btn');
const comboDisplay = document.getElementById('combo-display');

let score = 0;
let timeLeft = 30;
let gameInterval = null;
let dropInterval = null;
let gameActive = false;
let bucketX = 120; // initial position (centered)
const bucketWidth = 80;
const bucketHeight = 40;
let highScore = localStorage.getItem('cw_highscore') ? parseInt(localStorage.getItem('cw_highscore')) : 0;
let dropGenSpeed = 700;
let dropSpeedMod = 1;
let gameDuration = 30;
let musicMuted = false;

let combo = 0;
let comboTimeout = null;
let streak = 0;
let lastDropType = null;
let goldenDropChance = 0.08; // 8% chance

const missionMessages = [
    "Every drop you catch helps bring clean water to communities in need.",
    "Charity: water has funded 111,000+ water projects worldwide!",
    "1 in 10 people lack access to clean water. You can help.",
    "Your actions make a difference. Thank you for playing!"
];
const comboMessages = [
    "Combo! +2", "Amazing! +3", "Streak! +4", "Incredible! +5", "Unstoppable! +6"
];
const funFacts = [
    "Did you know? 771 million people lack access to clean water.",
    "Every $40 can bring clean water to one person.",
    "Charity: water has funded 111,000+ water projects!",
    "Clean water changes everything.",
    "You are making a difference!"
];

function setDifficulty() {
    const diff = difficultySelect.value;
    if (diff === 'easy') {
        dropGenSpeed = 950;
        dropSpeedMod = 0.8;
        gameDuration = 40;
    } else if (diff === 'normal') {
        dropGenSpeed = 700;
        dropSpeedMod = 1;
        gameDuration = 30;
    } else if (diff === 'hard') {
        dropGenSpeed = 480;
        dropSpeedMod = 1.25;
        gameDuration = 22;
    }
}

difficultySelect.addEventListener('change', () => {
    if (!gameActive) {
        setDifficulty();
        timerDisplay.textContent = 'Time: ' + gameDuration;
    }
});

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

function showCombo(combo) {
    if (combo < 2) {
        comboDisplay.textContent = '';
        return;
    }
    let msg = comboMessages[Math.min(combo - 2, comboMessages.length - 1)];
    comboDisplay.textContent = msg;
    comboDisplay.classList.add('combo-animate');
    setTimeout(() => comboDisplay.classList.remove('combo-animate'), 500);
}

function showSplash(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.className = 'splash-particle';
        particle.style.left = (x + 12 + Math.random() * 12) + 'px';
        particle.style.top = (y + 24 + Math.random() * 8) + 'px';
        particle.style.background = color;
        gameArea.appendChild(particle);
        setTimeout(() => particle.remove(), 500);
    }
}

function showRandomFact() {
    if (Math.random() < 0.18) {
        const fact = funFacts[Math.floor(Math.random() * funFacts.length)];
        feedback.textContent = fact;
        feedback.classList.add('feedback-animate');
        setTimeout(() => {
            feedback.textContent = '';
            feedback.classList.remove('feedback-animate');
        }, 1800);
    }
}

function createDrop() {
    let isGolden = Math.random() < goldenDropChance;
    const isWater = isGolden ? true : Math.random() < 0.7;
    const drop = document.createElement('div');
    drop.className = isGolden ? 'water-drop golden-drop' : (isWater ? 'water-drop' : 'pollutant-drop');
    drop.style.left = randomX() + 'px';
    drop.style.top = '-48px';
    drop.dataset.type = isGolden ? 'golden' : (isWater ? 'water' : 'pollutant');

    // Click to collect or remove drop
    drop.addEventListener('click', function(e) {
        if (!gameActive) return;
        if (drop.classList.contains('splash')) return;
        const dropRect = drop.getBoundingClientRect();
        const areaRect = gameArea.getBoundingClientRect();
        const x = dropRect.left - areaRect.left;
        const y = parseInt(drop.style.top);
        if (drop.dataset.type === 'water') {
            score++;
            streak++;
            combo++;
            showCombo(combo);
            showFeedback('Bonus! +1', true);
            showSplash(x, y, '#00adef');
        } else if (drop.dataset.type === 'golden') {
            score += 5;
            streak++;
            combo++;
            showCombo(combo);
            showFeedback('Golden Drop! +5', true);
            showSplash(x, y, '#ffd600');
        } else {
            score = Math.max(0, score - 2);
            streak = 0;
            combo = 0;
            showCombo(combo);
            showFeedback('Pollutant! -2', false);
            showSplash(x, y, '#888');
            bucket.classList.add('bucket-shake');
            setTimeout(() => bucket.classList.remove('bucket-shake'), 400);
        }
        updateScore();
        drop.classList.add('splash');
        setTimeout(() => drop.remove(), 300);
        showRandomFact();
        if (combo >= 2) {
            score += combo - 1;
            updateScore();
        }
        if (comboTimeout) clearTimeout(comboTimeout);
        comboTimeout = setTimeout(() => {
            combo = 0;
            showCombo(combo);
        }, 1800);
    });

    gameArea.appendChild(drop);

    // Animate drop falling
    let y = -48;
    // Slower speeds: reduce by about 30%
    const baseSpeed = isWater ? 1.7 + Math.random() * 0.7 : 1.3 + Math.random() * 0.7; // px per frame, slight random
    const speed = baseSpeed * dropSpeedMod;
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
            y + 48 >= gameArea.clientHeight - bucketHeight - 4 &&
            y + 48 <= gameArea.clientHeight + 8
        ) {
            const dropLeft = parseInt(drop.style.left);
            const dropRight = dropLeft + 36;
            const bucketLeft = bucketX;
            const bucketRight = bucketX + bucketWidth;
            if (dropRight > bucketLeft && dropLeft < bucketRight) {
                const areaRect = gameArea.getBoundingClientRect();
                const x = dropLeft;
                if (drop.dataset.type === 'water') {
                    score++;
                    streak++;
                    combo++;
                    showCombo(combo);
                    showFeedback('Great! +1', true);
                    showSplash(x, y, '#00adef');
                } else if (drop.dataset.type === 'golden') {
                    score += 5;
                    streak++;
                    combo++;
                    showCombo(combo);
                    showFeedback('Golden Drop! +5', true);
                    showSplash(x, y, '#ffd600');
                } else {
                    score = Math.max(0, score - 2);
                    streak = 0;
                    combo = 0;
                    showCombo(combo);
                    showFeedback('Pollutant! -2', false);
                    showSplash(x, y, '#888');
                    bucket.classList.add('bucket-shake');
                    setTimeout(() => bucket.classList.remove('bucket-shake'), 400);
                }
                updateScore();
                drop.classList.add('splash');
                setTimeout(() => drop.remove(), 300);
                showRandomFact();
                if (combo >= 2) {
                    score += combo - 1;
                    updateScore();
                }
                if (comboTimeout) clearTimeout(comboTimeout);
                comboTimeout = setTimeout(() => {
                    combo = 0;
                    showCombo(combo);
                }, 1800);
                return; // Stop falling after being caught
            }
        }

        if (y > gameArea.clientHeight) {
            // Drop missed
            if (drop.dataset.type === 'water' || drop.dataset.type === 'golden') {
                streak = 0;
                combo = 0;
                showCombo(combo);
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
    feedback.classList.add('feedback-animate');
    setTimeout(() => {
        feedback.textContent = '';
        feedback.classList.remove('feedback-animate');
    }, 800);
}

function startGame() {
    setDifficulty();
    score = 0;
    timeLeft = gameDuration;
    updateScore();
    updateTimer();
    feedback.textContent = '';
    comboDisplay.textContent = '';
    gameArea.innerHTML = '';
    gameArea.appendChild(bucket);
    setBucketPosition((gameArea.clientWidth - bucketWidth) / 2);
    gameActive = true;
    startBtn.disabled = true;
    difficultySelect.disabled = true;
    streak = 0;
    combo = 0;

    // Play background music
    if (bgMusic) {
        bgMusic.currentTime = 0;
        bgMusic.volume = 0.45;
        bgMusic.muted = musicMuted;
        bgMusic.play();
    }

    // Drop generator
    dropInterval = setInterval(createDrop, dropGenSpeed);

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
    // Show a random mission/impact message
    const missionMsg = missionMessages[Math.floor(Math.random() * missionMessages.length)];
    feedback.innerHTML = `Game Over! Final Score: ${score}` + 
        (newHigh ? " 🎉 New High Score!<br>" : ` | High Score: ${highScore}<br>`) +
        `<span style='display:block;font-size:1em;color:#00adef;margin-top:0.5em;'>${missionMsg}</span>`;
    startBtn.disabled = false;
    difficultySelect.disabled = false;

    // Pause and rewind music
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

if (soundBtn) {
    soundBtn.addEventListener('click', () => {
        musicMuted = !musicMuted;
        if (bgMusic) {
            bgMusic.muted = musicMuted;
        }
        soundBtn.textContent = musicMuted ? '🔇' : '🔊';
    });
}

startBtn.addEventListener('click', () => {
    if (!gameActive) startGame();
});

gameArea.addEventListener('mousemove', handleMouseMove);
window.addEventListener('keydown', handleKeyDown);