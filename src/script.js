let W = 5, H = 5;

const beings = ['zouwu', 'swooping', 'salamander', 'puffskein', 'kelpie'];

const GOALS = { zouwu: 0, kelpie: 0, swooping: 0, salamander: 0, puffskein: 0};
let MOVES = 1;

const mapEl = document.getElementById('map');
const score = document.getElementById('score-value');
const moves = document.getElementById('moves-value');
const footer = document.getElementById('game-footer');

const restartBtn = document.getElementById('restart-btn');
const exitBtn = document.getElementById('exit-btn');

const sfxClick = new Audio('sound&animation/click.wav');
const sfxMatch = new Audio('sound&animation/match.wav');

const getCoords = (td) => ({x: td.cellIndex, y: td.parentNode.rowIndex})
const isNeighbour = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
const cellAt = (x, y) => mapEl.rows[y].cells[x];

function renderGoals() {
    const container = document.getElementById("beings-for-win");
    container.innerHTML = "";

    for (const being in GOALS) {
        if (GOALS[being] <= 0) continue;

        const div = document.createElement("div");
        div.classList.add("being");

        const img = document.createElement("img");
        img.src = `images/${being}.png`;
        img.alt = being;

        const span = document.createElement("span");
        span.className = being;
        span.textContent = GOALS[being];

        div.appendChild(img);
        div.appendChild(span);
        container.appendChild(div);
    }
}

function setBeingAt(x, y, being) {
    const cell = cellAt(x, y);
    cell.setAttribute("data-being", being);
    cell.innerHTML = "";
    if (being) {
        const img = document.createElement("img");
        img.src = `images/${being}.png`;
        img.setAttribute("data-coords", `x${x}_y${y}`);
        cell.appendChild(img);
    }
}

function swapBeings(a, b) {
    const aBeing = a.dataset.being;
    const bBeing = b.dataset.being;
    const aCoords = getCoords(a);
    const bCoords = getCoords(b);
    setBeingAt(aCoords.x, aCoords.y, bBeing);
    setBeingAt(bCoords.x, bCoords.y, aBeing);
}

function findMatches() {
    const toClear = new Set();

    for (let y = 0; y < H; y++) {
        let x = 0;
        while (x < W) {
            const cell = cellAt(x, y);
            const being = cell.dataset.being;
            if (!being) { x++; continue;}

            let run = 1;
            while (x + run < W && cellAt(x + run, y).dataset.being === being) run++;
            if (run >= 3) {
                for (let i = 0; i < run; i++) {
                    toClear.add(`${x+i},${y}`);
                }
            }
            x += run;
        }
    }

    for (let x = 0; x < W; x++) {
        let y = 0;
        while (y < H) {
            const cell = cellAt(x, y);
            const being = cell.dataset.being;
            if (!being) { y++; continue;}

            let run = 1;
            while (y + run < H && cellAt(x, y + run).dataset.being === being) run++;
            if (run >= 3) {
                for (let i = 0; i < run; i++) {
                    toClear.add(`${x},${y+i}`);
                }
            }
            y += run;
        }
    }
    return [...toClear].map(s => {
        const [x, y] = s.split(',').map(Number);
        return {x, y};
    })
}

async function clearCells(cells) {
    sfxMatch.currentTime = 0;
    await sfxMatch.play();

    for (const {x, y} of cells) {
        const cell = cellAt(x, y);
        const img = cell.querySelector('img');
        if (img) img.style.visibility = 'hidden';
        cell.classList.add('vanish');
    }
    await sleep(1100);
    for (const {x, y} of cells) {
        const cell = cellAt(x, y);
        cell.classList.remove('vanish');
        setBeingAt(x, y, "");
    }

}

function fillCells(cells) {
    for (const {x, y} of cells) {
        setBeingAt(x, y, window.generateRandomBeingName());
    }
}

function checkWinLose() {
    const allDone = Object.values(GOALS).every(v => v <= 0);
    const movesLeft = Number(moves.textContent);

    const p = document.createElement('p');

    if (allDone) {
        p.textContent = 'You won! Reload the page to start the game again.!';
        endGame(true);
    } else if (movesLeft <= 0) {
        p.textContent = 'You lost! Reload the page to start the game again.';
        endGame(false);
    }

    footer.innerHTML = "";
    footer.appendChild(p);
}

