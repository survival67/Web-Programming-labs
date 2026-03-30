export default function LogPanel({ logs, isDark }) {
  const cardClasses = `border-2 rounded-xl p-6 shadow-sm transition-colors duration-300 ${
    isDark ? 'bg-dt-dark border-dt-zinc text-dt-zinc' : 'bg-lt-white border-lt-zinc text-lt-zinc'
  }`;

  return (
    <div className={cardClasses}>
      <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-dt-violet' : 'text-lt-violet'}`}>
        Журнал подій
      </h3>
      <ul className="text-sm space-y-2 h-32 overflow-y-auto font-mono">
        {logs.map((log, i) => <li key={i}>{log}</li>)}
      </ul>
    </div>
  );
}