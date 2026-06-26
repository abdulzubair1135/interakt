"use client";

import { X, UserPlus, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'followers' | 'following';
  title: string;
}

export default function FollowListModal({ isOpen, onClose, userId, type, title }: FollowListModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`https://interakt-api.onrender.com/api/auth/profile/${userId}/${type}`);
          setUsers(res.data.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass max-w-md w-full rounded-3xl overflow-hidden border border-white/20 shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {loading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : users.length > 0 ? (
                users.map(user => (
                  <Link 
                    key={user._id} 
                    href={`/profile/${user._id}`}
                    onClick={onClose}
                    className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                    <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`} className="w-12 h-12 rounded-full border border-white/10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white group-hover:text-purple-400 transition-colors">@{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.bio || 'Interakt Member'}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500 italic">No {type} yet.</div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
