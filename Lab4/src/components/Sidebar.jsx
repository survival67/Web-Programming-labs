import React, { useState } from 'react';
import { Search, Home, Settings, LogOut } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';

export default function Sidebar({ isDark }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <aside className={`w-64 hidden md:flex flex-col h-full shrink-0 shadow-lg z-10 transition-colors duration-300 ${
        isDark ? 'bg-dt-zinc text-dt-violet' : 'bg-lt-zinc text-lt-white'
      }`}>
        <div className="p-6 flex items-center gap-3">
          {/* Використовуємо іконку лупи */}
          <Search className={`w-7 h-7 ${isDark ? 'text-dt-dark' : 'text-lt-white'}`} />
          <span className={`text-xl font-bold tracking-wide ${isDark ? 'text-dt-dark' : ''}`}>
            CNC Controller
          </span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2 text-left">
          <div className={`flex items-center gap-3 p-3 rounded-lg font-bold cursor-pointer transition-colors ${
            isDark ? 'text-dt-violet bg-dt-dark/10' : 'bg-white/10 text-lt-white'
          }`}>
            <Home className="w-5 h-5" />
            <span>Головна</span>
          </div>

          <div className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-all ${
            isDark ? 'text-dt-violet hover:bg-dt-dark/10' : 'text-gray-300 hover:text-lt-white hover:bg-white/5'
          }`}>
            <Settings className="w-5 h-5" />
            <span className="font-medium">Налаштування</span>
          </div>

          <div 
            onClick={() => setIsOpen(true)}
            className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-all ${
              isDark ? 'text-dt-violet hover:bg-dt-dark/10' : 'text-gray-300 hover:text-lt-white hover:bg-white/5'
            }`}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Вихід</span>
          </div>
        </nav>
      </aside>

      {/* МОДАЛЬНЕ ВІКНО */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />

        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className={`w-full max-w-sm rounded-2xl p-6 shadow-xl transition-all ${
            isDark ? 'bg-dt-dark text-dt-zinc border border-dt-zinc/50' : 'bg-lt-white text-lt-dark'
          }`}>
            <DialogTitle className={`text-lg font-bold ${isDark ? 'text-dt-violet' : 'text-lt-violet'}`}>
              Підтвердження виходу
            </DialogTitle>
            <p className="mt-2 text-sm opacity-80">
              Ви дійсно хочете вийти з панелі керування верстатом? Всі незбережені налаштування можуть бути втрачені.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsOpen(false)} 
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isDark ? 'hover:bg-dt-zinc/20' : 'hover:bg-gray-100'
                }`}
              >
                Скасувати
              </button>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  alert("Вихід виконано успішно!");
                }} 
                className={`px-4 py-2 rounded-lg font-bold transition-all text-white ${
                  isDark ? 'bg-dt-violet hover:opacity-80' : 'bg-lt-violet hover:opacity-90'
                }`}
              >
                Вийти
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}