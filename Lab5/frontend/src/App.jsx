import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SensorCard from './components/SensorCard';
import LogPanel from './components/LogPanel';
import useSensorData from './hooks/useSensorData'; 
import { ChevronLeft, Moon, Sun, WifiOff } from 'lucide-react'; // Додали іконку WifiOff
import { Chart, registerables } from 'chart.js';
import graphLight from './assets/graphfordetails.svg';
import graphDark from './assets/graph-for-details-dark.svg';
Chart.register(...registerables);

function App() {
  const [appState, setAppState] = useState({
    isRunning: false,
    intervalMs: 2000,
    title: "Верстат CNC-01",
    logs: ["Інтерфейс завантажено. Очікування запуску."],
    formValues: { deviceName: '', interval: '' },
    isDark: false,
    currentPage: 'dashboard'
  });

  // 🔥 Витягуємо error з хука
  const { data: sensorData, error, resetScanner } = useSensorData(appState.isRunning, appState.intervalMs);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const formatTime = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  useEffect(() => {
    if (appState.currentPage !== 'dashboard') return;
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    const textColor = appState.isDark ? "#A59D9D" : "#52525B";
    const gridColor = appState.isDark ? "rgba(165, 157, 157, 0.2)" : "rgba(82, 82, 91, 0.2)";
    const lineColor = appState.isDark ? "#A59D9D" : "#7C3AED"; 
    const bgColor = appState.isDark ? "rgba(165, 157, 157, 0.2)" : "rgba(124, 58, 237, 0.2)";

    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        datasets: [{
          data: [120, 80, 110, 350, 950, 880, 220, 240, 520, 360],
          borderColor: lineColor,
          backgroundColor: bgColor,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: lineColor,
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
          const { ctx, width, height } = chart;
          const clipWidth = width * (sensorData.scannerPos / 100); 
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, clipWidth, height);
          ctx.clip();
        },
        afterDatasetsDraw(chart) { chart.ctx.restore(); }
      }]
    });
  }, [sensorData.scannerPos, appState.isDark, appState.currentPage]);

  // 🔥 Оновлена функція Start/Stop з POST-запитом
  const handleToggleSystem = async () => {
    const nextStatus = !appState.isRunning;
    if (nextStatus) resetScanner();
    
    setAppState(prev => ({
      ...prev,
      isRunning: nextStatus,
      logs: [`[${new Date().toLocaleTimeString()}] — ${nextStatus ? "Запуск системи" : "Система зупинена"}`, ...prev.logs]
    }));

    // Відправляємо на сервер новий статус
    try {
      await fetch('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRunning: nextStatus })
      });
    } catch (err) {
      console.error("Не вдалося відправити статус на сервер");
    }
  };

  // 🔥 Оновлена функція Save з POST-запитом
  const handleSave = async (e) => {
    e.preventDefault();
    const n = appState.formValues.deviceName;
    const i = appState.formValues.interval;

    if (i !== "" && (isNaN(i) || i <= 0)) {
      alert("Введіть коректний інтервал!");
      return;
    }

    const intervalVal = i !== "" ? Number(i) * 1000 : appState.intervalMs;
    const logMsg = i !== "" ? `Налаштування змінено (Інтервал: ${i} с)` : `Назва пристрою змінена`;

    setAppState(prev => ({
      ...prev,
      title: n !== "" ? n : prev.title,
      intervalMs: intervalVal,
      logs: [`[${new Date().toLocaleTimeString()}] — ${logMsg}`, ...prev.logs],
      formValues: { deviceName: '', interval: '' } 
    }));

    // Відправляємо на сервер нові налаштування
    try {
      await fetch('http://localhost:3000/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceName: n || undefined, intervalMs: intervalVal })
      });
    } catch (err) {
      console.error("Не вдалося відправити налаштування на сервер");
    }
  };

  const cardClasses = `border-2 rounded-xl p-6 shadow-sm transition-colors duration-300 ${
    appState.isDark ? 'bg-dt-dark border-dt-zinc text-dt-zinc' : 'bg-lt-white border-lt-zinc text-lt-zinc'
  }`;

  return (
    <div className={`h-screen w-full flex overflow-hidden m-0 p-0 transition-colors duration-300 ${appState.isDark ? 'bg-dt-dark text-dt-zinc' : 'bg-lt-frame text-lt-dark'}`}>
      <Sidebar isDark={appState.isDark} />
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* 🔥 Індикатор Connection Lost */}
        {error && (
          <div className="bg-red-500 text-white p-3 flex justify-center items-center gap-2 font-bold shadow-md animate-pulse">
            <WifiOff className="w-5 h-5" />
            {error} - Перевірте бекенд сервер!
          </div>
        )}

        <div className="flex items-center justify-between px-10 py-6">
          <div className="flex-1">
             {appState.currentPage === 'details' && (
              <button 
                onClick={() => setAppState(prev => ({ ...prev, currentPage: 'dashboard' }))}
                className={`flex items-center gap-2 font-medium transition-all group ${appState.isDark ? 'text-dt-zinc hover:text-white' : 'text-lt-zinc hover:text-lt-violet'}`}
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Назад
              </button>
            )}
          </div>
          <Header title={appState.currentPage === 'details' ? 'Детальна статистика' : appState.title} isDark={appState.isDark} />
          <div className="flex-1 flex justify-end">
             <button 
                onClick={() => setAppState(prev => ({ ...prev, isDark: !prev.isDark }))} 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                  appState.isDark ? 'text-dt-dark bg-dt-zinc hover:scale-105' : 'text-lt-violet bg-lt-zinc/10 hover:bg-lt-violet/10'
                }`}
             >
                {appState.isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                Mode
             </button>
          </div>
        </div>

        <main className="p-6 md:p-10 w-full max-w-[1400px] mx-auto flex-1">
          {appState.currentPage === 'dashboard' && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <SensorCard label="Швидкість шпинделя" value={sensorData.speed} unit="об/хв" isDark={appState.isDark} />
                
                <button 
                  onClick={() => setAppState(prev => ({ ...prev, currentPage: 'details' }))}
                  className={`text-left border-2 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${
                    appState.isDark ? 'bg-dt-dark border-dt-zinc text-dt-zinc hover:border-dt-zinc/50' : 'bg-lt-white border-lt-zinc text-lt-zinc hover:border-lt-violet'
                  }`}
                >
                   <h3 className="text-sm mb-2 font-medium">Хід виконання</h3>
                   <div className={`w-full h-2 mt-3 rounded overflow-hidden ${appState.isDark ? 'bg-dt-zinc/30' : 'bg-gray-300'}`}>
                      <div className={`h-2 transition-all duration-300 ${appState.isDark ? 'bg-dt-zinc' : 'bg-lt-violet'}`} style={{width: `${sensorData.progress}%`}}></div>
                   </div>
                </button>

                <SensorCard label="Час роботи" value={formatTime(sensorData.seconds)} unit="" isDark={appState.isDark} />

                <article className={cardClasses}>
                  <h3 className="text-sm mb-2 font-medium">Статус інструменту</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className={`w-4 h-4 rounded-full ${appState.isRunning ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <button 
                      onClick={handleToggleSystem}
                      className={`text-sm px-6 py-1 rounded-lg font-bold transition-all hover:opacity-90 ${appState.isDark ? 'bg-dt-violet text-dt-zinc' : 'bg-lt-violet text-white'}`}
                      disabled={!!error} // Блокуємо кнопку, якщо сервер лежить
                    >
                      {appState.isRunning ? "Stop" : "Start"}
                    </button>
                  </div>
                </article>
              </section>

              <section className={`p-8 md:p-12 rounded-2xl flex flex-col items-center shadow-lg mb-10 transition-colors duration-300 ${appState.isDark ? 'bg-dt-zinc' : 'bg-lt-zinc'}`}>
                <div className={`relative w-full max-w-4xl h-64 rounded-xl overflow-hidden p-4 transition-colors duration-300 ${appState.isDark ? 'bg-dt-dark' : 'bg-lt-frame'}`}>
                  <canvas ref={chartRef}></canvas>
                  <div 
                    className={`absolute top-0 bottom-0 w-1 ${appState.isDark ? 'bg-dt-white' : 'bg-lt-violet'} ${appState.isRunning && sensorData.scannerPos < 100 ? '' : 'hidden'}`}
                    style={{ left: `${sensorData.scannerPos}%`, boxShadow: appState.isDark ? '0 0 15px 2px #A59D9D' : '0 0 15px 2px #7C3AED', zIndex: 10 }}
                  ></div>
                </div>
                <h2 className={`font-bold text-xl mt-4 transition-colors duration-300 ${appState.isDark ? 'text-dt-violet' : 'text-lt-white'}`}>Візуалізація G-коду</h2>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <LogPanel logs={appState.logs} isDark={appState.isDark} />

                <div className={cardClasses}>
                  <h3 className={`font-bold text-lg mb-4 ${appState.isDark ? 'text-dt-violet' : 'text-lt-violet'}`}>Налаштування</h3>
                  <form onSubmit={handleSave} className="flex flex-col gap-3">
                    <input 
                      value={appState.formValues.deviceName}
                      onChange={(e) => setAppState(prev => ({ ...prev, formValues: { ...prev.formValues, deviceName: e.target.value } }))}
                      className={`border-2 p-2 px-4 rounded-md outline-none transition-colors duration-300 ${appState.isDark ? 'bg-dt-dark border-dt-zinc/50 text-dt-zinc focus:border-dt-zinc placeholder-dt-zinc/50' : 'bg-white border-gray-300 text-lt-dark focus:border-lt-violet placeholder-gray-400'}`}
                      placeholder="назва пристрою" 
                      disabled={!!error}
                    />
                    <input 
                      type="number"
                      value={appState.formValues.interval}
                      onChange={(e) => setAppState(prev => ({ ...prev, formValues: { ...prev.formValues, interval: e.target.value } }))}
                      className={`border-2 p-2 px-4 rounded-md outline-none transition-colors duration-300 ${appState.isDark ? 'bg-dt-dark border-dt-zinc/50 text-dt-zinc focus:border-dt-zinc placeholder-dt-zinc/50' : 'bg-white border-gray-300 text-lt-dark focus:border-lt-violet placeholder-gray-400'}`}
                      placeholder="1000" 
                      disabled={!!error}
                    />
                    <button type="submit" disabled={!!error} className={`font-bold py-2 mt-2 rounded-lg hover:opacity-90 uppercase tracking-wider transition-colors duration-300 ${appState.isDark ? 'bg-dt-violet text-dt-zinc' : 'bg-lt-violet text-white'} disabled:opacity-50`}>
                      Save
                    </button>
                  </form>
                </div>
              </section>
            </>
          )}

          {appState.currentPage === 'details' && (
            <>
              <section className={`p-8 md:p-12 rounded-2xl flex flex-col items-center shadow-lg mb-10 transition-colors duration-300 ${appState.isDark ? 'bg-dt-zinc' : 'bg-lt-zinc'}`}>
                <div className="relative w-full max-w-4xl mb-6 overflow-hidden rounded-xl">
                  <img 
                    src={appState.isDark ? graphDark : graphLight} 
                    alt="Графік детальний"
                    className="w-full h-auto object-contain opacity-100 transition-opacity duration-500"
                  />
                </div>
                <h2 className={`font-bold text-xl tracking-wide text-center transition-colors duration-300 ${appState.isDark ? 'text-dt-violet' : 'text-lt-white'}`}>
                    Хід роботи за останні 24 години
                </h2>
              </section>

              <section className="mb-10 w-full">
                <LogPanel logs={appState.logs} isDark={appState.isDark} />
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;