"use client";

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('campushub_theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('campushub_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <button 
      onClick={toggleTheme}
      className="w-full py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors border border-transparent"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-5 h-5 text-yellow-400" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="w-5 h-5 text-indigo-400" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}
