const svgNS = "http://www.w3.org/2000/svg";

const petriStructure = {
    places: [
        { name: "Idle", x: 80, y: 200 },
        { name: "RequestsQueue", x: 80, y: 400 },
        { name: "MovingUp", x: 280, y: 120 },
        { name: "MovingDown", x: 280, y: 280 },
        { name: "DoorOpen", x: 600, y: 200 }
    ],
    transitions: [
        { name: "CallElevator", x: 180, y: 400 },
        { name: "MoveUp", x: 180, y: 120 },
        { name: "MoveDown", x: 180, y: 280 },
        { name: "ArriveFloor", x: 400, y: 120 },
        { name: "ArriveFloorDown", x: 400, y: 280 },
        { name: "OpenDoor", x: 500, y: 200 },
        { name: "CloseDoor", x: 700, y: 200 }
    ],
    arcs: [
        { from: "Idle", to: "MoveUp" },
        { from: "RequestsQueue", to: "MoveUp" },
        { from: "Idle", to: "MoveDown" },
        { from: "RequestsQueue", to: "MoveDown" },
        { from: "MovingUp", to: "ArriveFloor" },
        { from: "MovingDown", to: "ArriveFloorDown" },
        { from: "DoorOpen", to: "OpenDoor" },
        { from: "DoorOpen", to: "CloseDoor" },
        { from: "CallElevator", to: "RequestsQueue" },
        { from: "MoveUp", to: "MovingUp" },
        { from: "MoveDown", to: "MovingDown" },
        { from: "ArriveFloor", to: "DoorOpen" },
        { from: "ArriveFloorDown", to: "DoorOpen" },
        { from: "OpenDoor", to: "DoorOpen" },
        { from: "CloseDoor", to: "Idle" }
    ]
};

let currentState = initialState;
let history = [];

const transitions = petriStructure.transitions.map(t => t.name);
const places = petriStructure.places.map(p => p.name);

async function isTransitionEnabled(transition) {
    try {
        const response = await fetch('/enabled', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transition })
        });
        if (!response.ok) throw new Error('Erreur serveur');
        const data = await response.json();
        return data.enabled;
    } catch (e) {
        console.error('Erreur lors du check de transition:', e);
        return false;
    }
}

async function renderPlaces() {
    const container = document.getElementById('places-container');
    container.innerHTML = '';
    places.forEach(place => {
        const div = document.createElement('div');
        div.classList.add('place');
        if ((currentState[place] ?? 0) > 0) div.classList.add('active');

        const tokenCount = document.createElement('span');
        tokenCount.className = 'token-count';
        tokenCount.textContent = currentState[place] ?? 0;

        const label = document.createElement('span');
        label.className = 'place-label';
        label.textContent = place;

        div.appendChild(tokenCount);
        div.appendChild(label);
        container.appendChild(div);
    });
}

async function renderTransitions() {
    const container = document.getElementById('transitions-container');
    container.innerHTML = '';

    for (const t of transitions) {
        const enabled = await isTransitionEnabled(t);
        const div = document.createElement('div');
        div.classList.add('transition');
        div.textContent = t;
        if (enabled) {
            div.classList.add('enabled');
            div.addEventListener('click', () => fireTransition(t));
        }
        container.appendChild(div);
    }
}

function drawArrow(svg, x1, y1, x2, y2) {
    const path = document.createElementNS(svgNS, "path");
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const controlX = x1 + deltaX / 2;
    const controlY = y1;

    const d = `M${x1},${y1} Q${controlX},${controlY + (deltaY * 0.6)} ${x2},${y2}`;
    path.setAttribute("d", d);
    path.setAttribute("stroke", "#444");
    path.setAttribute("stroke-width", 2);
    path.setAttribute("fill", "none");
    path.setAttribute("marker-end", "url(#arrowhead)");
    svg.appendChild(path);
}

function drawCircle(svg, x, y, tokens, active, name) {
    const group = document.createElementNS(svgNS, "g");
    group.setAttribute('class', 'place-node');
    group.setAttribute('tabindex', '0');
    group.setAttribute('aria-label', `Place ${name} avec ${tokens} jeton${tokens > 1 ? 's' : ''}`);

    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", 28);
    circle.setAttribute("fill", active ? "#007bff" : "#ddd");
    circle.setAttribute("stroke", "#333");
    circle.setAttribute("stroke-width", 2);
    group.appendChild(circle);

    const textTokens = document.createElementNS(svgNS, "text");
    textTokens.setAttribute("x", x);
    textTokens.setAttribute("y", y + 8);
    textTokens.setAttribute("text-anchor", "middle");
    textTokens.setAttribute("font-size", "20px");
    textTokens.setAttribute("fill", active ? "#fff" : "#555");
    textTokens.textContent = tokens;
    group.appendChild(textTokens);

    const label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", y + 50);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "14px");
    label.setAttribute("fill", "#333");
    label.textContent = name;
    group.appendChild(label);

    svg.appendChild(group);
    return group;
}

