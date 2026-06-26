"use client";

import { Settings as SettingsIcon, Shield, Moon, Bell, Lock, Sun, ChevronRight, X, User as UserIcon, EyeOff, ShieldCheck, Key, Loader2, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Password change state
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setIsDarkMode(savedTheme === 'dark');
    document.documentElement.setAttribute('data-theme', savedTheme);
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('campushub_token');
      if (!token) return;
      const res = await axios.get('https://interakt-api.onrender.com/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.data);
      setIsPrivate(res.data.data.isPrivate);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('campushub_token');
    router.push('/login');
  };

  const handleTogglePrivate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('campushub_token');
      const res = await axios.put('https://interakt-api.onrender.com/api/auth/toggleprivate', { isPrivate: !isPrivate }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsPrivate(res.data.isPrivate);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    
    if (passwords.new !== passwords.confirm) {
      return setPassError('New passwords do not match');
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('campushub_token');
      await axios.put('https://interakt-api.onrender.com/api/auth/changepassword', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPassSuccess('Password changed successfully!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err: any) {
      setPassError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass max-w-md w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto w-full pt-12 px-4 md:px-6">
      <div className="flex items-center space-x-4 mb-8">
        <SettingsIcon className="w-8 h-8 text-[var(--accent-purple)]" />
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
      </div>
      
      <div className="space-y-6 pb-20">
        {/* Account Section */}
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h2 className="font-bold text-white">Account Settings</h2>
          </div>
          
          <div 
            onClick={() => setActiveModal('privacy')}
            className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 text-white"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <span>Privacy & Safety</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>

          <div 
            onClick={() => setActiveModal('security')}
            className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 text-white"
          >
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-gray-400" />
              <span>Security & Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>

          <div 
            onClick={() => setActiveModal('notifications')}
            className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors text-white"
          >
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <span>Notification Preferences</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
        </div>

        {/* Premium Exclusive Features */}
        {user?.isPremium && (
          <div className="glass rounded-2xl overflow-hidden border border-yellow-500/30 mb-6 bg-gradient-to-b from-yellow-900/10 to-transparent shadow-[0_0_20px_rgba(234,179,8,0.05)]">
            <div className="p-4 border-b border-yellow-500/10 flex items-center justify-between bg-black/20">
              <h2 className="font-bold text-yellow-400 flex items-center gap-2"><Crown className="w-4 h-4" /> VIP Settings</h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-yellow-500/70">PRO</span>
            </div>
            
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-yellow-500/10">
              <div>
                <p className="font-bold text-white flex items-center gap-2">Ghost Mode (Stealth)</p>
                <p className="text-xs text-gray-400 mt-1">Hide your online status and last seen from others.</p>
              </div>
              <div className="mt-3 sm:mt-0 w-12 h-6 rounded-full relative transition-colors duration-300 bg-gray-600 cursor-pointer border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                <div className="absolute top-1 w-4 h-4 bg-yellow-400 rounded-full transition-all duration-300 left-1"></div>
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-yellow-500/10">
              <div>
                <p className="font-bold text-white flex items-center gap-2">Premium Royal Theme</p>
                <p className="text-xs text-gray-400 mt-1">Switch app styling to Royal Obsidian & Gold.</p>
              </div>
              <div className="mt-3 sm:mt-0">
                <button className="px-4 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30 hover:bg-yellow-500/30 transition">
                  Activate Theme
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 cursor-pointer transition-colors">
              <div>
                <p className="font-bold text-yellow-400 flex items-center gap-2">24/7 Priority Support Line</p>
                <p className="text-xs text-gray-400 mt-1">Direct contact line to Interakt engineering team.</p>
              </div>
              <ChevronRight className="w-4 h-4 text-yellow-600 mt-3 sm:mt-0" />
            </div>
          </div>
        )}

        {/* Display Options */}
        <div className="glass rounded-2xl overflow-hidden border border-white/5">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h2 className="font-bold text-white">Display Options</h2>
          </div>
          <div 
            className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors text-white"
            onClick={toggleTheme}
          >
            <div className="flex items-center space-x-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
              <span>{isDarkMode ? 'Dark' : 'Light'} Mode</span>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isDarkMode ? 'bg-[var(--accent-purple)]' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full py-4 glass rounded-2xl text-red-400 font-bold hover:bg-red-500/10 transition-colors border border-red-500/20 active:scale-95 transition-transform"
        >
          Log Out
        </button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'privacy' && (
          <Modal title="Privacy & Safety" onClose={() => setActiveModal(null)}>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <EyeOff className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Private Account</h3>
                    <p className="text-[10px] text-gray-400">Only approved followers can see your posts</p>
                  </div>
                </div>
                <button 
                  onClick={handleTogglePrivate}
                  disabled={loading}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isPrivate ? 'bg-purple-600' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isPrivate ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 opacity-50 cursor-not-allowed">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Data Protection</h3>
                    <p className="text-[10px] text-gray-400">Manage how your data is used</p>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'security' && (
          <Modal title="Security & Password" onClose={() => setActiveModal(null)}>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passError && <p className="text-red-400 text-xs bg-red-400/10 p-2 rounded-lg border border-red-400/20">{passError}</p>}
              {passSuccess && <p className="text-green-400 text-xs bg-green-400/10 p-2 rounded-lg border border-green-400/20">{passSuccess}</p>}
              
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input 
                    type="password" 
                    required
                    value={passwords.current}
                    onChange={e => setPasswords({...passwords, current: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input 
                    type="password" 
                    required
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Confirm New Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input 
                    type="password" 
                    required
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-purple-600 text-white font-bold rounded-2xl flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Update Password</span>}
              </button>
            </form>
          </Modal>
        )}

        {activeModal === 'notifications' && (
          <Modal title="Notification Preferences" onClose={() => setActiveModal(null)}>
            <div className="space-y-4">
              {['Push Notifications', 'Email Notifications', 'Direct Message Alerts', 'Post Interactions'].map(item => (
                <div key={item} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-sm text-white">{item}</span>
                  <div className="w-10 h-5 rounded-full bg-purple-600 relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-gray-500 text-center mt-4">More granular controls coming soon in the next update.</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
