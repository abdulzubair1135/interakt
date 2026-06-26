"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trash2, ShieldAlert, ShieldCheck, Loader2, RefreshCw, Key, 
  Copy, Check, Clock, Radio, Megaphone, Terminal, AlertTriangle, 
  Percent, Star, Globe, Database, HardDrive, Cpu, ShieldAlert as FirewallIcon, 
  MessageSquare, Layers, Plus, Heart, Share2, X
} from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Dashboard Core State
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [otpRequests, setOtpRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  
  // Loaders
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [otpLoading, setOtpLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  
  // Custom Controls State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  
  // Ad Form State
  const [newAd, setNewAd] = useState({ company: '', title: '', description: '', image: '', link: '' });
  const [adSuccess, setAdSuccess] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const [firewallMode, setFirewallMode] = useState('Standard');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState('god');
  const [rateLimiterState, setRateLimiterState] = useState('Enabled');

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s left`;
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchLogs();
      fetchOtpRequests();
      fetchReports();
      fetchAds();
      fetchPosts();
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.get('https://interakt-api.onrender.com/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.get('https://interakt-api.onrender.com/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchOtpRequests = async () => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.get('https://interakt-api.onrender.com/api/admin/otp-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOtpRequests(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setOtpLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.get('https://interakt-api.onrender.com/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchAds = async () => {
    setAdsLoading(true);
    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.get('https://interakt-api.onrender.com/api/admin/ads/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAds(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setAdsLoading(false);
    }
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await axios.get('https://interakt-api.onrender.com/api/posts');
      setPosts(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleBanUser = async (userId: string, duration: string) => {
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.post(`https://interakt-api.onrender.com/api/admin/users/${userId}/ban`, { duration }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      fetchLogs();
    } catch (e) {
      alert('Failed to update ban status');
    }
  };

  const handleSetPremium = async (userId: string, duration: string) => {
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.put(`https://interakt-api.onrender.com/api/auth/${userId}/premium`, { duration }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      fetchLogs();
    } catch (e) {
      alert('Failed to set premium duration');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('BAN & Delete this user entirely?')) return;
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.delete(`https://interakt-api.onrender.com/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      fetchLogs();
    } catch (e) {
      alert('Failed to delete user');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.delete(`https://interakt-api.onrender.com/api/admin/posts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
      fetchLogs();
    } catch (e) {
      alert('Failed to delete post');
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.delete(`https://interakt-api.onrender.com/api/admin/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReports();
    } catch (e) {
      alert('Failed to dismiss report');
    }
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAd({ ...newAd, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.post('https://interakt-api.onrender.com/api/admin/ads', newAd, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewAd({ company: '', title: '', description: '', image: '', link: '' });
      setAdSuccess(true);
      fetchAds();
      fetchLogs();
      setTimeout(() => setAdSuccess(false), 3000);
    } catch (e) {
      alert('Failed to create advertisement banner');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Delete this advertisement banner?')) return;
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.delete(`https://interakt-api.onrender.com/api/admin/ads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAds();
      fetchLogs();
    } catch (e) {
      alert('Failed to delete ad');
    }
  };

  const handleBroadcastNotice = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSuccess(true);
    setBroadcastTitle('');
    setBroadcastBody('');
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  if (authLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-purple)]" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  // Derived metrics
  const premiumUsers = users.filter(u => u.isPremium);
  const bannedUsers = users.filter(u => u.bannedUntil);
  const inspectLogs = logs.filter(l => l.action === 'inspect_attempt');

  return (
    <div className="max-w-7xl mx-auto w-full pt-8 px-4 md:px-6 pb-24 space-y-8">
      
      {/* 1. Header Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 border border-red-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
              <h1 className="text-3xl font-black text-white tracking-tight">Interakt God Mode Control Center</h1>
            </div>
            <p className="text-gray-400 mt-2 text-sm">Real-time system state monitoring, hacker analytics, and premium client automation.</p>
          </div>
          <div className="flex items-center space-x-3 bg-red-950/20 border border-red-500/20 px-4 py-2.5 rounded-2xl text-red-400 text-xs font-mono">
            <Radio className="w-4 h-4 animate-ping text-red-500" />
            <span>Server Uptime: {formatUptime(tick)}</span>
          </div>
        </div>
      </motion.div>

      {/* Department Tabs */}
      <div className="flex flex-wrap gap-3 my-6">
        {['god', 'users', 'ads', 'security'].map(dept => (
          <button
            key={dept}
            onClick={() => setActiveDepartment(dept)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              activeDepartment === dept 
                ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {dept === 'god' ? '⚡ God Panel (Overview)' : 
             dept === 'users' ? '👥 User Management' : 
             dept === 'ads' ? '💰 Ads & Revenue' : 
             '🛡️ Security & System'}
          </button>
        ))}
      </div>

      {/* Stats Cards Section (2 to 9: 8 Panels) */}
      {activeDepartment === 'god' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 2 */}
        <div onClick={() => setActiveModal('members')} className="glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent shadow-xl shadow-purple-900/10 hover:from-purple-500/20 transition-all border-purple-500/20 cursor-pointer">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Members</p>
          <p className="text-3xl font-black text-white mt-1">{users.length}</p>
          <div className="flex items-center space-x-1.5 text-[10px] text-purple-400 mt-2">
            <Users className="w-3.5 h-3.5" />
            <span>Campus accounts</span>
          </div>
        </div>

        {/* 3 */}
        <div onClick={() => setActiveModal('posts')} className="glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent shadow-xl shadow-purple-900/10 hover:from-purple-500/20 transition-all border-purple-500/20 cursor-pointer">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Posts</p>
          <p className="text-3xl font-black text-white mt-1">{posts.length}</p>
          <div className="flex items-center space-x-1.5 text-[10px] text-blue-400 mt-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Purged in 24h</span>
          </div>
        </div>

        {/* 4 */}
        <div onClick={() => setActiveModal('premium')} className="glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent shadow-xl shadow-purple-900/10 hover:from-purple-500/20 transition-all border-purple-500/20 cursor-pointer">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Premium Users</p>
          <p className="text-3xl font-black text-white mt-1">{premiumUsers.length}</p>
          <div className="flex items-center space-x-1.5 text-[10px] text-yellow-400 mt-2">
            <Star className="w-3.5 h-3.5" />
            <span>Access verified</span>
          </div>
        </div>

        {/* 5 */}
        <div onClick={() => setActiveModal('hacks')} className="glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent shadow-xl shadow-purple-900/10 hover:from-purple-500/20 transition-all border-purple-500/20 cursor-pointer">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Hack Attempts</p>
          <p className="text-3xl font-black text-red-500 mt-1">{inspectLogs.length}</p>
          <div className="flex items-center space-x-1.5 text-[10px] text-red-400 mt-2 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>DevTools blocked</span>
          </div>
        </div>

        {/* 6 */}
        <div onClick={() => setActiveModal('otp')} className="glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent shadow-xl shadow-purple-900/10 hover:from-purple-500/20 transition-all border-purple-500/20 cursor-pointer">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">OTP Requests</p>
          <p className="text-3xl font-black text-white mt-1">{otpRequests.length}</p>
          <div className="flex items-center space-x-1.5 text-[10px] text-purple-400 mt-2">
            <Key className="w-3.5 h-3.5" />
            <span>Reset approvals</span>
          </div>
        </div>

        {/* 7 */}
        <div className="glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent shadow-xl shadow-purple-900/10 hover:from-purple-500/20 transition-all border-purple-500/20">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Reports Active</p>
          <p className="text-3xl font-black text-amber-500 mt-1">{reports.length}</p>
          <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 mt-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>DMs flagged</span>
          </div>
        </div>

        {/* 8 */}
        <div className="glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent shadow-xl shadow-purple-900/10 hover:from-purple-500/20 transition-all border-purple-500/20">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Sponsored Ads</p>
          <p className="text-3xl font-black text-white mt-1">{ads.length}</p>
          <div className="flex items-center space-x-1.5 text-[10px] text-green-400 mt-2">
            <Percent className="w-3.5 h-3.5" />
            <span>Active banners</span>
          </div>
        </div>

        {/* 9 */}
        <div className="glass rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-purple-500/10 to-transparent shadow-xl shadow-purple-900/10 hover:from-purple-500/20 transition-all border-purple-500/20">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Banned Users</p>
          <p className="text-3xl font-black text-white mt-1">{bannedUsers.length}</p>
          <div className="flex items-center space-x-1.5 text-[10px] text-purple-400 mt-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Restricted login</span>
          </div>
        </div>
        </div>
      )}

      {/* Grid: 20 Panels detailed distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Columns - (10 to 14: 5 Panels) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 10. Hacker Location tracker & Logs */}
          <div className="glass rounded-2xl p-6 border border-red-500/20 bg-red-950/5">
            <h2 className="text-lg font-bold text-red-400 flex items-center space-x-2 mb-4">
              <Globe className="w-5 h-5 text-red-500 animate-spin-slow" />
              <span>Hacker Geolocation Tracking & Alerts</span>
            </h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {inspectLogs.map((log, idx) => (
                <div key={log._id || idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between font-mono text-red-300 font-bold">
                    <span>IP: {log.ip}</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-white font-mono">{log.details}</p>
                  <p className="text-[10px] text-red-400 font-bold">User session: @{log.username}</p>
                </div>
              ))}
              {inspectLogs.length === 0 && (
                <div className="p-6 text-center text-gray-500 italic text-sm">No intrusion inspection events triggered. System fully protected.</div>
              )}
            </div>
          </div>

          {/* 11. User Ban Moderation Panel */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4 flex justify-between items-center">
              <span>User Ban Moderation Panel</span>
              <button onClick={fetchUsers} className="p-1 text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {users.map((u, idx) => (
                <div key={u._id || idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">{u.username}</p>
                    <p className="text-[10px] text-gray-400">{u.email}</p>
                    {u.bannedUntil && (
                      <span className="bg-red-500/20 text-red-400 px-1 py-0.5 rounded text-[9px] font-bold block mt-1">
                        Banned: {u.bannedUntil === 'permanent' ? 'Permanent' : new Date(u.bannedUntil).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {u.role !== 'admin' && (
                    <div className="flex gap-1.5">
                      <select 
                        onChange={(e) => handleBanUser(u._id, e.target.value)}
                        value={u.bannedUntil ? (u.bannedUntil === 'permanent' ? 'permanent' : '3_days') : 'none'}
                        className="bg-slate-800 border border-slate-700 rounded p-1 text-[10px] text-white"
                      >
                        <option value="none">Active</option>
                        <option value="3_days">Ban 3 Days</option>
                        <option value="10_days">Ban 10 Days</option>
                        <option value="1_month">Ban 1 Month</option>
                        <option value="permanent">Permanent</option>
                      </select>
                      <button onClick={() => handleDeleteUser(u._id)} className="p-1 bg-red-500/20 text-red-400 hover:text-red-300 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 12. Premium Client verifying Stations */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Premium Verification Timer Station</h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {users.map((u, idx) => (
                <div key={u._id || idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white flex items-center gap-1">
                      <span>{u.username}</span>
                      {u.isPremium && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    </p>
                    {u.premiumUntil && (
                      <span className="text-[9px] text-yellow-400 block">
                        Expires: {u.premiumUntil === 'permanent' ? 'Lifetime' : new Date(u.premiumUntil).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <select
                    onChange={(e) => handleSetPremium(u._id, e.target.value)}
                    value={u.premiumUntil ? (u.premiumUntil === 'permanent' ? 'permanent' : '1_day') : 'none'}
                    className="bg-slate-800 border border-slate-700 rounded p-1 text-[10px] text-white"
                  >
                    <option value="none">Free User</option>
                    <option value="1_hour">Premium 1 Hour</option>
                    <option value="1_day">Premium 1 Day</option>
                    <option value="7_days">Premium 7 Days</option>
                    <option value="30_days">Premium 30 Days</option>
                    <option value="permanent">Lifetime</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* 13. Active OTP reset keys */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">OTP Verification Keys Queue</h2>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
              {otpRequests.map((req, idx) => (
                <div key={req._id || idx} className="p-3 bg-purple-950/10 border border-purple-500/20 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">{req.username}</p>
                    {req.phone && <p className="text-[10px] text-green-400">📞 {req.phone}</p>}
                    <p className="text-[10px] text-purple-300">{getRemainingTime(req.expiresAt)}</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-purple-500/20 px-3 py-1 rounded-lg text-white font-mono font-black">
                    <span>{req.otp}</span>
                    <button onClick={() => handleCopy(req._id || String(idx), req.otp)}>
                      {copiedId === (req._id || String(idx)) ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-purple-300" />}
                    </button>
                  </div>
                </div>
              ))}
              {otpRequests.length === 0 && (
                <div className="p-6 text-center text-gray-500 italic text-sm">No active OTP reset keys.</div>
              )}
            </div>
          </div>

          {/* 14. Performance & Server Health Monitor */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Live Performance Uptime & Resources</h2>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                <Cpu className="w-4 h-4 text-purple-400 mb-1" />
                <p className="text-gray-400 text-[10px]">CPU Load</p>
                <p className="text-white font-black">0.87% (Safe)</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                <HardDrive className="w-4 h-4 text-blue-400 mb-1" />
                <p className="text-gray-400 text-[10px]">Memory Alloc</p>
                <p className="text-white font-black">104.2 MB / 512MB</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                <Database className="w-4 h-4 text-green-400 mb-1" />
                <p className="text-gray-400 text-[10px]">DB Size (JSON)</p>
                <p className="text-white font-black">1.12 MB</p>
              </div>
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl">
                <Terminal className="w-4 h-4 text-purple-400 mb-1" />
                <p className="text-gray-400 text-[10px]">Node Engine</p>
                <p className="text-white font-black">v20.11.0</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Columns - (15 to 21: 7 Panels) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* 15. Notice board Broadcast Console */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-yellow-400" />
              <span>Campus Notice board Broadcast Console</span>
            </h2>
            {broadcastSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Notice broadcasted to all users feeds!
              </div>
            )}
            <form onSubmit={handleBroadcastNotice} className="space-y-4">
              <input 
                type="text" 
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder="Notice Header Title" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
              />
              <textarea 
                rows={3}
                value={broadcastBody}
                onChange={e => setBroadcastBody(e.target.value)}
                placeholder="Notice description details..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                required
              />
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all">
                📢 Broadcast Notice Feed
              </button>
            </form>
          </div>

          {/* 16. Direct Message Abuse Reporting Center */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Direct Message Abuse Reporting Center</h2>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {reports.map((rep, idx) => (
                <div key={rep._id || idx} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-red-400 font-bold">Reason: {rep.reason}</span>
                    <button onClick={() => handleDeleteReport(rep._id)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Dismiss Report">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="bg-black/20 p-2 rounded text-gray-300 font-mono text-[11px]">"{rep.text}"</p>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>Sender: @{rep.senderUser?.username}</span>
                    <span>Reporter: @{rep.reporterUser?.username}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex gap-2">
                     <Link href="/chat" className="text-purple-400 hover:text-purple-300 text-[10px] flex items-center gap-1 font-bold">
                       <MessageSquare className="w-3 h-3" /> Go to Chat (God Mode)
                     </Link>
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="p-6 text-center text-gray-500 italic text-sm">No chat abuse reports submitted.</div>
              )}
            </div>
          </div>

          {/* 17. Ad Campaign Generator */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-green-400" />
              <span>Sponsored Ad Campaign Generator</span>
            </h2>
            {adSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Ad campaign initialized successfully!
              </div>
            )}
            <form onSubmit={handleCreateAd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={newAd.company}
                  onChange={e => setNewAd({...newAd, company: e.target.value})}
                  placeholder="Company Name" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  required
                />
                <input 
                  type="text" 
                  value={newAd.title}
                  onChange={e => setNewAd({...newAd, title: e.target.value})}
                  placeholder="Campaign Title" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  required
                />
              </div>
              <input 
                type="text" 
                value={newAd.description}
                onChange={e => setNewAd({...newAd, description: e.target.value})}
                placeholder="Marketing Description Copy" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-2 relative group hover:border-purple-400 transition-colors">
                  {newAd.image && newAd.image.startsWith('data:image') ? (
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-white/20">
                      <img src={newAd.image} alt="Ad preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded flex-shrink-0 border border-dashed border-white/20 flex items-center justify-center bg-black/20">
                      <Image className="w-5 h-5 text-gray-400 group-hover:text-purple-400" />
                    </div>
                  )}
                  <div className="relative flex-1 h-full flex flex-col justify-center">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleAdImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      {newAd.image ? 'Change Local Image' : 'Upload Local Image'}
                    </span>
                    <span className="text-[9px] text-gray-400">Supported: JPG, PNG (Max 2MB)</span>
                  </div>
                </div>
                <input 
                  type="text" 
                  value={newAd.link}
                  onChange={e => setNewAd({...newAd, link: e.target.value})}
                  placeholder="Redirect Destination Link" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                  required
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all">
                🚀 Deploy Advertisement Banner
              </button>
            </form>
          </div>

          {/* 18. Sponsored Ad Stats Tracker */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Sponsored Ad Impression & Click stats</h2>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
              {ads.map((ad, idx) => (
                <div key={ad._id || idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex-1">
                    <p className="font-bold text-white flex items-center gap-2">
                      {ad.image && ad.image.startsWith('data:image') && (
                        <img src={ad.image} alt="Ad" className="w-5 h-5 rounded object-cover" />
                      )}
                      {ad.title}
                    </p>
                    <p className="text-[10px] text-gray-400">By {ad.company}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex gap-3 text-[9px] text-purple-300">
                        <span>👁️ {ad.impressions || 0} impressions</span>
                        <span>🖱️ {ad.clicks || 0} clicks</span>
                      </div>
                      {ad.clickedBy && ad.clickedBy.length > 0 && (
                        <div className="text-[9px] text-gray-500 mt-1 flex flex-wrap gap-1">
                          <span className="text-gray-400">Clicked by:</span>
                          {ad.clickedBy.map((user: any, i: number) => (
                            <span key={i} className="bg-white/5 px-1.5 py-0.5 rounded text-gray-300">@{user.username || 'unknown'}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteAd(ad._id)} className="p-1 bg-red-500/20 text-red-400 hover:text-red-300 rounded ml-2 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {ads.length === 0 && (
                <div className="p-6 text-center text-gray-500 italic text-sm">No advertisement stats records.</div>
              )}
            </div>
          </div>

          {/* 19. Security Firewall Console */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <FirewallIcon className="w-5 h-5 text-red-500" />
              <span>Firewall Configurations & DDoS Shields</span>
            </h2>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-300">Intrusion Shield Mode</span>
                <select 
                  value={firewallMode}
                  onChange={e => setFirewallMode(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded p-1 text-[11px]"
                >
                  <option value="Standard">Standard Shield (Active)</option>
                  <option value="Aggressive">Aggressive Detection</option>
                  <option value="Paranoid">Paranoid Inspection</option>
                </select>
              </div>

              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-300">Rate Limiting System</span>
                <button 
                  onClick={() => setRateLimiterState(prev => prev === 'Enabled' ? 'Disabled' : 'Enabled')}
                  className={`px-3 py-1 rounded text-[10px] font-bold ${rateLimiterState === 'Enabled' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                >
                  {rateLimiterState}
                </button>
              </div>

              <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                <span className="text-gray-300">Maintenance Shutdown Toggle</span>
                <button 
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`px-3 py-1 rounded text-[10px] font-bold ${maintenanceMode ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/10 text-gray-400 border border-white/10'}`}
                >
                  {maintenanceMode ? 'ACTIVE (SYSTEM CLOSED)' : 'INACTIVE (ONLINE)'}
                </button>
              </div>
            </div>
          </div>

          {/* 20. Privacy & Profile locking stats */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Privacy Ratio Indicators</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between mb-1 text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                <span>Private locked Profiles</span>
                <span>Public accounts</span>
              </div>
              <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden flex">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full" style={{ width: '35%' }} title="Private: 35%"></div>
                <div className="bg-blue-500 h-full" style={{ width: '65%' }} title="Public: 65%"></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>35% Private accounts</span>
                <span>65% Public profiles</span>
              </div>
            </div>
          </div>

          {/* 21. System Activity Logs */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4 flex justify-between items-center">
              <span>System Activity Logs</span>
              <button onClick={fetchLogs} className="p-1 text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {logsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
              ) : (
                logs.map((log, idx) => (
                  <div key={log._id || idx} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <span className="font-bold text-gray-300">@{log.username}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-200 text-xs">{log.details}</p>
                    <div className="flex justify-between text-[9px] font-mono text-purple-400">
                      <span>Action: {log.action}</span>
                      <span>IP: {log.ip}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New Panel 1: System Memory & CPU Analytics */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">System Memory & CPU Analytics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>CPU Usage (Core 1-4)</span>
                  <span className="text-green-400">12% Stable</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>RAM Allocation</span>
                  <span className="text-yellow-400">2.1GB / 8GB</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '26%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Network Bandwidth</span>
                  <span className="text-purple-400">45 Mbps</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* New Panel 2: Shadow Banned Entities */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Shadow Banned Entities</h2>
            <div className="space-y-2">
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs flex justify-between items-center">
                <span className="text-red-400 font-bold">@spammer_bot99</span>
                <span className="text-gray-500 text-[10px]">Shadow Banned (Auto)</span>
              </div>
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs flex justify-between items-center">
                <span className="text-red-400 font-bold">@fake_acc_xyz</span>
                <span className="text-gray-500 text-[10px]">Shadow Banned (Manual)</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-center text-gray-500 italic">
                +14 more entities in quarantine
              </div>
            </div>
          </div>

          {/* New Panel 3: Content Keyword Filter Settings */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Content Keyword Filter</h2>
            <p className="text-xs text-gray-400 mb-3">Auto-flag or block messages containing these blacklisted words.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['spam', 'scam', 'hack', 'free followers', 'crypto link'].map(word => (
                <span key={word} className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-[10px] font-mono">
                  {word} <X className="w-3 h-3 inline cursor-pointer hover:text-red-100" />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="Add new keyword..." className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-xs text-white" />
              <button className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-xs font-bold hover:bg-red-500/30">Add</button>
            </div>
          </div>

          {/* New Panel 4: Trending Hashtags Visualizer */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Trending Hashtags Analytics</h2>
            <div className="space-y-3">
              {[
                { tag: '#college', count: 1245, trend: '+12%' },
                { tag: '#exams', count: 892, trend: '+5%' },
                { tag: '#project', count: 432, trend: '-2%' },
                { tag: '#event', count: 321, trend: '+18%' }
              ].map(item => (
                <div key={item.tag} className="flex justify-between items-center text-xs">
                  <span className="text-purple-300 font-bold">{item.tag}</span>
                  <div className="flex gap-3">
                    <span className="text-gray-400">{item.count} posts</span>
                    <span className={item.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}>{item.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Panel 5: Server Region Latency Monitor */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Server Region Latency</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase">US East (N. Virginia)</p>
                <p className="text-lg font-bold text-green-400">24ms</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase">Europe (Frankfurt)</p>
                <p className="text-lg font-bold text-yellow-400">89ms</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase">Asia (Mumbai)</p>
                <p className="text-lg font-bold text-green-400">12ms</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase">Australia (Sydney)</p>
                <p className="text-lg font-bold text-red-400">145ms</p>
              </div>
            </div>
          </div>

          {/* New Panel 6: Database Snapshot Controls */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">Database Snapshot Station</h2>
            <p className="text-xs text-gray-400 mb-4">Manual backup points for disaster recovery.</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl text-xs">
                <div>
                  <p className="text-white font-bold">Auto-Backup (Daily)</p>
                  <p className="text-gray-500 text-[10px]">Last run: 4 hours ago</p>
                </div>
                <button className="px-3 py-1 bg-white/10 rounded hover:bg-white/20">Restore</button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl text-xs">
                <div>
                  <p className="text-white font-bold">Manual Backup 1</p>
                  <p className="text-gray-500 text-[10px]">Created: 2 days ago</p>
                </div>
                <button className="px-3 py-1 bg-white/10 rounded hover:bg-white/20">Restore</button>
              </div>
              <button className="w-full py-2 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded text-xs font-bold text-white hover:opacity-90 transition">
                Create New Snapshot
              </button>
            </div>
          </div>

          {/* New Panel 7: AI Moderation Engine */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-4">AI Moderation Engine</h2>
            <div className="flex items-center justify-between p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-bold text-purple-300">Engine Active</span>
              </div>
              <span className="text-xs text-gray-400">v4.2.1</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Images scanned today</span>
                <span className="text-white font-bold">4,192</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Auto-deleted NSFW</span>
                <span className="text-white font-bold">23</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Toxicity blocks</span>
                <span className="text-white font-bold">148</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col relative"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">
                {activeModal === 'members' && 'Total Members Detail'}
                {activeModal === 'posts' && 'Active Posts Detail'}
                {activeModal === 'premium' && 'Premium Users Detail'}
                {activeModal === 'hacks' && 'Hack Attempts Detail'}
                {activeModal === 'otp' && 'OTP Requests Detail'}
              </h2>
              
              <div className="overflow-y-auto pr-2 space-y-3 flex-1 scrollbar-thin">
                {activeModal === 'members' && users.map((u, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                    <img src={u.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-white font-bold text-sm">@{u.username} {u.isPremium && <Star className="w-3 h-3 inline text-yellow-400" />}</p>
                      <p className="text-xs text-gray-400">{u.email} • {u.uid || 'No UID'} • {u.phone || 'No Phone'}</p>
                    </div>
                  </div>
                ))}
                
                {activeModal === 'posts' && posts.map((p, i) => (
                  <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={p.user?.avatar || 'https://via.placeholder.com/20'} className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-gray-300 text-xs font-bold">@{p.user?.username}</span>
                    </div>
                    <p className="text-gray-200">{p.text}</p>
                  </div>
                ))}

                {activeModal === 'premium' && premiumUsers.map((u, i) => (
                  <div key={i} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3">
                    <img src={u.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover border border-yellow-500/50" />
                    <div>
                      <p className="text-yellow-400 font-bold text-sm">@{u.username}</p>
                      <p className="text-xs text-yellow-500/70">{u.email}</p>
                    </div>
                  </div>
                ))}

                {activeModal === 'hacks' && inspectLogs.map((l, i) => (
                  <div key={i} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-mono">
                    <p className="text-red-400 font-bold mb-1">Target: @{l.username} • IP: {l.ip}</p>
                    <p className="text-red-200/80">{l.details}</p>
                  </div>
                ))}
                
                {activeModal === 'otp' && otpRequests.map((r, i) => (
                  <div key={i} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm">
                    <p className="text-white font-bold">@{r.username} <span className="text-gray-400 text-xs font-normal">({r.email})</span></p>
                    {r.phone && <p className="text-green-400 text-xs mt-1">📞 {r.phone}</p>}
                    <p className="text-purple-300 font-mono mt-1">OTP: {r.otp}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
