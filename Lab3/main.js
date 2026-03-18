// Джерело даних
let state = {
    isRunning: false,      // чи працює система
    interval: 2000,        // інтервал оновлення швидкості
    seconds: 15150,        // час роботи
    progress: 10,          // прогрес
    title: "Верстат CNC-01"
};

let logsData = []; // масив для збереження логів

let timers = {};
let scannerIntervalId = null; 
let scannerPos = 0;
let scannerDirection = 1;

// Елементи DOM
const DOM = {
    speed: () => document.querySelector("#speedValue, #val-speed"),
    progressBar: () => document.querySelector("#progressBar, #progress-bar"),
    time: () => document.querySelector("#val-time"),
    btn: () => document.querySelector("#startBtn, #btn-power"),
    indicator: () => document.querySelector("#statusIndicator"),
    statusTxt: () => document.querySelector("#val-status"),
    title: () => document.querySelector("#mainTitle, #main-title"),
    form: () => document.querySelector("#settingsForm, #settings-form"),
    inpName: () => document.querySelector("#deviceName, #input-name"),
    inpInt: () => document.querySelector("#interval"),
    logs: () => document.querySelector("#logs, #log-list"),
    graph: () => document.querySelector("#cnc-graph"),
    scanner: () => document.querySelector("#graph-scanner"),
    speedChartEl: () => document.querySelector("#speedChart")
};

// збереження стану і логів
function save() {
    localStorage.setItem("cnc_state", JSON.stringify(state));
    localStorage.setItem("cnc_logs", JSON.stringify(logsData));
}

// завантаження стану і логів
function load() {
    const data = JSON.parse(localStorage.getItem("cnc_state") || "{}");
    const logs = JSON.parse(localStorage.getItem("cnc_logs") || "[]");

    state = { ...state, ...data };
    logsData = logs;
}

// Формування часу
function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// Графік (Chart.js)
let speedChart;
const speedData = {
    labels: [],
    datasets: [{
        label: "Швидкість шпинделя",
        data: [],
        borderColor: "#7C3AED",
        backgroundColor: "rgba(124, 58, 237, 0.2)",
        tension: 0.3
    }]
};

