"use client";

import { Bell, Heart, MessageCircle, UserPlus, Loader2, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('campushub_token');
        if (!token) return;

        const res = await axios.get('https://interakt-api.onrender.com/api/auth/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data.data);

        // Mark as read
        await axios.put('https://interakt-api.onrender.com/api/auth/notifications/read', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' };
      case 'comment': return { icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'follow': return { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-500/10' };
      case 'message': return { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      default: return { icon: Info, color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getMessage = (notif: any) => {
    const sender = notif.sender?.username || 'Someone';
    switch (notif.type) {
      case 'like': return `${sender} liked your post.`;
      case 'comment': return `${sender} commented on your post.`;
      case 'follow': return `${sender} started following you.`;
      case 'message': return `${sender} sent you a message.`;
      default: return `${sender} interacted with you.`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-12 px-4 md:px-6 pb-24">
      <div className="flex items-center space-x-4 mb-8">
        <Bell className="w-8 h-8 text-[var(--accent-purple)]" />
        <h1 className="text-3xl font-bold text-gradient">Notice</h1>
      </div>
      
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-purple-500" /></div>
        ) : notifications.length > 0 ? (
          notifications.map(notif => {
            const { icon: Icon, color, bg } = getIcon(notif.type);
            return (
              <div key={notif._id} className={`glass rounded-2xl p-5 flex items-start space-x-4 hover:bg-white/5 transition-all border border-white/5 ${!notif.isRead ? 'border-l-4 border-l-purple-500' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm leading-relaxed">{getMessage(notif)}</p>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">{getTimeAgo(notif.createdAt)}</p>
                </div>
                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>}
              </div>
            );
          })
        ) : (
          <div className="glass rounded-2xl p-12 text-center border border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">All quiet for now</h2>
            <p className="text-gray-500">When people interact with you, it will show up here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
