"use client";
import { Compass, Search, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import PostCard from '@/components/ui/PostCard';

export default function Explore() {
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag');
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const url = tag 
          ? `http://localhost:5005/api/posts/search?q=${tag}`
          : 'http://localhost:5005/api/posts';
        
        const res = await axios.get(url);
        setPosts(res.data.data);
      } catch (error) {
        console.error('Error fetching explore posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [tag]);

  const calculateTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-12 px-4 md:px-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Compass className="w-8 h-8 text-[var(--accent-purple)]" />
          <h1 className="text-3xl font-bold text-gradient">Explore</h1>
        </div>
        {tag && (
          <span className="bg-purple-500/20 text-purple-300 px-4 py-1 rounded-full text-sm font-bold border border-purple-500/30">
            #{tag}
          </span>
        )}
      </div>
      
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--accent-purple)]" />
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
              tags={post.tags}
              isLikedByMe={false} // Will handle later with real user state
              userId={post.user?._id}
            />
          ))
        ) : (
          <div className="glass rounded-2xl p-12 text-center border border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">No posts found</h2>
            <p className="text-gray-400">Be the first to post something with #{tag || 'this category'}!</p>
          </div>
        )}
      </div>
    </div>
  );
}
