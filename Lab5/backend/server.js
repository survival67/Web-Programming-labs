const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Дозволяємо запити з інших портів (від нашого React)
app.use(express.json()); // Щоб сервер розумів формат JSON при POST-запитах

// Наш стан системи (те, що раніше було в хуку React)
let systemState = {
    isRunning: false,
    speed: 12000,
    temperature: 45,
    intervalMs: 2000,
    deviceName: "Верстат CNC-01"
};

// Емуляція даних (як в методичці: кожні 5 секунд змінюємо значення)
setInterval(() => {
    if (systemState.isRunning) {
        systemState.speed = 11800 + Math.floor(Math.random() * 400);
        systemState.temperature = 40 + Math.floor(Math.random() * 20); // випадкова температура 40-60
        console.log(`[Оновлення датчиків] Швидкість: ${systemState.speed}, Темп: ${systemState.temperature}`);
    }
}, 5000);

// Ендпоїнт GET: Віддаємо поточний стан (для Frontend)
app.get('/api/status', (req, res) => {
    res.json(systemState);
});

// Ендпоїнт POST: Приймаємо налаштування (від Frontend)
app.post('/api/settings', (req, res) => {
    const { deviceName, intervalMs, isRunning } = req.body;
    
    // Оновлюємо змінні, якщо вони прийшли в запиті
    if (deviceName !== undefined) systemState.deviceName = deviceName;
    if (intervalMs !== undefined) systemState.intervalMs = intervalMs;
    if (isRunning !== undefined) systemState.isRunning = isRunning;

    console.log('[Налаштування оновлено]:', req.body);
    
    res.json({ message: "Налаштування успішно збережено!", state: systemState });
});

// Запускаємо сервер
app.listen(PORT, () => {
    console.log(`🚀 Backend сервер запущено на http://localhost:${PORT}`);
});