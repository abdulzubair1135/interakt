"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Compass, PlusSquare, MessageSquare, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: Home, href: '/', label: 'Home' },
    { icon: Compass, href: '/explore', label: 'Explore' },
  ];

  const rightNavItems = [
    { icon: MessageSquare, href: '/messages', label: 'Chat' },
    { icon: User, href: '/profile', label: 'Profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-xl border-t border-white/10 z-[55] px-4 py-3 pb-[env(safe-area-inset-bottom,12px)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-0.5 p-1.5 min-w-[48px]">
              <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-[var(--accent-purple)] scale-110' : 'text-gray-500 hover:text-white'}`} />
              <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-[var(--accent-purple)]' : 'text-gray-500'}`}>{item.label}</span>
              {isActive && (
                <motion.div layoutId="bottomNavDot" className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent-purple)]" />
              )}
            </Link>
          );
        })}

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
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
          className="p-3 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] rounded-2xl text-white transform -translate-y-5 shadow-lg shadow-purple-500/30 god-glow"
        >
          <PlusSquare className="w-5 h-5" />
        </motion.button>

        {rightNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-0.5 p-1.5 min-w-[48px]">
              <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'text-[var(--accent-purple)] scale-110' : 'text-gray-500 hover:text-white'}`} />
              <span className={`text-[9px] font-medium transition-colors ${isActive ? 'text-[var(--accent-purple)]' : 'text-gray-500'}`}>{item.label}</span>
              {isActive && (
                <motion.div layoutId="bottomNavDot" className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent-purple)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
