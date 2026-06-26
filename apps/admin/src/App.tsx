import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart3, Users, FileText, ShieldAlert, LogOut, Trash2,
  Crown, CheckCircle, RefreshCw, Search, Bell, Star,
  TrendingUp, Shield
} from 'lucide-react';

const API = 'http://localhost:5005/api';

// ─── Auth Context ────────────────────────────────────────────
const AuthContext = createContext<any>(null);

function AuthProvider({ children }: any) {
  const [admin, setAdmin] = useState<any>(() => {
    const saved = localStorage.getItem('admin_data');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (data: any) => {
    setAdmin(data);
    localStorage.setItem('admin_data', JSON.stringify(data));
    localStorage.setItem('admin_token', data.token);
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('admin_data');
    localStorage.removeItem('admin_token');
  };

  return <AuthContext.Provider value={{ admin, login, logout }}>{children}</AuthContext.Provider>;
}

const useAdminAuth = () => useContext(AuthContext);

// ─── Axios helper ────────────────────────────────────────────
const getHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
});

// ─── Login Page ──────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      if (res.data.user.role !== 'admin') {
        setError('Access denied. Admin account required.');
        return;
      }
      login({ ...res.data.user, token: res.data.token });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-black text-white">Admin Portal</h1>
          <p className="text-slate-400 mt-2">CampusHub Pro Control Center</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@campus.edu"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-400 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Admin Panel →'}
          </button>
          <p className="text-center text-slate-500 text-xs mt-4">Only admin accounts can access this panel</p>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({ active }: { active: string }) {
  const { admin, logout } = useAdminAuth();
  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, href: '/' },
    { id: 'users', label: 'Users', icon: Users, href: '/users' },
    { id: 'posts', label: 'Posts', icon: FileText, href: '/posts' },
    { id: 'notices', label: 'Notices', icon: Bell, href: '/notices' },
    { id: 'logs', label: 'Activity Logs', icon: Shield, href: '/logs' },
  ];
  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 p-6 flex flex-col h-screen sticky top-0">
      <div className="flex items-center space-x-3 mb-10">
        <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">Interact Admin</h1>
          <p className="text-xs text-slate-500">by project x²</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {nav.map(item => (
          <Link key={item.id} to={item.href}
            className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${active === item.id ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-700 pt-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
            {admin?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{admin?.username || 'Admin'}</p>
            <p className="text-slate-500 text-xs">Administrator</p>
          </div>
        </div>
        <button onClick={logout}
          className="w-full flex items-center space-x-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-sm">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Stats Card ───────────────────────────────────────────────
function StatCard({ label, value, sub, color }: any) {
  const colors: any = {
    purple: 'border-purple-500/20 bg-purple-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    red: 'border-red-500/20 bg-red-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
  };
  return (
    <div className={`bg-slate-800 p-6 rounded-2xl border ${colors[color] || colors.purple}`}>
      <h3 className="text-slate-400 text-sm font-semibold mb-2">{label}</h3>
      <p className="text-3xl font-black text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs mt-2 text-slate-500">{sub}</p>}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────
function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/admin/users`, getHeaders()),
      axios.get(`${API}/posts`, getHeaders()),
    ]).then(([users, posts]) => {
      setStats({
        users: users.data.count,
        posts: posts.data.count,
        premium: users.data.data.filter((u: any) => u.isPremium).length,
        admins: users.data.data.filter((u: any) => u.role === 'admin').length,
      });
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h2 className="text-2xl font-black text-white mb-6">Dashboard Overview</h2>
      {loading ? <div className="text-slate-400">Loading stats...</div> : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.users} color="purple" sub="Registered members" />
          <StatCard label="Active Posts" value={stats.posts} color="blue" sub="Live posts (24h)" />
          <StatCard label="Premium Users" value={stats.premium} color="green" sub="Can create groups" />
          <StatCard label="Admins" value={stats.admins} color="red" sub="Admin accounts" />
        </div>
      )}
      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-white font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/users" className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-all">
            <Users className="text-purple-400 w-5 h-5" />
            <span className="text-white text-sm font-medium">Manage Users</span>
          </Link>
          <Link to="/posts" className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-all">
            <FileText className="text-blue-400 w-5 h-5" />
            <span className="text-white text-sm font-medium">Moderate Posts</span>
          </Link>
          <Link to="/notices" className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-all">
            <Bell className="text-yellow-400 w-5 h-5" />
            <span className="text-white text-sm font-medium">Send Notice</span>
          </Link>
          <div className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-xl">
            <TrendingUp className="text-green-400 w-5 h-5" />
            <span className="text-slate-400 text-sm">Analytics (Soon)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users Management ─────────────────────────────────────────
function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchUsers = () => {
    setLoading(true);
    axios.get(`${API}/admin/users`, getHeaders())
      .then(r => setUsers(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const deleteUser = async (id: string) => {
    if (!confirm('Ban and delete this user?')) return;
    setActionLoading(id + '_del');
    try {
      await axios.delete(`${API}/admin/users/${id}`, getHeaders());
      setUsers(prev => prev.filter(u => u._id !== id));
    } finally { setActionLoading(''); }
  };

  const togglePremium = async (id: string, current: boolean) => {
    setActionLoading(id + '_prem');
    try {
      await axios.put(`${API}/auth/${id}/premium`, { isPremium: !current }, getHeaders());
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isPremium: !current } : u));
    } finally { setActionLoading(''); }
  };

  const filtered = users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">Users Management</h2>
        <button onClick={fetchUsers} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by username or email..."
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500" />
      </div>
      {loading ? <div className="text-slate-400 text-center py-10">Loading users...</div> : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-700">
              <tr className="text-slate-400 text-sm">
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Premium</th>
                <th className="text-left p-4">Joined</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user._id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-400">
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{user.username}</p>
                        <p className="text-slate-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {user.isPremium
                      ? <span className="flex items-center gap-1 text-yellow-400 text-sm"><Crown className="w-3 h-3" /> Premium</span>
                      : <span className="text-slate-500 text-sm">Free</span>}
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePremium(user._id, user.isPremium)}
                        disabled={actionLoading === user._id + '_prem'}
                        className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-all" title="Toggle Premium">
                        <Star className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteUser(user._id)}
                        disabled={actionLoading === user._id + '_del' || user.role === 'admin'}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-30" title="Ban User">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Posts Moderation ─────────────────────────────────────────
function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = () => {
    setLoading(true);
    axios.get(`${API}/posts`, getHeaders())
      .then(r => setPosts(r.data.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, []);

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await axios.delete(`${API}/admin/posts/${id}`, getHeaders());
    setPosts(prev => prev.filter(p => p._id !== id));
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white">Post Moderation</h2>
        <button onClick={fetchPosts} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      {loading ? <div className="text-slate-400 text-center py-10">Loading posts...</div> : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post._id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-400 font-bold text-sm">@{post.user?.username || 'Unknown'}</span>
                    {post.tags?.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded-full">#{tag}</span>
                    ))}
                    <span className="text-slate-500 text-xs ml-auto">{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{post.text}</p>
                  {post.media && <p className="text-blue-400 text-xs mt-1 truncate">📎 Media attached</p>}
                  <div className="flex gap-4 mt-2 text-slate-500 text-xs">
                    <span>❤️ {post.likes?.length || 0} likes</span>
                    <span>🔖 {post.saves?.length || 0} saves</span>
                  </div>
                </div>
                <button onClick={() => deletePost(post._id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <div className="text-center text-slate-500 py-10">No posts found</div>}
        </div>
      )}
    </div>
  );
}

// ─── Notice Board ─────────────────────────────────────────────
function NoticesPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = (e: any) => {
    e.preventDefault();
    // In a real app, this would hit an API endpoint for notifications
    setSent(true);
    setTitle('');
    setBody('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <h2 className="text-2xl font-black text-white mb-6">Send College Notice</h2>
      <div className="max-w-xl bg-slate-800 border border-slate-700 rounded-2xl p-6">
        {sent && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Notice sent to all students!
          </div>
        )}
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Notice Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Exam Schedule Update"
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              required />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Message Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              rows={5} placeholder="Type your notice here..."
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
              required />
          </div>
          <button type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all">
            📢 Broadcast Notice
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Logs Page ────────────────────────────────────────────────
function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    axios.get(`${API}/admin/logs`, getHeaders())
      .then(res => {
        setLogs(res.data.data);
      })
      .catch(err => {
        console.error('Failed to fetch logs', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-white font-mono">System Activity Logs</h2>
          <p className="text-slate-400 text-sm mt-1">Real-time audit trails of user and admin actions</p>
        </div>
        <button onClick={fetchLogs}
          className="flex items-center space-x-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-all cursor-pointer">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading audit trail...</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50 text-slate-400 text-xs uppercase font-bold">
                  <th className="p-4">Time</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 text-slate-400 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {log.username}
                      {log.userId && <span className="block text-[10px] text-slate-500 font-normal">ID: {log.userId}</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        log.action === 'login' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        log.action === 'login_fail' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        log.action === 'register' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        log.action === 'create_post' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        log.action === 'delete_post' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-xs">
                      {log.ip}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-slate-500 italic">No activity logs recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Protected Route ──────────────────────────────────────────
function ProtectedRoute({ children }: any) {
  const { admin } = useAdminAuth();
  return admin ? children : <Navigate to="/login" replace />;
}

// ─── Layout ───────────────────────────────────────────────────
function Layout({ children, active }: any) {
  return (
    <div className="flex min-h-screen bg-slate-900 text-white font-sans">
      <Sidebar active={active} />
      {children}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout active="dashboard"><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Layout active="users"><UsersPage /></Layout></ProtectedRoute>} />
          <Route path="/posts" element={<ProtectedRoute><Layout active="posts"><PostsPage /></Layout></ProtectedRoute>} />
          <Route path="/notices" element={<ProtectedRoute><Layout active="notices"><NoticesPage /></Layout></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><Layout active="logs"><LogsPage /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
