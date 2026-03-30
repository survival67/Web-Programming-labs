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


// ==========================================
// ГРАФІК 1: Швидкість шпинделя
// ==========================================
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


// ==========================================
// ГРАФІК 2: G-код (З ефектом поступової побудови)
// ==========================================
let cncChart;

function initCncChart() {
    const canvas = DOM.graph();
    if (!canvas || canvas.tagName !== "CANVAS") return; 

    const ctx = canvas.getContext("2d");
    const isDarkTheme = document.body.classList.contains("bg-brand-dark");
    
    const textColor = isDarkTheme ? "#A59D9D" : "#52525B";
    const gridColor = isDarkTheme ? "rgba(165, 157, 157, 0.2)" : "rgba(82, 82, 91, 0.2)";
    const lineColor = isDarkTheme ? "#A59D9D" : "#7C3AED"; 
    const pointBgColor = isDarkTheme ? "#A59D9D" : "#7C3AED";

    cncChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            datasets: [{
                label: 'Траєкторія',
                data: [120, 80, 110, 350, 950, 880, 220, 240, 520, 360],
                borderColor: lineColor,
                backgroundColor: "rgba(124, 58, 237, 0.2)",
                pointBackgroundColor: pointBgColor,
                pointBorderColor: lineColor,
                borderWidth: 2,
                pointRadius: 4,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: true, ticks: { color: textColor }, grid: { display: false } },
                y: { min: 0, max: 1000, ticks: { stepSize: 250, color: textColor }, grid: { color: gridColor } }
            }
        },
        plugins: [{
            id: 'scannerClip',
            beforeDatasetsDraw(chart) {
                const ctx = chart.ctx;
                const clipWidth = chart.width * (scannerPos / 100);
                
                ctx.save();
                ctx.beginPath();
                ctx.rect(0, 0, clipWidth, chart.height);
                ctx.clip();
            },
            afterDatasetsDraw(chart) {
                chart.ctx.restore();
            }
        }]
    });
}

// Анімація лазера та оновлення графіка
function animateGraphScanner() {
    const scanner = document.getElementById("graph-scanner");
    if (!scanner) return;

    scannerPos += 1.5;

    if (scannerPos >= 100) {
        scannerPos = 100; 
        clearInterval(timers.scan); 
        scanner.classList.add("hidden"); 
    }

    scanner.style.left = scannerPos + "%";

    if (cncChart) {
        cncChart.update('none'); 
    }
}


// ==========================================
// ОНОВЛЕННЯ ДАНИХ ТА UI
// ==========================================
function updateProgress() {
    state.progress = (state.progress + 2) % 100;
    const bar = DOM.progressBar();
    if (bar) bar.style.width = state.progress + "%";
    save();
}

function updateTime() {
    state.seconds++;
    const el = DOM.time();
    if (el) el.textContent = formatTime(state.seconds);
    save();
}

function applyUI() {
    if (DOM.title()) DOM.title().textContent = state.title;

    if (DOM.inpName() && state.title !== "Верстат CNC-01") DOM.inpName().value = state.title;
    if (DOM.inpInt() && state.interval !== 2000) DOM.inpInt().value = state.interval / 1000;

    if (DOM.progressBar()) DOM.progressBar().style.width = state.progress + "%";
    if (DOM.time()) DOM.time().textContent = formatTime(state.seconds);

    const btn = DOM.btn();
    if (btn) btn.textContent = state.isRunning ? "Stop" : "Start";

    const ind = DOM.indicator();
    if (ind) {
        ind.classList.toggle("bg-green-500", state.isRunning);
        ind.classList.toggle("bg-gray-400", !state.isRunning);
    }

    const txt = DOM.statusTxt();
    if (txt) txt.textContent = state.isRunning ? "В роботі" : "Зупинено";
}


// ==========================================
// ТАЙМЕРИ ТА КЕРУВАННЯ
// ==========================================
function startTimers() {
    stopTimers();

    scannerPos = 0; 
    if (cncChart) cncChart.update('none');

    const graphScanner = DOM.scanner();
    if (graphScanner) {
        graphScanner.classList.remove("hidden");
        graphScanner.style.left = "0%";
    }

    timers.speed = setInterval(updateSpeed, state.interval);
    timers.progress = setInterval(updateProgress, 1000);
    timers.time = setInterval(updateTime, 1000);
    timers.scan = setInterval(animateGraphScanner, 30);
}

function stopTimers() {
    Object.values(timers).forEach(clearInterval);

    scannerPos = 0;
    if (cncChart) cncChart.update('none');

    const graphScanner = DOM.scanner();
    if (graphScanner) graphScanner.classList.add("hidden");
}


// ==========================================
// ЖУРНАЛ ПОДІЙ
// ==========================================
function addLog(msg) {
    const list = DOM.logs();
    if (!list) return;

    const logText = `[${new Date().toLocaleTimeString()}] — ${msg}`;
    logsData.unshift(logText);
    if (logsData.length > 50) logsData.pop();
    save();

    const li = document.createElement("li");
    li.textContent = logText;
    list.prepend(li);
}

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


// ==========================================
// ІНІЦІАЛІЗАЦІЯ
// ==========================================
function init() {
    load();
    applyUI();
    renderLogs();
    
    initSpeedChart();
    initCncChart(); 

    const btn = DOM.btn();
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
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const n = DOM.inpName().value;
            const i = DOM.inpInt().value;

            if (i !== "" && (isNaN(i) || i <= 0)) {
                alert("Введіть коректний інтервал!");
                return;
            }

            if (n !== "") state.title = n;

            if (i !== "") {
                state.interval = Number(i) * 1000;
                if (state.isRunning) {
                    clearInterval(timers.speed);
                    timers.speed = setInterval(updateSpeed, state.interval);
                }
            }

            form.style.border = "2px solid #10B981";
            setTimeout(() => form.style.border = "none", 1500);

            if (i !== "") addLog(`Налаштування змінено (Інтервал: ${Number(i)} с)`);
            else addLog(`Назва пристрою змінена`);

            applyUI();
            save();
        });
    }

    if (state.isRunning) startTimers();

    if (logsData.length === 0) {
        addLog("Інтерфейс завантажено. Очікування запуску.");
    }
}

// запуск після завантаження сторінки
window.addEventListener("DOMContentLoaded", init);