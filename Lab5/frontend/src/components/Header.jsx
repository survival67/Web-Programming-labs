export default function Header({ title, isDark }) {
  return (
    <header className="flex items-center justify-center p-6 shrink-0">
      <h1 className={`text-2xl md:text-3xl font-bold border-2 px-12 py-2 rounded-xl text-center shadow-sm uppercase tracking-widest transition-colors duration-300 ${
        isDark ? 'text-dt-zinc border-dt-zinc bg-dt-dark' : 'text-lt-violet border-lt-zinc bg-lt-white'
      }`}>
        {title}
      </h1>
    </header>
  );
}