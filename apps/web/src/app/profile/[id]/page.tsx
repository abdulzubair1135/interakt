"use client";

import { User, Grid, Bookmark, Image as ImageIcon, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import PostCard from '@/components/ui/PostCard';
import Link from 'next/link';
import FollowListModal from '@/components/ui/FollowListModal';

export default function UserProfile() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following'; title: string }>({
    isOpen: false,
    type: 'followers',
    title: 'Followers'
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('campushub_token');
        
        const profileRes = await axios.get(`https://interakt-api.onrender.com/api/auth/profile/${id}`);
        setProfile(profileRes.data.data);

        const postsRes = await axios.get(`https://interakt-api.onrender.com/api/posts/user/${id}`);
        setPosts(postsRes.data.data);

        if (token) {
          const meRes = await axios.get('https://interakt-api.onrender.com/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentUser(meRes.data.data);
          
          if (meRes.data.data._id === id) {
             router.replace('/profile');
          } else {
             setIsFollowing(meRes.data.data.following?.includes(id));
          }
        }
        
        setFollowersCount(profileRes.data.data.followers?.length || 0);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfileData();
    }
  }, [id, router]);

  const handleFollowToggle = async () => {
    try {
      const token = localStorage.getItem('campushub_token');
      if (!token) return router.push('/login');

      const res = await axios.put(`https://interakt-api.onrender.com/api/auth/${id}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsFollowing(res.data.isFollowing);
      setFollowersCount(res.data.followersCount);
    } catch (err) {
      console.error('Error toggling follow:', err);
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

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center">
        <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
        <p className="text-gray-400 mb-6">This profile doesn't exist or has been removed.</p>
        <Link href="/">
          <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl transition-colors">Go Home</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full pt-4 md:pt-8 px-4 md:px-6">
      
      <button 
        onClick={() => router.back()}
        className="mb-4 flex items-center text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      <div className="w-full h-48 md:h-64 rounded-2xl bg-gradient-to-r from-blue-900 to-purple-900 overflow-hidden relative mb-16 border border-white/10 opacity-80">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -bottom-12 left-8 p-1 bg-[var(--background)] rounded-full">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-800 overflow-hidden border-2 border-[var(--accent-purple)] flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile._id}`} alt={profile.username} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start px-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{profile.username} {profile.emoji}</h1>
          <p className="text-gray-400 mb-4">@{profile.username.toLowerCase().replace(/\s+/g, '_')} • Joined {new Date(profile.createdAt).getFullYear()}</p>
          <p className="max-w-md text-sm text-gray-300">
            {profile.bio || "Interakt Member"}
          </p>
          <div className="flex space-x-6 mt-4 text-sm">
            <button 
              onClick={() => setFollowModal({ isOpen: true, type: 'followers', title: `${profile.username}'s Followers` })}
              className="hover:text-purple-400 transition-colors"
            >
              <span className="font-bold text-white">{followersCount}</span> <span className="text-gray-500">Followers</span>
            </button>
            <button 
              onClick={() => setFollowModal({ isOpen: true, type: 'following', title: `${profile.username}'s Following` })}
              className="hover:text-purple-400 transition-colors"
            >
              <span className="font-bold text-white">{profile.following?.length || 0}</span> <span className="text-gray-500">Following</span>
            </button>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleFollowToggle}
            className={`${isFollowing ? 'bg-white/10 text-white border border-white/20' : 'bg-[var(--accent-purple)] hover:bg-purple-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'} font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <Link href={`/messages?user=${profile._id}`}>
            <button className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl border border-white/10 transition-all active:scale-95">
              <MessageSquare className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>

      <div className="flex border-b border-white/10 mb-6">
        <button className="px-6 py-4 border-b-2 border-[var(--accent-purple)] text-[var(--accent-purple)] font-bold flex items-center space-x-2 relative">
          <Grid className="w-4 h-4" />
          <span>Posts</span>
        </button>
      </div>

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <PostCard 
              key={post._id} 
              id={post._id}
              author={post.user?.username || profile.username} 
              avatar={post.user?.avatar || profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`}
              time={calculateTimeAgo(post.createdAt)}
              content={post.text}
              likes={post.likes?.length || 0}
              comments={post.comments?.length || 0}
              type={post.postType}
              category={post.category}
              isLikedByMe={currentUser ? post.likes?.includes(currentUser._id) : false}
            />
          ))
        ) : (
          <div className="glass rounded-2xl p-12 text-center border border-white/5">
            <h3 className="text-xl font-bold mb-2">No Posts Yet</h3>
            <p className="text-gray-500">This user hasn't posted anything yet.</p>
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
    </div>
  );
}
