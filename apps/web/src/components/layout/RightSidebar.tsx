"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { TrendingUp, Crown, ExternalLink, Sparkles, Zap, Trophy } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

const SPONSORED_ADS = [
  {
    id: 1,
    title: "🎵 Spotify Premium — 50% Off",
    desc: "Exclusive student deal. Study smarter with ad-free music.",
    gradient: "from-green-500 to-emerald-700",
    icon: "🎵",
    url: "https://spotify.com/student",
    cta: "Claim Offer"
  },
  {
    id: 2,
    title: "📚 Coursera — Free for Students",
    desc: "Learn from top universities. 7,000+ courses free with your .edu email.",
    gradient: "from-blue-500 to-indigo-700",
    icon: "📚",
    url: "https://coursera.org",
    cta: "Start Learning"
  },
  {
    id: 3,
    title: "💻 GitHub Copilot — Free",
    desc: "AI pair programmer for students. Code faster with AI assistance.",
    gradient: "from-slate-600 to-gray-800",
    icon: "💻",
    url: "https://education.github.com",
    cta: "Get Free Access"
  },
];

interface RightSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSwitchToLeft?: () => void;
}

const RightSidebar = ({ isOpen, onClose, onSwitchToLeft }: RightSidebarProps) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [trendingUsers, setTrendingUsers] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 1) {
        searchAll();
      } else {
        setResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  useEffect(() => {
    fetchTrendingUsers();
    const adTimer = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % SPONSORED_ADS.length);
    }, 8000);
    return () => clearInterval(adTimer);
  }, []);

  // Handle PWA Installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Fallback for browsers that don't support PWA prompt or if already installed
      alert('To install the app on Android: Tap the 3 dots menu in Chrome and select "Add to Home screen" or "Install app".');
    }
  };

  const fetchTrendingUsers = async () => {
    try {
      const res = await axios.get('https://interakt-api.onrender.com/api/auth/trending');
      setTrendingUsers(res.data.data);
    } catch (err) {
      setTrendingUsers([
        { _id: '1', username: 'alex_dev', avatar: '😎', followers: [] },
        { _id: '2', username: 'sara_codes', avatar: '👩‍💻', followers: [] },
        { _id: '3', username: 'max_study', avatar: '🎓', followers: [] },
      ]);
    }
  };

  const searchAll = async () => {
    try {
      setSearchLoading(true);
      const [usersRes, postsRes] = await Promise.all([
        axios.get(`https://interakt-api.onrender.com/api/auth/search?q=${query}`),
        axios.get(`https://interakt-api.onrender.com/api/posts/search?q=${query}`),
      ]);
      const users = usersRes.data.data.map((u: any) => ({ ...u, _type: 'user' }));
      const posts = postsRes.data.data.slice(0, 3).map((p: any) => ({ ...p, _type: 'post' }));
      setResults([...users, ...posts]);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const currentAd = SPONSORED_ADS[currentAdIndex];
  const trophyColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

  return (
    <aside
      className={`
        fixed top-0 right-0 bottom-0 z-[80] w-[300px]
        bg-[#0a0a1a]/98 backdrop-blur-2xl
        border-l border-white/10
        transition-transform duration-300 ease-out
        overflow-y-auto overflow-x-hidden
        overscroll-contain
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Inner wrapper — scrollable content */}
      <div className="flex flex-col min-h-screen p-5 pt-[4.5rem] lg:pt-5 pb-8 space-y-5">

        {/* Mobile segmented tabs to transition between Menu and Trends/Search */}
        <div className="lg:hidden flex bg-white/5 p-1 rounded-xl mb-1 border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onSwitchToLeft) onSwitchToLeft();
            }}
            className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 text-gray-400 hover:text-white"
          >
            🧭 Menu
          </button>
          <button
            type="button"
            className="flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white shadow-md"
          >
            🔥 Trends
          </button>
        </div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Search users & posts..."
              className="w-full relative bg-black/40 backdrop-blur-md border border-white/10 rounded-full py-3 px-5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)] transition-all"
            />

            <AnimatePresence>
              {(results.length > 0 || searchLoading) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-full mt-2 bg-[#111127] rounded-2xl border border-white/10 shadow-2xl max-h-72 overflow-y-auto z-[90]"
                >
                  {searchLoading ? (
                    <div className="p-4 text-center text-sm text-gray-400">Searching...</div>
                  ) : (
                    results.map((item) => (
                      item._type === 'user' ? (
                        <Link 
                          href={`/profile/${item._id}`} 
                          key={item._id} 
                          onClick={() => { setQuery(''); if (onClose) onClose(); }}
                        >
                          <div className="flex items-center space-x-3 p-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 cursor-pointer">
                            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-lg overflow-hidden ring-1 ring-white/10">
                              {item.avatar?.startsWith('http')
                                ? <img src={item.avatar} className="w-full h-full object-cover" />
                                : <span>{item.avatar || '😀'}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">@{item.username}</p>
                              <p className="text-xs text-gray-400">{item.followers?.length || 0} followers</p>
                            </div>
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">User</span>
                          </div>
                        </Link>
                      ) : (
                        <Link 
                          href={`/posts/${item._id}`} 
                          key={item._id} 
                          onClick={() => { setQuery(''); if (onClose) onClose(); }}
                        >
                          <div className="flex items-center space-x-3 p-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 cursor-pointer">
                            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
                              <span className="text-lg">📝</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{item.text?.slice(0, 35)}...</p>
                              <p className="text-xs text-gray-400">by @{item.user?.username}</p>
                            </div>
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Post</span>
                          </div>
                        </Link>
                      )
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Download App Panel */}
        <motion.div
          className="rounded-2xl p-5 relative overflow-hidden group border border-purple-500/30 bg-white/[0.03]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--accent-purple)] to-[var(--accent-pink)] p-[2px] mb-3 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center text-xl font-bold text-white">IX</div>
            </div>
            <h2 className="text-base font-bold text-white mb-1">Interakt App</h2>
            <p className="text-xs text-gray-400 mb-3">Experience god-level UI on your Android device.</p>
            <button
              onClick={handleInstallClick}
              className="w-full py-2.5 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors text-sm"
            >
              <Zap className="w-4 h-4" />
              Install App
            </button>
          </div>
        </motion.div>

        {/* Trending Users */}
        <motion.div
          className="rounded-2xl p-5 bg-white/[0.03] border border-white/10 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-shadow duration-500"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[var(--accent-purple)]" />
            <h2 className="text-base font-bold text-white">Trending Users</h2>
          </div>
          <div className="space-y-3">
            {trendingUsers.length > 0 ? trendingUsers.map((u, i) => {
              const avatarIsUrl = u.avatar?.startsWith('http');
              return (
                <motion.div
                  key={u._id}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Link href={`/profile/${u._id}`} onClick={onClose} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-purple-500/40 transition-all">
                        {avatarIsUrl
                          ? <img src={u.avatar} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">{u.avatar || '😀'}</div>}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black flex items-center justify-center`}>
                        <Trophy className={`w-3 h-3 ${trophyColors[i]}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-white truncate group-hover:text-[var(--accent-purple)] transition-colors">@{u.username}</p>
                      <p className="text-xs text-gray-400">{Array.isArray(u.followers) ? u.followers.length : u.followers || 0} followers</p>
                    </div>
                    <span className={`text-xs font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-600'}`}>
                      #{i + 1}
                    </span>
                  </Link>
                </motion.div>
              );
            }) : (
              <p className="text-gray-500 text-sm text-center py-2">Loading trending users...</p>
            )}
          </div>
        </motion.div>

        {/* Sponsored Ad — Rotating */}
        {!user?.isPremium && (
          <AnimatePresence mode="wait">
            <motion.a
              key={currentAd.id}
              href={currentAd.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl p-5 relative overflow-hidden group cursor-pointer hover:border-purple-500/40 transition-all duration-500 border border-white/10 bg-white/[0.03]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-md text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded z-10 border border-white/10">
                <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                <span className="text-white">Sponsored</span>
              </div>
              <div className={`w-full h-24 bg-gradient-to-r ${currentAd.gradient} rounded-xl mb-3 overflow-hidden relative flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-500`}>
                <span className="text-5xl filter drop-shadow-lg">{currentAd.icon}</span>
              </div>
              <h3 className="font-bold text-sm mb-1 text-white group-hover:text-[var(--accent-purple)] transition-colors">{currentAd.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">{currentAd.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 px-3 py-1.5 rounded-full font-semibold border border-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                  {currentAd.cta} →
                </span>
                <div className="flex gap-1">
                  {SPONSORED_ADS.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentAdIndex ? 'bg-purple-400 w-3' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>
            </motion.a>
          </AnimatePresence>
        )}

        {/* Quick Tags */}
        <motion.div
          className="rounded-2xl p-5 bg-white/[0.03] border border-white/10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Trending Tags</h2>
          <div className="flex flex-wrap gap-2">
            {['#funny', '#study', '#memes', '#exam', '#events', '#confession', '#clubs'].map(tag => (
              <Link key={tag} href={`/explore?tag=${tag.slice(1)}`} onClick={onClose}>
                <span className="text-xs px-3 py-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors border border-white/10 cursor-pointer bg-white/[0.03]">
                  {tag}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </aside>
  );
};

export default RightSidebar;
