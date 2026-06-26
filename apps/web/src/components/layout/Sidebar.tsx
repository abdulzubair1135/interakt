"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Compass, Bell, MessageSquare, User, Settings,
  PenSquare, LogOut, MessageCircle, ShieldAlert, Megaphone,
  Bookmark, Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../providers/AuthProvider';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSwitchToRight?: () => void;
}

const Sidebar = ({ isOpen, onClose, onSwitchToRight }: SidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('campushub_token');
    router.push('/login');
    if (onClose) onClose();
  };

  const navItems = [
    { icon: Home, label: 'Home', href: '/', emoji: '🏠' },
    { icon: Compass, label: 'Explore', href: '/explore', emoji: '🌎' },
    { icon: Megaphone, label: 'Notice', href: '/notifications', emoji: '📌' },
    { icon: MessageSquare, label: 'Chit-chat', href: '/messages', emoji: '💬' },
    { icon: User, label: 'Profile', href: '/profile', emoji: '👤' },
    { icon: Settings, label: 'Settings', href: '/settings', emoji: '⚙️' },
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 bottom-0 z-[80] w-[280px]
        bg-[#0a0a1a]/98 backdrop-blur-2xl
        border-r border-white/10
        transition-transform duration-300 ease-out
        overflow-y-auto overflow-x-hidden
        overscroll-contain
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Inner wrapper with padding — scrolls independently */}
      <div className="flex flex-col min-h-screen p-5 pt-[4.5rem] lg:pt-5">

        {/* Mobile segmented tabs to transition between Menu and Trends/Search */}
        <div className="lg:hidden flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5 shrink-0">
          <button
            type="button"
            className="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white shadow-md"
          >
            🧭 Menu
          </button>
          <button
            type="button"
            onClick={() => {
              if (onSwitchToRight) onSwitchToRight();
            }}
            className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-gray-400 hover:text-white"
          >
            🔥 Trends
          </button>
        </div>

        {/* Logo */}
        <div className="mb-6 flex-shrink-0">
          <Link href="/" onClick={onClose}>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all overflow-hidden">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white leading-none">Interakt</h1>
                <span className="text-[var(--accent-purple)] text-[9px] font-bold tracking-wider">by project x²</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item, index) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/10 border border-purple-500/25 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                      : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                  )}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-purple-500/20' : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    <item.icon className={`w-5 h-5 transition-colors duration-200 ${
                       isActive ? 'text-[var(--accent-purple)]' : 'text-gray-400 group-hover:text-purple-300'
                    }`} />
                  </div>
                  <span className={`font-semibold transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            );
          })}

          {user?.role === 'admin' && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <Link
                href="/admin"
                onClick={onClose}
                className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
                  pathname === '/admin'
                    ? 'bg-red-500/10 border border-red-500/25'
                    : 'hover:bg-red-500/5 border border-transparent hover:border-red-500/10'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  pathname === '/admin' ? 'bg-red-500/15' : 'bg-white/5 group-hover:bg-red-500/10'
                }`}>
                  <ShieldAlert className={`w-5 h-5 ${pathname === '/admin' ? 'text-red-400' : 'text-red-500/60 group-hover:text-red-400'}`} />
                </div>
                <span className={`font-semibold ${pathname === '/admin' ? 'text-red-300' : 'text-red-300/60 group-hover:text-red-300'}`}>
                  God Mode
                </span>
              </Link>
            </motion.div>
          )}
        </nav>

        {/* Bottom section */}
        <motion.div
          className="mt-auto pt-5 space-y-3 border-t border-white/5 flex-shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* Create Post Button */}
          <button
            onClick={() => {
              if (onClose) onClose();
              if (pathname !== '/') {
                router.push('/');
                setTimeout(() => {
                  const el = document.getElementById('post-input');
                  el?.focus();
                  el?.scrollIntoView({ behavior: 'smooth' });
                }, 500);
              } else {
                const el = document.getElementById('post-input');
                el?.focus();
                el?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <PenSquare className="w-5 h-5" />
            <span>Create Post</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-gray-500 hover:bg-red-500/5 hover:text-red-400 transition-all border border-transparent hover:border-red-500/10 text-sm mb-4"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </motion.div>
      </div>
    </aside>
  );
};

export default Sidebar;
