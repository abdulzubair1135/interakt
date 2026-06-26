"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from '@/components/ui/PostCard';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postRes = await axios.get(`http://localhost:5005/api/posts/${params.id}`);
        setPost(postRes.data.data);

        // Fetch comments using the correct endpoint
        const commentsRes = await axios.get(`http://localhost:5005/api/comments/${params.id}`);
        setComments(commentsRes.data.data);
      } catch (error) {
        console.error('Error fetching post detail:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('campushub_token');
      // Correct endpoint for adding a comment
      const res = await axios.post(`http://localhost:5005/api/comments/${params.id}`, 
        { text: commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // The backend returns the full list of comments or just the new one?
      // Based on controller: res.status(201).json({ success: true, data: populatedPost.comments });
      setComments(res.data.data);
      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Make sure you are logged in.');
    } finally {
      setSubmitting(false);
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

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <button onClick={() => router.back()} className="text-[var(--accent-purple)] flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full pt-8 px-4 md:px-0 pb-20">
      <button 
        onClick={() => router.back()} 
        className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Feed
      </button>

      <PostCard 
        id={post._id}
        author={post.user?.username || 'Anonymous'}
        avatar={post.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?._id}`}
        time={calculateTimeAgo(post.createdAt)}
        content={post.text}
        image={post.media}
        likes={post.likes?.length || 0}
        comments={comments.length}
        type={post.postType}
        category={post.category}
        userId={post.user?._id}
      />

      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          Comments <span className="ml-2 text-sm text-gray-500 font-normal">({comments.length})</span>
        </h3>

        <form onSubmit={handlePostComment} className="relative">
          <div className="glass rounded-2xl p-4 border border-white/10 focus-within:border-purple-500/50 transition-all">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full bg-transparent border-none focus:outline-none text-white text-sm resize-none min-h-[80px]"
            />
            <div className="flex justify-end mt-2">
              <button 
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white p-2 rounded-full transform hover:scale-105 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div 
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-4 border border-white/5"
              >
                <div className="flex items-start space-x-3">
                  <img 
                    src={comment.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?._id}`} 
                    alt={comment.user?.username} 
                    className="w-8 h-8 rounded-full bg-gray-800" 
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-white text-sm">{comment.user?.username}</span>
                      <span className="text-[10px] text-gray-500">{calculateTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {comments.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 italic">No comments yet. Be the first to start the conversation!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
