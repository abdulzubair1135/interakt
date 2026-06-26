"use client";

import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth } from '../providers/AuthProvider';

interface PostProps {
  id: string;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  type?: 'regular' | 'notes' | 'confession';
  category?: string;
  tags?: string[];
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
  userId?: string;
}

const tagColors: Record<string, string> = {
  funny: '#f59e0b', study: '#3b82f6', confession: '#ec4899',
  memes: '#10b981', exam: '#ef4444', events: '#8b5cf6',
  clubs: '#06b6d4', general: '#9ca3af',
};

const PostCard = ({ id, author, avatar, time, content, image, likes: initialLikes, comments, type, category, tags, isLikedByMe = false, isSavedByMe = false, userId }: PostProps) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(isLikedByMe);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isSaved, setIsSaved] = useState(isSavedByMe);
  const [isDeleted, setIsDeleted] = useState(false);

  useEffect(() => {
    setIsLiked(isLikedByMe);
    setIsSaved(isSavedByMe);
  }, [isLikedByMe, isSavedByMe]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.put(`http://localhost:5005/api/posts/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsLiked(res.data.liked);
      setLikesCount(res.data.data.length);
    } catch (error) {
      setIsLiked(!newLiked);
      setLikesCount(initialLikes);
      console.error('Failed to like post:', error);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.put(`http://localhost:5005/api/posts/${id}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsSaved(res.data.saved);
    } catch (error) {
      setIsSaved(!newSaved);
      console.error('Failed to save post:', error);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/posts/${id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Interakt Post',
          text: content.substring(0, 50) + '...',
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Post link copied to clipboard!');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = localStorage.getItem('campushub_token');
      const deleteUrl = user?.role === 'admin'
        ? `http://localhost:5005/api/admin/posts/${id}`
        : `http://localhost:5005/api/posts/${id}`;
      
      await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsDeleted(true);
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post');
    }
  };

  const displayTag = tags?.[0] || category;
  const tagColor = displayTag ? (tagColors[displayTag] || '#9ca3af') : null;

  const ProfileLink = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
    if (!userId) return <div className={className}>{children}</div>;
    return <Link href={`/profile/${userId}`} className={className} onClick={e => e.stopPropagation()}>{children}</Link>;
  };

  if (isDeleted) return null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl p-6 mb-4 hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)] transition-all duration-300 border border-white/5 hover:border-purple-500/15"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <ProfileLink>
            <div className="w-11 h-11 rounded-full bg-gray-700 overflow-hidden ring-2 ring-purple-500/25 p-[2px] cursor-pointer hover:ring-purple-400/50 transition-all flex-shrink-0">
              <img src={avatar} alt={author} className="w-full h-full object-cover rounded-full" />
            </div>
          </ProfileLink>
          <div>
            <ProfileLink>
              <h3 className="font-bold text-white text-sm hover:text-[var(--accent-pink)] transition-colors cursor-pointer">
                @{author}
              </h3>
            </ProfileLink>
            <span className="text-xs text-gray-500 mt-0.5 block">{time}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {tagColor && displayTag && (
            <span
              style={{ backgroundColor: tagColor + '18', color: tagColor, borderColor: tagColor + '40' }}
              className="px-2.5 py-1 rounded-full text-xs font-bold border hidden sm:inline-block"
            >
              #{displayTag}
            </span>
          )}
          {(user && (user._id === userId || user.role === 'admin')) && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Link href={`/posts/${id}`}>
        <div className="mb-4">
          <p className="text-gray-200 text-[15px] leading-relaxed whitespace-pre-wrap mb-4">{content}</p>
          {image && (
            <div className="rounded-2xl overflow-hidden border border-white/10 relative group mb-4">
              <img src={image} alt="Post content" className="w-full h-auto object-cover max-h-[400px] group-hover:scale-105 transition-transform duration-700" />
            </div>
          )}
        </div>
      </Link>

      <div className="flex items-center justify-between pt-4 border-t border-white/8">
        <div className="flex space-x-5">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className={`flex items-center space-x-1.5 transition-colors group ${isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-pink-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.6)]' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="text-sm font-semibold">{likesCount}</span>
          </motion.button>

          <Link href={`/posts/${id}`}>
            <div className="flex items-center space-x-1.5 text-gray-500 hover:text-[var(--accent-purple)] transition-colors group">
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">{comments}</span>
            </div>
          </Link>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="flex items-center space-x-1.5 text-gray-500 hover:text-green-400 transition-colors group"
          >
            <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={handleSave}
          className={`transition-colors group ${isSaved ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]' : 'group-hover:scale-110 transition-transform'}`} />
        </motion.button>
      </div>
    </motion.article>
  );
};

export default PostCard;
