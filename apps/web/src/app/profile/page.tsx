"use client";

import { User, Settings, Grid, Bookmark, Image as ImageIcon, Loader2, LogOut, X, Camera, Save, Smile, Users, Heart, Crown, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import PostCard from '@/components/ui/PostCard';
import FollowListModal from '@/components/ui/FollowListModal';
import { useAuth } from '@/components/providers/AuthProvider';

const PRESET_AVATARS = [
  { name: 'Male Blonde', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&topColor=e5c158' },
  { name: 'Male Dark', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&topColor=2c1a04' },
  { name: 'Male Curly', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George&top=frizzle&topColor=black' },
  { name: 'Male Dreads', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo&top=dreads&topColor=724124' },
  { name: 'Female Brunette', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&top=longHair&topColor=4a3728' },
  { name: 'Female Ginger', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&top=curly&topColor=e98039' },
  { name: 'Female Long Black', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&top=straight02&topColor=black' },
  { name: 'Female Pink Bob', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&top=bob&topColor=ff4081' }
];

const PRESET_COVERS = [
  { name: 'Forest Nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop' },
  { name: 'Space Earth', url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&auto=format&fit=crop' },
  { name: 'Sun Golden Hour', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop' },
  { name: 'Mystic Moon', url: 'https://images.unsplash.com/photo-1532798369041-b33eb576ef16?w=800&auto=format&fit=crop' },
  { name: 'Dream Mind Abstract', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop' },
  { name: 'Black & White Cyberpunk', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop' },
  { name: 'Foggy Mountains', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop' },
  { name: 'Stars Nebula', url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&auto=format&fit=crop' }
];

export default function Profile() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked' | 'saved'>('posts');
  const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following'; title: string }>({
    isOpen: false,
    type: 'followers',
    title: 'Followers'
  });

  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    nickname: '',
    bio: '',
    emoji: '',
    avatar: '',
    coverImage: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('campushub_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const meRes = await axios.get('https://interakt-api.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = meRes.data.data;
        setProfile(userData);
        setEditForm({
          username: userData.username,
          name: userData.name || '',
          nickname: userData.nickname || '',
          bio: userData.bio || '',
          emoji: userData.emoji || '🎓',
          avatar: userData.avatar || '',
          coverImage: userData.coverImage || ''
        });

        if (userData.isPremium) {
          try {
            const analyticsRes = await axios.get(`https://interakt-api.onrender.com/api/auth/profile/${userData._id}/analytics`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setAnalytics(analyticsRes.data.data);
          } catch (e) {
            console.error('Failed to fetch user analytics', e);
          }
        }

        setPostsLoading(true);
        let postsUrl = `https://interakt-api.onrender.com/api/posts/user/${userData._id}`;
        if (activeTab === 'liked') postsUrl = 'https://interakt-api.onrender.com/api/posts/liked';
        else if (activeTab === 'saved') postsUrl = 'https://interakt-api.onrender.com/api/posts/saved';

        const postsRes = await axios.get(postsUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(postsRes.data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
        setPostsLoading(false);
      }
    };

    fetchProfileData();
  }, [router, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('campushub_token');
    router.push('/login');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('campushub_token');
      const res = await axios.put('https://interakt-api.onrender.com/api/auth/updatedetails', editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.data);
      setShowEditModal(false);
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update profile');
    } finally {
      setUpdateLoading(false);
    }
  };

  const calculateTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-purple)]" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto w-full pt-8 px-4 md:px-6">
      
      <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden relative mb-16 border border-white/10 opacity-80">
        {profile.coverImage ? (
          <img src={profile.coverImage} alt="cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)]"></div>
        )}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -bottom-12 left-8 p-1 bg-[var(--background)] rounded-full">
          <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 relative ${
            profile.isPremium 
              ? 'border-yellow-400 bg-yellow-900/20 shadow-[0_0_30px_rgba(234,179,8,0.5)] ring-4 ring-yellow-500/30' 
              : 'bg-gray-800 border-[var(--accent-purple)] shadow-[0_0_20px_rgba(139,92,246,0.4)]'
          }`}>
            <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile._id}`} alt={profile.username} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-lg">
              {profile.emoji || '🎓'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start px-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            <span className={profile.isPremium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]' : 'text-white'}>
              {profile.name || profile.username}
            </span>
            <span className="text-lg opacity-80">{profile.emoji}</span>
            {profile.isPremium && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 text-[10px] font-black tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                <Crown className="w-3 h-3" /> PRO
              </span>
            )}
          </h1>
          <p className="text-gray-400 mb-4">@{profile.username} {profile.nickname && `• ${profile.nickname}`} • Joined {new Date(profile.createdAt).getFullYear()}</p>
          <p className="max-w-md text-sm text-gray-300">
            {profile.bio || "No bio yet."}
          </p>
          <div className="flex space-x-6 mt-4 text-sm">
            <button 
              onClick={() => setFollowModal({ isOpen: true, type: 'followers', title: 'Followers' })}
              className="hover:text-purple-400 transition-colors"
            >
              <span className="font-bold text-white">{profile.followers?.length || 0}</span> <span className="text-gray-500">Followers</span>
            </button>
            <button 
              onClick={() => setFollowModal({ isOpen: true, type: 'following', title: 'Following' })}
              className="hover:text-purple-400 transition-colors"
            >
              <span className="font-bold text-white">{profile.following?.length || 0}</span> <span className="text-gray-500">Following</span>
            </button>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowEditModal(true)}
            className="glass hover:bg-white/10 border border-white/20 text-white py-2 px-4 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>
          <button 
            onClick={handleLogout}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-2 px-4 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* VIP Profile Analytics (Premium Only) */}
      {profile.isPremium && profile._id === user?._id && (
        <div className="glass rounded-2xl p-6 border border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-transparent shadow-[0_0_15px_rgba(234,179,8,0.05)] mb-8">
          <h3 className="font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> VIP Profile Analytics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <div className="bg-black/20 rounded-xl p-4 border border-yellow-500/10 text-center">
              <p className="text-3xl font-black text-white">{analytics ? analytics.profileViews : '0'}</p>
              <p className="text-[10px] text-yellow-500/80 uppercase tracking-widest font-bold mt-1">Profile Views</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-yellow-500/10 text-center">
              <p className="text-3xl font-black text-white">{analytics ? analytics.engagementRate : '0.0%'}</p>
              <p className="text-[10px] text-yellow-500/80 uppercase tracking-widest font-bold mt-1">Engagement</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-yellow-500/10 text-center">
              <p className="text-3xl font-black text-white">{analytics ? analytics.followersCount : (profile.followers?.length || 0)}</p>
              <p className="text-[10px] text-yellow-500/80 uppercase tracking-widest font-bold mt-1">Total Followers</p>
            </div>
            <div className="bg-black/20 rounded-xl p-4 border border-yellow-500/10 text-center">
              <p className="text-3xl font-black text-white">{analytics ? analytics.creatorRank : 'Top 50%'}</p>
              <p className="text-[10px] text-yellow-500/80 uppercase tracking-widest font-bold mt-1">Creator Rank</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex border-b border-white/10 mb-6 gap-2">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-4 border-b-2 font-bold flex items-center space-x-2 relative transition-all ${
            activeTab === 'posts' ? 'border-[var(--accent-purple)] text-[var(--accent-purple)]' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Posts</span>
        </button>
        <button 
          onClick={() => setActiveTab('liked')}
          className={`px-6 py-4 border-b-2 font-bold flex items-center space-x-2 relative transition-all ${
            activeTab === 'liked' ? 'border-[var(--accent-purple)] text-[var(--accent-purple)]' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked</span>
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={`px-6 py-4 border-b-2 font-bold flex items-center space-x-2 relative transition-all ${
            activeTab === 'saved' ? 'border-[var(--accent-purple)] text-[var(--accent-purple)]' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved</span>
        </button>
      </div>

      <div className="space-y-4 pb-20">
        {postsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-purple)]" />
          </div>
        ) : posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post._id} 
              id={post._id}
              author={post.user?.username || 'Anonymous'} 
              avatar={post.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?._id}`}
              time={calculateTimeAgo(post.createdAt)}
              content={post.text}
              image={post.media}
              likes={post.likes?.length || 0}
              comments={post.comments?.length || 0}
              type={post.postType}
              category={post.category}
              isLikedByMe={post.likes?.includes(profile._id)}
              userId={post.user?._id || profile._id}
              isAuthorPremium={post.user?.isPremium}
            />
          ))
        ) : (
          <div className="glass rounded-2xl p-12 text-center border border-white/5">
            <h3 className="text-xl font-bold mb-2">No Posts Yet</h3>
          </div>
        )}
      </div>

      <FollowListModal 
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal({ ...followModal, isOpen: false })}
        userId={profile._id}
        type={followModal.type}
        title={followModal.title}
      />

      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="glass max-w-lg w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                <button onClick={() => setShowEditModal(false)}><X className="w-5 h-5 text-white" /></button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Username</label>
                    <input 
                      type="text" 
                      value={editForm.username}
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Display Name</label>
                    <input 
                      type="text" 
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="Real Name"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Nickname</label>
                    <input 
                      type="text" 
                      value={editForm.nickname}
                      onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                      placeholder="Nick Name"
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Status Emoji</label>
                    <input 
                      type="text" 
                      value={editForm.emoji}
                      onChange={(e) => setEditForm({...editForm, emoji: e.target.value})}
                      placeholder="🎓, 🚀, 💻..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Bio / About You</label>
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    rows={3}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50 resize-none"
                    placeholder="Tell the campus about yourself..."
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Choose Premium Avatar Preset</label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-3 p-2 bg-white/5 border border-white/10 rounded-2xl">
                    {PRESET_AVATARS.map((av, idx) => {
                      const isSelected = editForm.avatar === av.url;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setEditForm({ ...editForm, avatar: av.url })}
                          className={`aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center bg-zinc-800 ${
                            isSelected ? 'border-[var(--accent-purple)] scale-105 shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} className="w-full h-full object-cover" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Choose Mood Cover Image Preset</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 p-2 bg-white/5 border border-white/10 rounded-2xl">
                    {PRESET_COVERS.map((cov, idx) => {
                      const isSelected = editForm.coverImage === cov.url;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setEditForm({ ...editForm, coverImage: cov.url })}
                          className={`h-12 rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative group hover:scale-[1.02] active:scale-95 ${
                            isSelected ? 'border-[var(--accent-purple)] scale-[1.02] shadow-[0_0_10px_rgba(139,92,246,0.5)]' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          title={cov.name}
                        >
                          <img src={cov.url} alt={cov.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-bold text-white uppercase tracking-wider">{cov.name.split(' ')[0]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={updateLoading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl flex items-center justify-center space-x-2"
                >
                  {updateLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /> <span>Update Profile</span></>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
