"use client";

import { Search, Send, Image as ImageIcon, MoreVertical, Phone, Video, Loader2, Users, Plus, X, Search as SearchIcon, MessageSquare, ArrowLeft, Trash2, Flag } from 'lucide-react';
import { useState, useEffect, useRef, Suspense } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket = io('https://interakt-api.onrender.com');
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
    
    socket.emit('join_chat', activeChat.id === 'global' ? 'global_room' : activeChat.id);

    const handleReceive = (message: any) => {
      if (message.chatId === (activeChat.id === 'global' ? 'global_room' : activeChat.id)) {
        setMessages((prev) => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      // Update sidebar last message in real-time
      setChats(prev => prev.map(c => {
        const isMatch = (c.isGlobal && message.chatId === 'global_room') || (!c.isGlobal && c.id === message.chatId);
        if (isMatch) {
          return { ...c, lastMessage: message.text, time: message.time };
        }
        return c;
      }));
    };

    socket.on('receive_message', handleReceive);

    const fetchHistory = async () => {
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
    };
  }, [activeChat.id]);

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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !currentUser) return;

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
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                  chat.isGlobal 
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_10px_rgba(147,51,234,0.3)]' 
                    : chat.isGroup
                      ? 'bg-gradient-to-tr from-blue-600 to-cyan-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                      : 'bg-gradient-to-tr from-pink-600 to-rose-600 shadow-[0_0_10px_rgba(219,39,119,0.3)]'
                }`}>
                  {chat.isGlobal ? '#' : chat.isGroup ? <Users className="w-5 h-5" /> : chat.name[0]?.toUpperCase()}
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
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                <span>Active Chat</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-purple-500" /></div>
          ) : (
            messages.map((msg, index) => {
              const isMe = currentUser && msg.sender?._id === currentUser._id;
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
                    isMe 
                      ? 'bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-pink)] text-white rounded-tr-none shadow-[0_4px_15px_rgba(139,92,246,0.25)]' 
                      : 'bg-white/10 dark:bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-tl-none'
                  }`}>
                    {!isMe && (
                      <p className="text-[10px] font-extrabold text-[var(--accent-pink)] mb-1 flex items-center gap-1">
                        <span>@{msg.sender?.username}</span>
                        {msg.sender?.role === 'admin' && (
                          <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded font-mono uppercase tracking-widest border border-red-500/30">Admin</span>
                        )}
                      </p>
                    )}
                    <p className="text-sm font-medium leading-relaxed break-words">{msg.text}</p>
                    <span className="text-[9px] opacity-60 block mt-1 text-right font-mono">{msg.time}</span>
                    
                    {(isMe || currentUser?.role === 'admin') && msg.viewedByUsers && msg.viewedByUsers.length > 0 && (
                      <div className="text-[8px] opacity-75 mt-1.5 flex items-center justify-end gap-1 border-t border-white/5 pt-1 text-right italic font-mono">
                        <span>Seen by: {msg.viewedByUsers.map((u: any) => `@${u.username}`).join(', ')}</span>
                      </div>
                    )}
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

        <form onSubmit={handleSendMessage} className="p-4 glass rounded-none border-t border-white/10">
          <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-full p-2 pr-4">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
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
