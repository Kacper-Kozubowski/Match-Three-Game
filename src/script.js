let W = 5, H = 5;
const mapE1 = document.getElementById('map');
const getCoords = (td) => ({x: td.cellIndex, y: td.parentNode.rowIndex})
const isNeighbour = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
const cellAt = (x, y) => mapE1.rows[y].cells[x];
const score = document.getElementById('score-value');
const moves = document.getElementById('moves-value');
const footer = document.getElementById('game-footer');

const beings = ['zouwu', 'swooping', 'salamander', 'puffskein', 'kelpie'];

const GOALS = { zouwu: 3, kelpie: 0};
const MOVES = 1;

const sfxClick = new Audio('sound&animation/click.wav');
const sfxMatch = new Audio('sound&animation/match.wav');

function renderGoals() {
    const container = document.getElementById("beings-for-win");
    container.innerHTML = "";

    for (const being in GOALS) {
        // if (GOALS[being] <= 0) continue;

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    await sleep(1000);
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
    } else if (movesLeft === 0) {
        p.textContent = 'You lost! Reload the page to start the game again.';
    }

    footer.innerHTML = "";
    footer.appendChild(p);
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
    checkWinLose();

}

window.renderMap = (rows, cols) => {
    for (let i = 0 ; i < rows; i++) {
        const row = mapE1.insertRow(i);
        for (let j = 0; j < cols; j++) {
            const cell = row.insertCell(j);
            cell.classList.add('cell');
        }
    }
}

window.clearMap = () => { document.getElementById('map').innerHTML = '';}

window.fillMap = () => {
    for (let y = 0; y < mapE1.rows.length; y++) {
        for (let x = 0; x < mapE1.rows[y].cells.length; x++) {
            const cell = mapE1.rows[y].cells[x];
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

let selected = null;
async function handleClick(e) {
    const td = e.target.closest('td.cell');
    if (!td) return;
    const here = getCoords(td);

    if (!selected) {
        sfxClick.currentTime = 0;
        await sfxClick.play();
        td.classList.add('selected');
        selected = here;
        return;
    }

    if (selected.x === here.x && selected.y === here.y) {
        sfxClick.currentTime = 0;
        await sfxClick.play();
        td.classList.remove('selected');
        selected = null;
        return;
    }

    if (isNeighbour(selected, here)) {
        const aCell = cellAt(selected.x, selected.y);
        const bCell = td;

        aCell.classList.remove('selected');

        sfxClick.currentTime = 0;
        await sfxClick.play();

        swapBeings(aCell, bCell);
        moves.textContent = String(Number(moves.textContent) - 1);

        let matches = findMatches();

        if (matches.length > 0) {
            while (matches.length > 0) {
                updateScore(matches);
                clearCells(matches);
                await sleep(1100);
                fillCells(matches);
                matches = findMatches();
            }

        } else {
            swapBeings(aCell, bCell);
        }
        selected = null;
        return;
    }

    cellAt(selected.x, selected.y).classList.remove('selected');
    sfxClick.currentTime = 0;
    await sfxClick.play();
    td.classList.add('selected');
    selected = here;

}

mapE1.addEventListener('click', handleClick);
moves.textContent = String(MOVES);

window.renderGoals();
window.renderMap(W, H);
window.fillMap();
