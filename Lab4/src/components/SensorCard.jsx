export default function SensorCard({ label, value, unit, isDark }) {
  return (
    <article className={`border-2 rounded-xl p-6 shadow-sm transition-colors duration-300 ${
      isDark 
      ? 'bg-dt-dark border-dt-zinc text-dt-zinc hover:border-dt-zinc/50 hover:shadow-lg' 
      : 'bg-lt-white border-lt-zinc text-lt-zinc hover:border-lt-violet hover:shadow-md'
    }`}>
      <h3 className="text-sm mb-2 font-medium">{label}</h3>
      <p className="text-2xl font-bold">
        {value} <span className="text-lg font-normal">{unit}</span>
      </p>
    </article>
  );
}