// створення графіка
function initSpeedChart() {
    const ctx = DOM.speedChartEl()?.getContext("2d");
    if (!ctx) return;

    speedChart = new Chart(ctx, {
        type: "line",
        data: speedData,
        options: {
            responsive: true,
            animation: { duration: 0 },
            scales: {
                x: { display: false },
                y: { min: 11500, max: 12200 }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Функція руху лазера по графіку
function animateGraphScanner() {
    const scanner = document.getElementById("graph-scanner");
    if (!scanner) return; // Захист, якщо на сторінці немає графіка

    scannerPos += 1.5 * scannerDirection; // Швидкість
    
    // Якщо дійшов до краю (100% або 0%), розвертаємося
    if (scannerPos >= 100 || scannerPos <= 0) {
        scannerDirection *= -1; 
    }
    
    // Оновлюємо позицію через CSS
    scanner.style.left = scannerPos + "%";
}

// генерація випадкової швидкості
function updateSpeed() {
    const value = Math.floor(11800 + Math.random() * 400);

    const el = DOM.speed();
    if (el) el.textContent = value;

    if (speedChart) {
        const now = new Date().toLocaleTimeString();
        speedData.labels.push(now);
        speedData.datasets[0].data.push(value);

        if (speedData.labels.length > 2) {
            speedData.labels.shift();
            speedData.datasets[0].data.shift();
        }

        speedChart.update();
    }
}

// оновлення прогрес-бару
function updateProgress() {
    state.progress = (state.progress + 2) % 100;

    const bar = DOM.progressBar();
    if (bar) bar.style.width = state.progress + "%";

    save();
}

// оновлення часу роботи
function updateTime() {
    state.seconds++;

    const el = DOM.time();
    if (el) el.textContent = formatTime(state.seconds);

    save();
}

// анімація сканера
function animateScanner() {
    scannerPos += 1.5 * scannerDirection;
    if (scannerPos >= 100 || scannerPos <= 0) scannerDirection *= -1;

    const el = DOM.scanner();
    if (el) el.style.left = scannerPos + "%";
}

// Оновлення інтерфейсу
function applyUI() {
    if (DOM.title()) DOM.title().textContent = state.title;

    if (DOM.progressBar()) {
        DOM.progressBar().style.width = state.progress + "%";
    }

    if (DOM.time()) {
        DOM.time().textContent = formatTime(state.seconds);
    }

    const btn = DOM.btn();
    if (btn) {
        btn.textContent = state.isRunning ? "Stop" : "Start";
        
    }

    const ind = DOM.indicator();
    if (ind) {
        ind.classList.toggle("bg-green-500", state.isRunning);
        ind.classList.toggle("bg-gray-400", !state.isRunning);
    }

    const txt = DOM.statusTxt();
    if (txt) {
        txt.textContent = state.isRunning ? "В роботі" : "Зупинено";
    }
}

// запуск таймерів
function startTimers() {
    stopTimers();

    timers.speed = setInterval(updateSpeed, state.interval);
    timers.progress = setInterval(updateProgress, 1000);
    timers.time = setInterval(updateTime, 1000);
    timers.scan = setInterval(animateScanner, 30); // Це вже є

    const graphImg = DOM.graph();
    const graphScanner = DOM.scanner();
    if (graphImg) graphImg.classList.replace("opacity-50", "opacity-100");
    if (graphScanner) graphScanner.classList.remove("hidden");
}

// зупинка таймерів
function stopTimers() {
    Object.values(timers).forEach(clearInterval);

    const graphImg = DOM.graph();
    const graphScanner = DOM.scanner();
    if (graphImg) graphImg.classList.replace("opacity-100", "opacity-50");
    if (graphScanner) graphScanner.classList.add("hidden");
}

// додавання нового запису в лог
function addLog(msg) {
    const list = DOM.logs();
    if (!list) return;

    const logText = `[${new Date().toLocaleTimeString()}] — ${msg}`;

    logsData.unshift(logText); // додаємо в масив
    save();

    const li = document.createElement("li");
    li.textContent = logText;
    list.prepend(li);
}

// відновлення логів після перезавантаження
function renderLogs() {
    const list = DOM.logs();
    if (!list) return;

    list.innerHTML = "";

    logsData.forEach(log => {
        const li = document.createElement("li");
        li.textContent = log;
        list.appendChild(li);
    });
}

// Ініціалізація
function init() {
    load();
    applyUI();
    renderLogs();
    initSpeedChart();

    const btn = DOM.btn();

    // обробка кнопки старт/стоп
    if (btn) {
        btn.addEventListener("click", () => {
            state.isRunning = !state.isRunning;

            if (state.isRunning) {
                addLog("Запуск системи");
                startTimers();
            } else {
                addLog("Система зупинена");
                stopTimers();
            }

            applyUI();
            save();
        });
    }

    const form = DOM.form();

    // обробка форми налаштувань
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const n = DOM.inpName().value;
            const i = DOM.inpInt().value;

            // валідація інтервалу
            if (i !== "" && (isNaN(i) || i <= 0)) {
                alert("Введіть коректний інтервал!");
                return;
            }

            if (n !== "") state.title = n;

            if (i !== "") {
                state.interval = Number(i);

                if (state.isRunning) {
                    clearInterval(timers.speed);
                    timers.speed = setInterval(updateSpeed, state.interval);
                }
            }

            // візуальне підтвердження
            form.style.border = "2px solid green";
            setTimeout(() => form.style.border = "", 1500);

            addLog(`Налаштування змінено (Інтервал: ${state.interval} мс)`);

            applyUI();
            save();
        });
    }

    if (state.isRunning) startTimers();

    // лог при першому запуску
    if (logsData.length === 0) {
        addLog("Інтерфейс завантажено. Очікування запуску.");
    }
}

// запуск після завантаження сторінки
window.addEventListener("DOMContentLoaded", init);