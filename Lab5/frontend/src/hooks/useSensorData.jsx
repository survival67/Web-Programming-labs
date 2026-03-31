import { useState, useEffect } from 'react';

export default function useSensorData(isRunning, interval) {
  // Стан віртуальних датчиків
  const [data, setData] = useState({
    speed: 0, // Тепер ми не пишемо тут число, бо чекаємо його з сервера
    seconds: 15150,
    progress: 10,
    scannerPos: 0
  });
  
  // НОВЕ: Стан для відслідковування зв'язку з сервером
  const [error, setError] = useState(null);

  useEffect(() => {
    let dataTimer, scannerTimer, fetchTimer;

    // 🔥 1. ЗАПИТ НА СЕРВЕР (Fetch API) - Працює завжди, щоб моніторити статус
    fetchTimer = setInterval(async () => {
      try {
        // Стукаємо на наш бекенд
        const response = await fetch('http://localhost:3000/api/status');
        if (!response.ok) throw new Error("Сервер повернув помилку");
        
        const serverData = await response.json();

        // Оновлюємо нашу швидкість реальними даними з бекенду!
        setData(prev => ({
          ...prev,
          speed: serverData.speed
        }));
        
        // Якщо все добре, прибираємо повідомлення про помилку
        setError(null); 
      } catch (err) {
        console.error("Помилка з'єднання:", err);
        // Якщо сервер впав або не запущений — встановлюємо статус помилки
        setError("Connection Lost");
      }
    }, 1000); // Опитуємо сервер кожну секунду

    // 2. Анімації UI (час, лазер) залишаємо локальними, бо це просто візуал
    if (isRunning) {
      dataTimer = setInterval(() => {
        setData(prev => ({
          ...prev,
          seconds: prev.seconds + 1,
          progress: (prev.progress + 2) % 100
        }));
      }, 1000);

      scannerTimer = setInterval(() => {
        setData(prev => {
          const nextPos = prev.scannerPos + 1.5;
          if (nextPos >= 100) {
            clearInterval(scannerTimer);
            return { ...prev, scannerPos: 100 };
          }
          return { ...prev, scannerPos: nextPos };
        });
      }, 30);
    }

    // Cleanup: очищення всіх таймерів
    return () => {
      clearInterval(fetchTimer);
      clearInterval(dataTimer);
      clearInterval(scannerTimer);
    };
  }, [isRunning, interval]);

  const resetScanner = () => setData(prev => ({ ...prev, scannerPos: 0 }));

  // Тепер хук повертає ще й статус помилки (error)
  return { data, error, resetScanner };
}