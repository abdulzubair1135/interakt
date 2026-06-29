"use client";

import { Search, Send, Image as ImageIcon, MoreVertical, Phone, Video, Loader2, Users, Plus, X, Search as SearchIcon, MessageSquare, ArrowLeft, Trash2, Flag, Crown, Eye, ShieldAlert } from 'lucide-react';
import { useState, useEffect, useRef, Suspense } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { renderCensoredText } from '@/components/ui/profanityHelper';
import { playNotificationSound } from '@/components/ui/notificationHelper';

let socket: any;

function MessagesContent() {
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get('user');

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<any>({ id: 'global', name: 'Chit-chat', isGlobal: true });
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [chats, setChats] = useState<any[]>([
    { id: 'global', name: 'Chit-chat', lastMessage: 'Welcome!', time: 'Now', isGlobal: true }
  ]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [following, setFollowing] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<any>(null);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [activeGroupDetails, setActiveGroupDetails] = useState<any>(null);
  const [adminWarningMsg, setAdminWarningMsg] = useState<string | null>(null);
  const isTypingRef = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('campushub_token');
    socket = io('https://interakt-api.onrender.com', {
      auth: { token }
    });
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('campushub_token');
        if (!token) return;

        const meRes = await axios.get('https://interakt-api.onrender.com/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(meRes.data.data);

        // Fetch conversations (Direct Messages + Groups)
        const convRes = await axios.get('https://interakt-api.onrender.com/api/messages/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChats([
          { id: 'global', name: 'Chit-chat', lastMessage: '📡 Live Campus Chat', time: 'Now', isGlobal: true },
          ...convRes.data.data
        ]);

        // Fetch following users for group members selection
        const followingRes = await axios.get('https://interakt-api.onrender.com/api/auth/following', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFollowing(followingRes.data.data);

        // Handle URL query to open personal chat automatically
        if (userIdFromQuery) {
          const userRes = await axios.get(`https://interakt-api.onrender.com/api/auth/profile/${userIdFromQuery}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const targetUser = userRes.data.data;
          if (targetUser) {
            const existingChat = convRes.data.data.find((c: any) => c.id === targetUser._id);
            if (existingChat) {
              setActiveChat(existingChat);
              setShowChatMobile(true);
            } else {
              const newPersonalChat = {
                id: targetUser._id,
                name: targetUser.username,
                avatar: targetUser.avatar,
                isGlobal: false,
                isGroup: false,
                lastMessage: 'Open chat to start messaging',
                time: 'Now'
              };
              setChats(prev => [
                prev[0], // Global chat
                newPersonalChat,
                ...prev.slice(1)
              ]);
              setActiveChat(newPersonalChat);
              setShowChatMobile(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial data', err);
      }
    };

    fetchData();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Reset typing states on chat change
    setTypingUsers([]);
    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socket.emit('join_chat', activeChat.id === 'global' ? 'global_room' : activeChat.id);

    // Mark current chat as read
    if (currentUser && activeChat.id !== 'global') {
      socket.emit('read_message', { chatId: activeChat.id, userId: currentUser._id });
    }

    // Request online status for loaded personal chats
    const personalUserIds = chats.filter(c => !c.isGlobal && !c.isGroup).map(c => c.id);
    if (personalUserIds.length > 0) {
      socket.emit('check_online_status', personalUserIds);
    }

    const handleReceive = (message: any) => {
      const activeRoom = activeChat.id === 'global' ? 'global_room' : activeChat.id;
      const isCurrentChat = message.chatId === activeRoom;
      
      if (isCurrentChat) {
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        
        // Emit read receipt for the newly received message if it is currently active
        if (currentUser && activeChat.id !== 'global') {
          socket.emit('read_message', { chatId: activeChat.id, userId: currentUser._id });
        }
      }

      const isMe = currentUser && (message.sender?._id === currentUser._id || message.sender === currentUser._id);
      if (!isMe) {
        const isGlobal = message.chatId === 'global_room' || message.isGlobal;
        const isGroup = message.group || message.chatId.startsWith('group_') || (chats.find(c => c.id === message.chatId)?.isGroup);

        let shouldAlert = true;
        if (isGlobal) {
          shouldAlert = false; // Never notify for global room chat spam
        } else if (isGroup) {
          shouldAlert = localStorage.getItem('interakt_group_notifs') !== 'false';
        } else {
          shouldAlert = localStorage.getItem('interakt_personal_notifs') !== 'false';
        }

        if (shouldAlert) {
          playNotificationSound();
          
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification(`Message from @${message.sender?.username || 'User'}`, {
              body: message.text,
              icon: '/logo.jpg'
            });
          }
        }
      }

      setChats(prev => prev.map(c => {
        const isMatch = (c.isGlobal && message.chatId === 'global_room') || (!c.isGlobal && c.id === message.chatId);
        if (isMatch) {
          return { ...c, lastMessage: message.text, time: message.time };
        }
        return c;
      }));
    };

    const handleUserTyping = (data: any) => {
      const activeRoom = activeChat.id === 'global' ? 'global_room' : activeChat.id;
      if (data.chatId === activeRoom && data.userId !== currentUser?._id) {
        setTypingUsers(prev => {
          if (prev.some(u => u.userId === data.userId)) return prev;
          return [...prev, data];
        });
      }
    };

    const handleUserStopTyping = (data: any) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    const handleUserStatus = (data: { userId: string, status: string }) => {
      setOnlineStatuses(prev => ({ ...prev, [data.userId]: data.status }));
    };

    const handleOnlineStatuses = (statuses: { userId: string, status: string }[]) => {
      const newStatuses: Record<string, string> = {};
      statuses.forEach(s => {
        newStatuses[s.userId] = s.status;
      });
      setOnlineStatuses(prev => ({ ...prev, ...newStatuses }));
    };

    const handleMessageRead = (data: { chatId: string, userId: string }) => {
      setMessages(prev => prev.map(m => {
        const alreadySeen = m.viewedByUsers?.some((u: any) => u._id === data.userId);
        if (!alreadySeen && data.userId !== currentUser?._id) {
          const userObj = { _id: data.userId, username: data.userId }; // Mock structure, will format in UI
          return {
            ...m,
            viewedByUsers: [...(m.viewedByUsers || []), userObj]
          };
        }
        return m;
      }));
    };

    const handleAdminWarning = (data: { reason: string }) => {
      setAdminWarningMsg(data.reason);
    };

    socket.on('receive_message', handleReceive);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('user_status', handleUserStatus);
    socket.on('online_statuses', handleOnlineStatuses);
    socket.on('message_read', handleMessageRead);
    socket.on('admin_warning', handleAdminWarning);    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('campushub_token');
        let msgUrl = 'https://interakt-api.onrender.com/api/messages/global';
        if (!activeChat.isGlobal) {
          msgUrl = activeChat.isGroup 
            ? `https://interakt-api.onrender.com/api/messages/group/${activeChat.id}`
            : `https://interakt-api.onrender.com/api/messages/personal/${activeChat.id}`;
        }

        const res = await axios.get(msgUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const history = res.data.data.map((msg: any) => ({
          _id: msg._id,
          text: msg.text,
          sender: msg.sender,
          viewedByUsers: msg.viewedByUsers || [],
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        
        setMessages(history);
      } catch (err) {
        console.error('Failed to load chat history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('user_status', handleUserStatus);
      socket.off('online_statuses', handleOnlineStatuses);
      socket.off('message_read', handleMessageRead);
      socket.off('admin_warning', handleAdminWarning);
    };
  }, [activeChat.id, chats.length]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (memberSearchQuery) {
        searchPublicUsers();
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [memberSearchQuery]);

  const searchPublicUsers = async () => {
    try {
      const res = await axios.get(`https://interakt-api.onrender.com/api/auth/search?q=${memberSearchQuery}`);
      setSearchResults(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket || !currentUser) return;

    const activeRoom = activeChat.id === 'global' ? 'global_room' : activeChat.id;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', {
        chatId: activeRoom,
        userId: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop_typing', {
        chatId: activeRoom,
        userId: currentUser._id
      });
    }, 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    // Reset typing status on send
    if (socket) {
      const activeRoom = activeChat.id === 'global' ? 'global_room' : activeChat.id;
      isTypingRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('stop_typing', {
        chatId: activeRoom,
        userId: currentUser._id
      });
    }

    const newMsgText = inputText;
    setInputText('');

    try {
      const token = localStorage.getItem('campushub_token');
      let url = 'https://interakt-api.onrender.com/api/messages/global';
      if (!activeChat.isGlobal) {
        url = activeChat.isGroup 
          ? `https://interakt-api.onrender.com/api/messages/group/${activeChat.id}`
          : `https://interakt-api.onrender.com/api/messages/personal/${activeChat.id}`;
      }

      const res = await axios.post(url, 
        { text: newMsgText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const savedMsg = res.data.data;
      const messageData = {
        _id: savedMsg._id,
        chatId: activeChat.id === 'global' ? 'global_room' : activeChat.id,
        text: savedMsg.text,
        sender: savedMsg.sender,
        viewedByUsers: savedMsg.viewedByUsers || [],
        time: new Date(savedMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      socket.emit('send_message', messageData);
      setMessages(prev => [...prev, messageData]);

      // Update sidebar last message in real-time
      setChats(prev => prev.map(c => {
        if (c.id === activeChat.id) {
          return { ...c, lastMessage: newMsgText, time: 'Now' };
        }
        return c;
      }));

    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleFetchGroupDetails = async (groupId: string) => {
    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.get(`https://interakt-api.onrender.com/api/messages/group/${groupId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveGroupDetails(res.data.data);
      setShowGroupDetailsModal(true);
    } catch (err) {
      console.error('Failed to fetch group details', err);
      alert('Failed to load group details');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.post(`https://interakt-api.onrender.com/api/messages/group/${groupId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowGroupDetailsModal(false);
      setChats(prev => prev.filter(c => c.id !== groupId));
      setActiveChat({ id: 'global', name: 'Chit-chat', lastMessage: '📡 Live Campus Chat', time: 'Now', isGlobal: true });
      alert('Successfully left the group.');
    } catch (err) {
      console.error('Failed to leave group', err);
      alert('Failed to leave the group');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      alert('Select at least one member');
      return;
    }
    try {
      const token = localStorage.getItem('campushub_token');
      const res = await axios.post('https://interakt-api.onrender.com/api/messages/group', {
        name: newGroupName,
        description: newGroupDesc,
        members: selectedMembers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newGroup = res.data.data;
      const groupChat = {
        id: newGroup._id,
        name: newGroup.name,
        isGroup: true,
        lastMessage: 'Group created',
        time: 'Now'
      };

      setChats(prev => [groupChat, ...prev]);
      setActiveChat(groupChat);
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setSelectedMembers([]);
    } catch (err) {
      console.error('Failed to create group', err);
      alert('Failed to create group. Premium might be required.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) return;
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.delete(`https://interakt-api.onrender.com/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (err) {
      console.error('Failed to delete message', err);
      alert('Failed to delete message');
    }
  };

  const handleReportMessage = async (messageId: string) => {
    if (!messageId) return;
    const reason = prompt('Please enter the reason for reporting this message:');
    if (!reason || !reason.trim()) return;
    try {
      const token = localStorage.getItem('campushub_token');
      await axios.post(`https://interakt-api.onrender.com/api/messages/${messageId}/report`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Message reported successfully. The Admin will review it shortly.');
    } catch (err) {
      console.error('Failed to report message', err);
      alert('Failed to report message');
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] md:h-[calc(100vh-4rem)] overflow-hidden max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6 gap-6">
      
      {/* Sidebar: Chats List */}
      <div className={`w-full md:w-80 h-full flex flex-col bg-black/20 glass rounded-3xl border border-white/10 overflow-hidden shrink-0 animate-fadeIn ${
        showChatMobile ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-[var(--accent-purple)]" />
            <span>Messages</span>
          </h2>
          <button 
            onClick={() => setShowCreateGroup(true)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-purple-400 hover:text-purple-300 border border-white/5 hover:border-white/10"
            title="Create Group Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
          {chats.map(chat => {
            const isActive = activeChat.id === chat.id;
            return (
              <div 
                key={chat.id} 
                onClick={() => { setActiveChat(chat); setShowChatMobile(true); }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center space-x-3 border ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/10 border-purple-500/25 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                    : 'bg-white/0 hover:bg-white/5 border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                    chat.isGlobal 
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]' 
                      : chat.isGroup
                        ? 'bg-gradient-to-tr from-blue-600 to-cyan-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                        : 'bg-gradient-to-tr from-pink-600 to-rose-600 shadow-[0_0_10px_rgba(219,39,119,0.3)]'
                  }`}>
                    {chat.isGlobal ? '#' : chat.isGroup ? <Users className="w-5 h-5" /> : chat.name[0]?.toUpperCase()}
                  </div>
                  {(!chat.isGlobal && !chat.isGroup && onlineStatuses[chat.id] === 'online') && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)] animate-pulse" title="Online" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-sm text-white truncate">{chat.name}</h3>
                    <span className="text-[9px] text-gray-500 shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{chat.lastMessage || 'Open chat to message'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 h-full flex flex-col relative bg-black/20 glass rounded-3xl border border-white/10 overflow-hidden ${
        showChatMobile ? 'flex' : 'hidden md:flex'
      }`}>
        <div className="h-20 border-b border-white/10 px-6 flex items-center justify-between glass rounded-none">
          <div className="flex items-center space-x-3">
            {/* Mobile Back Button */}
            <button 
              onClick={() => setShowChatMobile(false)}
              className="md:hidden p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div 
              onClick={() => activeChat.isGroup && handleFetchGroupDetails(activeChat.id)}
              className={`flex items-center space-x-3 ${activeChat.isGroup ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''}`}
              title={activeChat.isGroup ? "View Group Details" : undefined}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg ${
                activeChat.isGlobal 
                  ? 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]' 
                  : activeChat.isGroup
                    ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                    : 'bg-pink-600 shadow-[0_0_10px_rgba(219,39,119,0.3)]'
              }`}>
                {activeChat.isGlobal ? '#' : activeChat.isGroup ? <Users className="w-5 h-5" /> : activeChat.name[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-white text-base">{activeChat.name}</h2>
                {!activeChat.isGlobal && !activeChat.isGroup ? (
                  onlineStatuses[activeChat.id] === 'online' ? (
                    <p className="text-[10px] text-green-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      <span>Online</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                      <span>Offline</span>
                    </p>
                  )
                ) : (
                  <p className="text-[10px] text-green-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    <span>{activeChat.isGroup ? 'Group Chat (View Info)' : 'Active Room'}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-purple-500" /></div>
          ) : (
            messages.map((msg, index) => {
              const isMe = currentUser && msg.sender?._id === currentUser._id;
              const isPremium = msg.sender?.isPremium || (isMe && currentUser?.isPremium);
              return (
                <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-center gap-2 group/msg animate-slideIn`}>
                  {/* Actions for messages sent by me */}
                  {isMe && (
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className={`max-w-[85%] md:max-w-[70%] p-3.5 px-4 rounded-2xl shadow-lg transition-all ${
                    isPremium
                      ? isMe 
                        ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-black font-medium rounded-tr-none shadow-[0_4px_15px_rgba(234,179,8,0.3)] border border-yellow-300' 
                        : 'bg-gradient-to-br from-yellow-950/40 to-transparent backdrop-blur-md text-white border border-yellow-500/50 rounded-tl-none shadow-[0_4px_15px_rgba(234,179,8,0.1)]'
                      : isMe 
                        ? 'bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] text-white rounded-tr-none shadow-[0_4px_15px_rgba(139,92,246,0.25)]' 
                        : 'bg-white/10 dark:bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-tl-none'
                  }`}>
                    {!isMe && (
                      <p className={`text-[10px] font-extrabold mb-1 flex items-center gap-1 ${isPremium ? 'text-yellow-400 drop-shadow-[0_0_2px_rgba(234,179,8,0.5)]' : 'text-[var(--accent-pink)]'}`}>
                        <span>@{msg.sender?.username}</span>
                        {isPremium && <Crown className="w-3 h-3 text-yellow-400" />}
                        {msg.sender?.role === 'admin' && (
                          <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded font-mono uppercase tracking-widest border border-red-500/30">Admin</span>
                        )}
                      </p>
                    )}
                    <p className="text-sm font-medium leading-relaxed break-words">{renderCensoredText(msg.text)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 select-none">
                      <span className="text-[9px] opacity-60 font-mono">{msg.time}</span>
                      {isMe && (
                        msg.viewedByUsers && msg.viewedByUsers.length > 0 ? (
                          <span title={`Seen by: ${msg.viewedByUsers.map((u: any) => `@${u.username}`).join(', ')}`}>
                            <Eye className="w-3.5 h-3.5 text-purple-400 drop-shadow-[0_0_3px_rgba(168,85,247,0.4)]" />
                          </span>
                        ) : (
                          <span title="Unseen">
                            <Eye className="w-3.5 h-3.5 text-gray-500 opacity-30" />
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {/* Actions for messages sent by others */}
                  {!isMe && (
                    <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => handleReportMessage(msg._id)}
                        className="p-1 rounded bg-white/5 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition-all"
                        title="Report Message"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="p-1 rounded bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                          title="Delete Message (Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {typingUsers.length > 0 && (
          <div className="px-6 py-2 bg-purple-950/20 border-t border-white/5 text-[10px] text-purple-300 flex items-center gap-2 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
            <span>{typingUsers.map(u => `@${u.username}`).join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...</span>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-4 glass rounded-none border-t border-white/10">
          <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-full p-2 pr-4">
            <input 
              type="text" 
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message ${activeChat.name}...`}
              className="flex-1 bg-transparent border-none focus:outline-none text-white px-4"
            />
            <button type="submit" className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white active:scale-90 transition-transform"><Send className="w-4 h-4" /></button>
          </div>
        </form>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateGroup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass max-w-md w-full rounded-3xl p-6 border border-white/20"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Create Group Chat</h2>
                <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 hover:text-white"><X /></button>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Group Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter group name..." 
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono">Description</label>
                  <input 
                    type="text" 
                    placeholder="Enter group description..." 
                    value={newGroupDesc}
                    onChange={e => setNewGroupDesc(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Members to add</label>
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search followers or public accounts..." 
                      value={memberSearchQuery}
                      onChange={e => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 p-1 scrollbar-thin">
                  {/* Results list */}
                  {(memberSearchQuery ? searchResults : following).map(user => (
                    <div 
                      key={user._id} 
                      onClick={() => {
                        if (selectedMembers.includes(user._id)) setSelectedMembers(selectedMembers.filter(id => id !== user._id));
                        else setSelectedMembers([...selectedMembers, user._id]);
                      }}
                      className={`flex items-center space-x-3 p-2.5 rounded-xl cursor-pointer transition-colors ${selectedMembers.includes(user._id) ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-white font-bold text-xs">
                        {user.emoji || '👤'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">@{user.username}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email || 'Interakt Member'}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMembers.includes(user._id) ? 'bg-purple-500 border-purple-500' : 'border-gray-600'}`}>
                        {selectedMembers.includes(user._id) && <Plus className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  ))}
                  {following.length === 0 && searchResults.length === 0 && (
                    <p className="text-xs text-gray-500 italic text-center py-4">No users found.</p>
                  )}
                </div>

                <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-transform">
                  Create Group Chat
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Group Details Modal */}
      <AnimatePresence>
        {showGroupDetailsModal && activeGroupDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass max-w-md w-full rounded-3xl p-6 border border-white/20 relative"
            >
              <button 
                onClick={() => setShowGroupDetailsModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center justify-center text-white font-extrabold text-2xl mb-3">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{activeGroupDetails.name}</h2>
                <p className="text-xs text-gray-400 leading-relaxed px-4">{activeGroupDetails.description || 'No description provided.'}</p>
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-3">Members ({activeGroupDetails.members?.length || 0})</h3>
                <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {activeGroupDetails.members?.map((member: any) => {
                    const isAdmin = activeGroupDetails.admin === member._id || activeGroupDetails.admin?._id === member._id;
                    return (
                      <div key={member._id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <img src={member.avatar || 'https://via.placeholder.com/32'} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-1">
                              <span>@{member.username}</span>
                              {member.isPremium && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                            </p>
                            <p className="text-[10px] text-gray-400">{member.name || 'Member'}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 uppercase tracking-wider font-bold">Admin</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleLeaveGroup(activeGroupDetails._id)}
                  className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Leave Group
                </button>
                <button
                  onClick={() => setShowGroupDetailsModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Warning Modal */}
      <AnimatePresence>
        {adminWarningMsg && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="bg-black/90 border border-red-500 rounded-3xl p-8 max-w-md w-full text-center relative shadow-[0_0_50px_rgba(239,68,68,0.3)]"
            >
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-red-500 uppercase tracking-wider mb-2">Official Admin Warning</h2>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                You have received an official warning from the Interakt Moderation Team. Continued violation of community guidelines may lead to account suspension or a permanent ban.
              </p>
              <div className="p-4 bg-red-950/20 border border-red-500/25 rounded-2xl text-left mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 block mb-1">Violation Details:</span>
                <p className="text-sm font-semibold text-white leading-relaxed">{adminWarningMsg}</p>
              </div>
              <button
                onClick={() => setAdminWarningMsg(null)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition active:scale-95 shadow-lg shadow-red-500/20"
              >
                I Understand & Acknowledge
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Messages() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
