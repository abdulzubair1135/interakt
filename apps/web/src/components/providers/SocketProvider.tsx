"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { playNotificationSound } from '../ui/notificationHelper';
import { useRouter } from 'next/navigation';

type SocketContextType = {
  socket: Socket | null;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  unreadCounts: Record<string, number>;
  clearUnreadCount: (chatId: string) => void;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  activeChatId: null,
  setActiveChatId: () => {},
  unreadCounts: {},
  clearUnreadCount: () => {},
});

export const useSocket = () => useContext(SocketContext);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inAppNotification, setInAppNotification] = useState<{ senderName: string, avatar: string, text: string, chatId: string } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io('https://interakt-api.onrender.com', {
      transports: ['websocket'],
      query: { userId: user._id }
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_user_room', user._id);
    });

    newSocket.on('receive_message', (message: any) => {
      const isMe = user && (message.sender?._id === user._id || message.sender === user._id);
      if (isMe) return;

      const chatRoomId = message.chatId === 'global_room' ? 'global' : message.chatId;

      // 1. Increment unread count if it's not the active chat
      if (activeChatId !== chatRoomId) {
        setUnreadCounts(prev => {
          const currentCount = prev[chatRoomId] || 0;
          return {
            ...prev,
            [chatRoomId]: currentCount + 1
          };
        });
      }

      // 2. Trigger notification alert if not viewing this chat
      if (activeChatId !== chatRoomId) {
        const isGlobal = message.chatId === 'global_room' || message.isGlobal;
        const isGroup = message.group || message.chatId.startsWith('group_');

        const isChatMuted = localStorage.getItem(`mute_chat_${message.chatId}`) === 'true';
        let shouldAlert = !isChatMuted;

        if (isGlobal) {
          shouldAlert = false;
        } else if (isGroup) {
          shouldAlert = shouldAlert && localStorage.getItem('interakt_group_notifs') !== 'false';
        } else {
          shouldAlert = shouldAlert && localStorage.getItem('interakt_personal_notifs') !== 'false';
        }

        if (shouldAlert) {
          playNotificationSound();

          if (!document.hidden) {
            setInAppNotification({
              senderName: message.sender?.username || 'User',
              avatar: message.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender?._id}`,
              text: message.text,
              chatId: chatRoomId
            });
            setTimeout(() => {
              setInAppNotification(prev => prev?.chatId === chatRoomId ? null : prev);
            }, 4000);
          } else {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Message from @${message.sender?.username || 'User'}`, {
                body: message.text,
                icon: '/logo.jpg'
              });
            }
          }
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, activeChatId]);

  const clearUnreadCount = (chatId: string) => {
    setUnreadCounts(prev => {
      if (!prev[chatId]) return prev;
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
  };

  return (
    <SocketContext.Provider value={{ socket, activeChatId, setActiveChatId, unreadCounts, clearUnreadCount }}>
      {children}
      
      {/* Instagram-like In-App Top Notification Toast */}
      <AnimatePresence>
        {inAppNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={() => {
              router.push(`/messages?chat=${inAppNotification.chatId}`);
              setInAppNotification(null);
            }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-md bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_15px_30px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-zinc-800/95 transition-all select-none"
          >
            <img 
              src={inAppNotification.avatar} 
              alt={inAppNotification.senderName} 
              className="w-11 h-11 rounded-full object-cover border-2 border-[var(--accent-purple)]"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-black tracking-widest text-[var(--accent-pink)] block mb-0.5">New Message</span>
              <h4 className="text-sm font-extrabold text-white">@{inAppNotification.senderName}</h4>
              <p className="text-xs text-gray-300 truncate mt-0.5">{inAppNotification.text}</p>
            </div>
            <div className="w-2.5 h-2.5 bg-[var(--accent-purple)] rounded-full animate-pulse shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>
    </SocketContext.Provider>
  );
}
