import { useState, useEffect } from 'react';

export default function useSensorData(isRunning, interval) {
  // Стан віртуальних датчиків
  const [data, setData] = useState({
    speed: 12000,
    seconds: 15150,
    progress: 10,
    scannerPos: 0
  });

  useEffect(() => {
    let dataTimer, speedTimer, scannerTimer;

    if (isRunning) {
      // 1. Таймер часу та прогресу
      dataTimer = setInterval(() => {
        setData(prev => ({
          ...prev,
          seconds: prev.seconds + 1,
          progress: (prev.progress + 2) % 100
        }));
      }, 1000);

      // 2. Таймер швидкості
      speedTimer = setInterval(() => {
        setData(prev => ({
          ...prev,
          speed: 11800 + Math.floor(Math.random() * 400)
        }));
      }, interval);

      // 3. Таймер лазера
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

    // Cleanup: очищення таймерів
    return () => {
      clearInterval(dataTimer);
      clearInterval(speedTimer);
      clearInterval(scannerTimer);
    };
  }, [isRunning, interval]);

  // Функція для скидання лазера при новому старті
  const resetScanner = () => setData(prev => ({ ...prev, scannerPos: 0 }));

  return { data, resetScanner };
}