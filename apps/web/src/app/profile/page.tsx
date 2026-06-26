"use client";

import { User, Settings, Grid, Bookmark, Image as ImageIcon, Loader2, LogOut, X, Camera, Save, Smile, Users, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import PostCard from '@/components/ui/PostCard';
import FollowListModal from '@/components/ui/FollowListModal';

export default function Profile() {
  const router = useRouter();
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
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 overflow-hidden border-2 border-[var(--accent-purple)] shadow-[0_0_20px_rgba(139,92,246,0.4)] relative">
            <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile._id}`} alt={profile.username} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-lg">
              {profile.emoji || '🎓'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start px-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-2">
            {profile.name || profile.username}
            <span className="text-lg opacity-80">{profile.emoji}</span>
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
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Avatar URL</label>
                  <input 
                    type="text" 
                    value={editForm.avatar}
                    onChange={(e) => setEditForm({...editForm, avatar: e.target.value})}
                    placeholder="https://..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Cover Image URL</label>
                  <input 
                    type="text" 
                    value={editForm.coverImage}
                    onChange={(e) => setEditForm({...editForm, coverImage: e.target.value})}
                    placeholder="https://..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50"
                  />
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
