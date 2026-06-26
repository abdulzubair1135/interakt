"use client";

import PostCard from '@/components/ui/PostCard';
import { Image as ImageIcon, FileText, Sparkles, Loader2, Tag, X } from 'lucide-react';
import AdBanner from '@/components/ui/AdBanner';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/components/providers/AuthProvider';

const POST_TAGS = ['general', 'funny', 'study', 'confession', 'memes', 'exam', 'events', 'clubs'];

const tagColors: Record<string, string> = {
  funny: '#f59e0b', study: '#3b82f6', confession: '#ec4899',
  memes: '#10b981', exam: '#ef4444', events: '#8b5cf6',
  clubs: '#06b6d4', general: '#9ca3af',
};

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [postMedia, setPostMedia] = useState('');
  const [selectedTag, setSelectedTag] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchPosts = async () => {
    try {
      const params: any = {};
      if (activeFilter !== 'all') params.tag = activeFilter;
      const res = await axios.get('https://interakt-api.onrender.com/api/posts', { params });
      setPosts(res.data.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeFilter]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large. Max size is 10MB.");
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const token = localStorage.getItem('campushub_token');
        const res = await axios.post(
          'https://interakt-api.onrender.com/api/posts/upload',
          { base64: base64String },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          setPostMedia(res.data.url);
        } else {
          alert('Upload failed');
        }
      } catch (error: any) {
        console.error('Error uploading image:', error);
        alert(error.response?.data?.error || 'Failed to upload image');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!postText.trim()) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.post(
        'https://interakt-api.onrender.com/api/posts',
        { text: postText, media: postMedia || undefined, category: selectedTag, tags: [selectedTag] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPostText('');
      setPostMedia('');
      setSelectedTag('general');
      setShowTagPicker(false);
      setShowMediaInput(false);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Are you logged in?');
    } finally {
      setIsSubmitting(false);
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

  const avatarSrc = user?.avatar?.startsWith('http')
    ? user.avatar
    : user?.avatar
    ? undefined
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?._id}`;

  return (
    <div className="max-w-2xl mx-auto w-full pt-6 px-4 md:px-6 pb-24">
      {/* Create Post */}
      <div id="post-input" className="glass rounded-2xl p-5 mb-6 border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex space-x-3 mb-4">
          {/* User Avatar */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[var(--accent-purple)] to-[var(--accent-pink)] p-[2px] flex-shrink-0">
            {avatarSrc ? (
              <img src={avatarSrc} alt="me" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center text-xl bg-[var(--background)]">
                {user?.avatar || '😀'}
              </div>
            )}
          </div>
          <textarea
            id="post-textarea"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder={`What's happening, ${user?.username || 'campus'}? 🚀`}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none h-14 text-white placeholder-gray-500 pt-2 text-[15px] focus:outline-none"
          />
        </div>

        {/* Media Section (shown when clicked or has media/uploading) */}
        {(showMediaInput || uploadingImage || postMedia) && (
          <div className="mb-4 space-y-3 p-3 bg-white/5 rounded-xl border border-white/10">
            {/* Image Preview / Uploading status */}
            {(uploadingImage || postMedia) && (
              <div className="relative rounded-lg overflow-hidden bg-black/20 max-h-60 flex items-center justify-center border border-white/5">
                {uploadingImage ? (
                  <div className="flex flex-col items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-purple)] mb-2" />
                    <span className="text-xs text-gray-400 font-medium">Uploading image to Interakt...</span>
                  </div>
                ) : (
                  <>
                    <img src={postMedia} alt="Upload preview" className="object-cover max-h-60 w-full" />
                    <button
                      onClick={() => setPostMedia('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors border border-white/10 text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Selector/Input controls */}
            {!uploadingImage && !postMedia && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('post-image-file');
                    if (el) (el as HTMLInputElement).click();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" /> Select Local Image File
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">or</span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>
                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1.5 border border-white/5">
                  <input
                    type="text"
                    value={postMedia}
                    onChange={e => setPostMedia(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 bg-transparent text-white text-xs focus:outline-none placeholder-gray-500"
                  />
                  {postMedia && (
                    <button onClick={() => setPostMedia('')}>
                      <X className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {!uploadingImage && (
              <div className="flex justify-end">
                <button
                  onClick={() => { setShowMediaInput(false); }}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Close Upload Section
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tag Picker */}
        {showTagPicker && (
          <div className="mb-3 flex flex-wrap gap-2">
            {POST_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => { setSelectedTag(tag); setShowTagPicker(false); }}
                style={{
                  borderColor: selectedTag === tag ? tagColors[tag] + '60' : 'transparent',
                  backgroundColor: selectedTag === tag ? tagColors[tag] + '20' : 'rgba(255,255,255,0.05)',
                  color: selectedTag === tag ? tagColors[tag] : '#9ca3af',
                }}
                className="px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-white/10">
          <div className="flex space-x-1">
            <button
              onClick={() => setShowMediaInput(!showMediaInput)}
              className={`p-2 rounded-full transition-colors ${showMediaInput ? 'text-[var(--accent-purple)] bg-purple-500/15' : 'text-gray-400 hover:text-[var(--accent-purple)] hover:bg-purple-500/10'}`}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="file"
              id="post-image-file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => setShowTagPicker(!showTagPicker)}
              className={`p-2 rounded-full transition-colors ${showTagPicker ? 'text-pink-400 bg-pink-500/15' : 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'}`}
            >
              <Tag className="w-5 h-5" />
            </button>
            {selectedTag !== 'general' && (
              <span
                style={{ backgroundColor: tagColors[selectedTag] + '20', color: tagColors[selectedTag] }}
                className="flex items-center px-3 py-1 rounded-full text-xs font-bold ml-1 self-center"
              >
                #{selectedTag}
                <button onClick={() => setSelectedTag('general')} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={handleCreatePost}
            disabled={isSubmitting || !postText.trim()}
            className="bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-bold py-2 px-6 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px] active:scale-95"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀 Post'}
          </button>
        </div>
      </div>

      {/* Feed Filter */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        {['all', ...POST_TAGS].map(tag => (
          <button
            key={tag}
            onClick={() => setActiveFilter(tag)}
            style={activeFilter === tag ? { backgroundColor: tagColors[tag] || 'var(--accent-purple)', borderColor: 'transparent' } : {}}
            className={`px-4 py-1.5 rounded-full text-xs font-bold flex-shrink-0 border transition-all ${
              activeFilter === tag
                ? 'text-white'
                : 'glass border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Feed Header */}
      <div className="flex items-center space-x-4 mb-4">
        <h2 className="text-xl font-bold">Your Feed</h2>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent" />
      </div>

      {/* Posts */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 rounded-full border-4 border-white/10 border-t-[var(--accent-purple)] animate-spin" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post._id} className="mb-4">
              <PostCard
                id={post._id}
                author={post.user?.username || 'Anonymous'}
                avatar={post.user?.avatar?.startsWith('http')
                  ? post.user.avatar
                  : `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?._id}`}
                time={calculateTimeAgo(post.createdAt)}
                content={post.text}
                image={post.media}
                likes={post.likes?.length || 0}
                comments={post.comments?.length || 0}
                type={post.postType}
                category={post.category}
                tags={post.tags}
                isLikedByMe={post.likes?.includes(user?._id || user?.id)}
                userId={post.user?._id}
                isAuthorPremium={post.user?.isPremium}
              />
              {!user?.isPremium && (index + 1) % 3 === 0 && <div className="mt-4"><AdBanner /></div>}
            </div>
          ))
        ) : (
          <div className="text-center py-14 text-gray-500 glass rounded-2xl">
            <div className="text-5xl mb-4">🌙</div>
            <p className="font-medium">The campus is quiet...</p>
            <p className="text-sm mt-1">Be the first to post something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