function endGame(result) {
    const endScreen = document.getElementById('end-overlay');
    endScreen.classList.add('show');

    const endMessage = document.getElementById('end-message');
    if (result) {
        endMessage.textContent = 'You Won!';
    } else {
        endMessage.textContent = 'You are gey!';
    }
}

function updateScore(cells) {
    score.innerHTML = `${Number(score.innerHTML) + 10 * cells.length}`;

    for (const {x, y} of cells) {
        const being = cellAt(x, y).dataset.being;
        if (GOALS[being] > 0) {
            GOALS[being]--;
        }
    }
    renderGoals();
}

function generateWinConditions() {
    for (let i = 0; i < 2; i++) {
        const being = window.generateRandomBeingName();
        const target = Math.floor(Math.random() * 20);
        GOALS[being] += target;
    }
    MOVES = Math.floor(Math.random() * 20) + 1;
}

window.renderMap = (rows, cols) => {
    for (let i = 0 ; i < rows; i++) {
        const row = mapEl.insertRow(i);
        for (let j = 0; j < cols; j++) {
            const cell = row.insertCell(j);
            cell.classList.add('cell');
        }
    }
}

window.clearMap = () => { document.getElementById('map').innerHTML = '';}

window.fillMap = () => {
    for (let y = 0; y < mapEl.rows.length; y++) {
        for (let x = 0; x < mapEl.rows[y].cells.length; x++) {
            const cell = mapEl.rows[y].cells[x];
            if (!cell.hasChildNodes()) {
                const being = beings[Math.floor(Math.random() * beings.length)];
                setBeingAt(x, y, being);
            }
        }
    }
}

window.redrawMap = (creatures) => {
    // window.clearMap();
    if (!Array.isArray(creatures) || creatures.length < 3) return false;
    const rows = creatures.length;
    const cols = creatures[0].length;
    if (cols < 3 || !creatures.every(r => Array.isArray(r) && r.length === cols)) {
        return false;
    }

    // window.renderMap(rows, cols);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const being = creatures[y][x];
            // if (!beings.includes(being)) return false;
            setBeingAt(x, y, being);
        }
    }
    W = rows;
    H = cols;
    return true;
}

window.generateRandomBeingName = () =>
    beings[Math.floor(Math.random() * beings.length)];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let selected = null;
async function handleClick(e) {
    sfxClick.currentTime = 0;
    await sfxClick.play();

    const td = e.target.closest('td.cell');
    if (!td) return;
    const here = getCoords(td);

    if (!selected) {
        td.classList.add('selected');
        selected = here;
        return;
    }

    if (selected.x === here.x && selected.y === here.y) {
        td.classList.remove('selected');
        selected = null;
        return;
    }

    if (isNeighbour(selected, here)) {
        const aCell = cellAt(selected.x, selected.y);
        const bCell = td;

        aCell.classList.remove('selected');

        swapBeings(aCell, bCell);
        moves.textContent = String(Number(moves.textContent) - 1);

        let matches = findMatches();

        if (matches.length > 0) {
            while (matches.length > 0) {
                updateScore(matches);
                await clearCells(matches);
                fillCells(matches);
                matches = findMatches();
            }
            checkWinLose();

        } else {
            swapBeings(aCell, bCell);
        }
        selected = null;
        return;
    }

    cellAt(selected.x, selected.y).classList.remove('selected');
    td.classList.add('selected');
    selected = here;

}
restartBtn.addEventListener('click', () => {
    location.reload();
})

exitBtn.addEventListener('click', () => {
    window.close();
})

mapEl.addEventListener('click', handleClick);

const p = document.createElement('p');
p.textContent = 'Swap animals to form a sequence of three in a row';
footer.appendChild(p);

generateWinConditions();
moves.textContent = String(MOVES);

window.renderGoals();
window.renderMap(W, H);
window.fillMap();