function drawRect(svg, x, y, name, enabled) {
    const group = document.createElementNS(svgNS, "g");
    group.setAttribute('class', 'transition-node');
    group.setAttribute('tabindex', enabled ? '0' : '-1');
    group.setAttribute('aria-label', `Transition ${name} ${enabled ? 'activée' : 'désactivée'}`);

    const rect = document.createElementNS(svgNS, "rect");
    rect.setAttribute("x", x - 45);
    rect.setAttribute("y", y - 22);
    rect.setAttribute("width", 90);
    rect.setAttribute("height", 44);
    rect.setAttribute("rx", 12);
    rect.setAttribute("ry", 12);
    rect.setAttribute("fill", enabled ? "#28a745" : "#bbb");
    rect.setAttribute("stroke", "#333");
    rect.setAttribute("stroke-width", 2);
    group.appendChild(rect);

    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y + 8);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "16px");
    text.setAttribute("fill", enabled ? "#fff" : "#666");
    text.style.userSelect = "none";
    text.textContent = name;
    group.appendChild(text);

    if (enabled) {
        group.style.cursor = "pointer";
        group.addEventListener('click', () => fireTransition(name));
    }

    svg.appendChild(group);
    return group;
}

async function renderSVG() {
    const svg = document.getElementById('petri-svg');
    svg.innerHTML = "";

    petriStructure.places.forEach(p => {
        const tokens = currentState[p.name] ?? 0;
        const active = tokens > 0;
        drawCircle(svg, p.x, p.y, tokens, active, p.name);
    });

    for (const t of petriStructure.transitions) {
        const enabled = await isTransitionEnabled(t.name);
        drawRect(svg, t.x, t.y, t.name, enabled);
    }

    petriStructure.arcs.forEach(arc => {
        let fromPos = null;
        let toPos = null;

        const fromPlace = petriStructure.places.find(p => p.name === arc.from);
        const toPlace = petriStructure.places.find(p => p.name === arc.to);
        const fromTransition = petriStructure.transitions.find(t => t.name === arc.from);
        const toTransition = petriStructure.transitions.find(t => t.name === arc.to);

        if (fromPlace && toTransition) {
            fromPos = { x: fromPlace.x + 28, y: fromPlace.y };
            toPos = { x: toTransition.x - 45, y: toTransition.y };
        } else if (fromTransition && toPlace) {
            fromPos = { x: fromTransition.x + 45, y: fromTransition.y };
            toPos = { x: toPlace.x - 28, y: toPlace.y };
        } else if (fromPlace && toPlace) {
            fromPos = { x: fromPlace.x + 28, y: fromPlace.y };
            toPos = { x: toPlace.x - 28, y: toPlace.y };
        } else if (fromTransition && toTransition) {
            fromPos = { x: fromTransition.x + 45, y: fromTransition.y };
            toPos = { x: toTransition.x - 45, y: toTransition.y };
        }

        if (fromPos && toPos) {
            drawArrow(svg, fromPos.x, fromPos.y, toPos.x, toPos.y);
        }
    });
}

async function fireTransition(transition) {
    document.getElementById('status').textContent = `Exécution de ${transition}...`;

    try {
        const response = await fetch('/fire', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transition })
        });
        if (!response.ok) throw new Error('Erreur serveur');
        const data = await response.json();

        currentState = data.state;
        history = data.history || [];

        document.getElementById('status').textContent = data.result;

        await renderSVG();
        await renderPlaces();
        await renderTransitions();
        renderHistory();
    } catch (e) {
        document.getElementById('status').textContent = 'Erreur lors de l\'exécution';
        console.error(e);
    }
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    history.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        historyList.appendChild(li);
    });
}

async function init() {
    await renderSVG();
    await renderPlaces();
    await renderTransitions();
    renderHistory();
    document.getElementById('status').textContent = `Étage courant : ${currentState.CurrentFloor ?? 'N/A'}, Timer porte : ${currentState.DoorTimer ?? 0}`;
}

init();
