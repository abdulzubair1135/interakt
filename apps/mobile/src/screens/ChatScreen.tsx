import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView, Image, Alert, ScrollView,
  Modal, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Send, Image as ImageIcon, Smile, Phone, Video, Info, Users, Plus, X, Lock } from 'lucide-react-native';
import io from 'socket.io-client';
import api from '../services/api';
import { Theme } from '../theme/Theme';

const SOCKET_URL = 'http://10.220.75.109:5005';

type ChatView = 'list' | 'global' | 'personal';

export default function ChatScreen({ navigation }: any) {
  const { user } = useAuth();
  const [view, setView] = useState<ChatView>('list');
  const [globalMessages, setGlobalMessages] = useState<any[]>([]);
  const [personalMessages, setPersonalMessages] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [createGroupVisible, setCreateGroupVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  const socketRef = useRef<any>(null);
  const flatListRef = useRef<any>(null);

  const fetchConversations = () => {
    api.get('/messages/conversations')
      .then(r => setConversations(r.data.data || []))
      .catch(() => { });
  };

  const fetchGlobalMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages/global');
      setGlobalMessages(res.data.data);
    } catch { } finally { setLoading(false); }
  };

  const fetchPersonalMessages = async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/messages/personal/${userId}`);
      setPersonalMessages(res.data.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchConversations();
    api.get('/following')
      .then(r => setFollowing(r.data.data || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }

    const room = view === 'global' 
      ? 'global_room' 
      : (view === 'personal' && selectedUser ? selectedUser._id : null);

    if (room) {
      socketRef.current.emit('join_chat', room);
    }

    const handleReceive = (message: any) => {
      const msgRoom = message.room || message.chatId;
      if (msgRoom === 'global_room') {
        setGlobalMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      } else if (selectedUser && msgRoom === selectedUser._id) {
        setPersonalMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }
      fetchConversations();
    };

    socketRef.current.on('receive_message', handleReceive);

    return () => {
      socketRef.current.off('receive_message', handleReceive);
    };
  }, [view, selectedUser]);

  useEffect(() => {
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const openGlobalChat = () => {
    setView('global');
    fetchGlobalMessages();
  };

  const openPersonalChat = (targetUser: any) => {
    setSelectedUser(targetUser);
    setView('personal');
    fetchPersonalMessages(targetUser._id);
  };

  const sendGlobalMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    try {
      const res = await api.post('/messages/global', { text });
      const savedMsg = res.data.data;
      const msgData = { 
        ...savedMsg, 
        chatId: 'global_room', 
        room: 'global_room',
        time: new Date(savedMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socketRef.current?.emit('send_message', msgData);
      setGlobalMessages(prev => {
        if (prev.some(m => m._id === savedMsg._id)) return prev;
        return [...prev, savedMsg];
      });
      fetchConversations();
    } catch { Alert.alert('Error', 'Failed to send message'); }
  };

  const sendPersonalMessage = async () => {
    if (!inputText.trim() || !selectedUser) return;
    const text = inputText;
    setInputText('');
    try {
      const url = selectedUser.isGroup 
        ? `/messages/group/${selectedUser._id}`
        : `/messages/personal/${selectedUser._id}`;
      const res = await api.post(url, { text });
      const savedMsg = res.data.data;
      
      const msgData = { 
        ...savedMsg, 
        chatId: selectedUser._id, 
        room: selectedUser._id,
        time: new Date(savedMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      socketRef.current?.emit('send_message', msgData);
      setPersonalMessages(prev => {
        if (prev.some(m => m._id === savedMsg._id)) return prev;
        return [...prev, savedMsg];
      });
      fetchConversations();
    } catch { Alert.alert('Error', 'Failed to send message'); }
  };

  const handleCreateGroup = () => {
    if (!user?.isPremium && user?.role !== 'admin') {
      Alert.alert(
        '👑 Premium Only',
        'Creating group chats is a Premium feature. Upgrade your account to unlock this and more!',
        [{ text: 'Maybe Later', style: 'cancel' }, { text: 'Go Premium', onPress: () => Alert.alert('Coming Soon', 'Contact admin to upgrade') }]
      );
      return;
    }
    setCreateGroupVisible(true);
  };

  const handleCreateGroupSubmit = async () => {
    if (!newGroupName) return Alert.alert('Error', 'Please enter a group name');
    if (selectedMembers.length === 0) return Alert.alert('Error', 'Select at least one member');
    
    setLoading(true);
    try {
      const res = await api.post('/messages/group', {
        name: newGroupName,
        description: '',
        members: selectedMembers
      });
      setCreateGroupVisible(false);
      setNewGroupName('');
      setSelectedMembers([]);
      fetchConversations();
      
      const newGroup = res.data.data;
      setSelectedUser({ _id: newGroup._id, username: newGroup.name, isGroup: true });
      setView('personal');
      setPersonalMessages([]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const renderGlobalMessage = ({ item }: { item: any }) => {
    const isMe = item.sender?._id === (user?._id || user?.id);
    const avatarUri = item.sender?.avatar?.startsWith('http')
      ? item.sender.avatar
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.sender?._id}`;

    return (
      <View style={[styles.msgRow, isMe ? styles.myMsgRow : styles.theirMsgRow]}>
        {!isMe && <Image source={{ uri: avatarUri }} style={styles.msgAvatar} />}
        <View style={[styles.msgBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && <Text style={styles.msgSender}>{item.sender?.username}</Text>}
          <Text style={styles.msgText}>{item.text}</Text>
          <Text style={styles.msgTime}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderPersonalMessage = ({ item }: { item: any }) => {
    const isMe = item.sender?._id === (user?._id || user?.id);
    return (
      <View style={[styles.msgRow, isMe ? styles.myMsgRow : styles.theirMsgRow]}>
        <View style={[styles.msgBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && <Text style={styles.msgSender}>{item.sender?.username}</Text>}
          <Text style={styles.msgText}>{item.text}</Text>
          <Text style={styles.msgTime}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // ── Chat List View ──────────────────────────────────────────
  if (view === 'list') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={handleCreateGroup}>
            <Users size={16} color="white" />
            <Text style={styles.headerBtnText}>New Group</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {/* Global Chat */}
          <Text style={styles.sectionLabel}>🌐 Campus Chats</Text>
          <TouchableOpacity style={styles.chatItem} onPress={openGlobalChat}>
            <LinearGradient colors={Theme.gradients.primary} style={styles.chatAvatar}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>#</Text>
            </LinearGradient>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>Chit-chat</Text>
              <Text style={styles.chatLast}>Join the campus conversation 🎓</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </TouchableOpacity>

          {/* Direct & Group Messages */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>💬 Chats</Text>
          </View>

          {conversations.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No active chats. Message a member to start!</Text>
            </View>
          ) : (
            conversations.map(conv => {
              const avatarUri = conv.avatar?.startsWith('http')
                ? conv.avatar
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.id}`;
              return (
                <TouchableOpacity 
                  key={conv.id} 
                  style={styles.chatItem} 
                  onPress={() => {
                    if (conv.isGroup) {
                      setSelectedUser({ _id: conv.id, username: conv.name, isGroup: true });
                      setView('personal');
                      setLoading(true);
                      api.get(`/messages/group/${conv.id}`)
                        .then(res => setPersonalMessages(res.data.data))
                        .catch(() => {})
                        .finally(() => setLoading(false));
                    } else {
                      openPersonalChat({ _id: conv.id, username: conv.name, avatar: conv.avatar });
                    }
                  }}
                >
                  {conv.isGroup ? (
                    <LinearGradient colors={['#ec4899', '#f43f5e']} style={styles.chatAvatar}>
                      <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>G</Text>
                    </LinearGradient>
                  ) : (
                    <Image source={{ uri: avatarUri }} style={styles.chatAvatarImg} />
                  )}
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{conv.name}</Text>
                    <Text style={styles.chatLast} numberOfLines={1}>{conv.lastMessage || 'Tap to message'}</Text>
                  </View>
                  <Text style={{ color: Theme.colors.textMuted, fontSize: 10 }}>{conv.time}</Text>
                </TouchableOpacity>
              );
            })
          )}

          {/* Group Chats Button */}
          <Text style={styles.sectionLabel}>👥 Group Commands</Text>
          <TouchableOpacity style={styles.chatItem} onPress={handleCreateGroup}>
            <View style={[styles.chatAvatar, { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }]}>
              <Plus size={22} color={Theme.colors.textMuted} />
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>Create New Group</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Lock size={11} color="#f59e0b" />
                <Text style={styles.chatLast}>Premium members only</Text>
              </View>
            </View>
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>👑</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Create Group Modal */}
        <Modal
          visible={createGroupVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCreateGroupVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Group Chat</Text>
                <TouchableOpacity onPress={() => setCreateGroupVisible(false)}>
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Group Name"
                placeholderTextColor={Theme.colors.textMuted}
                value={newGroupName}
                onChangeText={setNewGroupName}
              />

              <Text style={styles.modalSubLabel}>Select Members to Add:</Text>
              <ScrollView style={styles.membersList}>
                {following.map(u => {
                  const isSelected = selectedMembers.includes(u._id);
                  return (
                    <TouchableOpacity
                      key={u._id}
                      style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                      onPress={() => {
                        if (isSelected) setSelectedMembers(selectedMembers.filter(id => id !== u._id));
                        else setSelectedMembers([...selectedMembers, u._id]);
                      }}
                    >
                      <View style={styles.memberAvatar}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>
                          {u.username[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.memberName}>@{u.username}</Text>
                      <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                        {isSelected && <Plus color="white" size={12} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {following.length === 0 && (
                  <Text style={{ color: Theme.colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                    You need to follow other users to create a group.
                  </Text>
                )}
              </ScrollView>

              <TouchableOpacity style={styles.createBtn} onPress={handleCreateGroupSubmit}>
                <Text style={styles.createBtnText}>CREATE GROUP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── Chat View (Global or Personal) ────────────────────────
  const messages = view === 'global' ? globalMessages : personalMessages;
  const chatTitle = view === 'global' ? 'Chit-chat' : selectedUser?.username || 'Chat';
  const onSend = view === 'global' ? sendGlobalMessage : sendPersonalMessage;

  return (
    <SafeAreaView style={styles.container}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => { setView('list'); fetchConversations(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ArrowLeft color={Theme.colors.primary} size={20} />
          <Text style={{ color: Theme.colors.primary, fontSize: 16 }}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', marginRight: 40 }}>
          <Text style={styles.chatHeaderTitle}>{chatTitle}</Text>
          {view === 'global' && <Text style={styles.chatHeaderSub}>📡 Live Feed</Text>}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={view === 'global' ? renderGlobalMessage : renderPersonalMessage}
          keyExtractor={(item, idx) => item._id || idx.toString()}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={`Message ${chatTitle}...`}
              placeholderTextColor={Theme.colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity onPress={onSend} disabled={!inputText.trim()}>
              <LinearGradient colors={Theme.gradients.primary} style={styles.sendButton}>
                <Send color="white" size={18} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: '900' },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(139,92,246,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  headerBtnText: { color: 'white', fontSize: 13, fontWeight: '600' },
  sectionLabel: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 20, paddingVertical: 10, marginTop: 5 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', gap: 14 },
  chatAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  chatAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  chatInfo: { flex: 1 },
  chatName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  chatLast: { color: Theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  liveText: { color: '#10b981', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  premiumBadge: { backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  premiumText: { fontSize: 14 },
  emptySection: { paddingHorizontal: 20, paddingVertical: 15 },
  emptyText: { color: Theme.colors.textMuted, fontSize: 14, fontStyle: 'italic' },
  // Chat view
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  chatHeaderTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  chatHeaderSub: { color: '#10b981', fontSize: 11, marginTop: 2 },
  messageList: { padding: 16, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', marginBottom: 14, maxWidth: '80%' },
  myMsgRow: { alignSelf: 'flex-end' },
  theirMsgRow: { alignSelf: 'flex-start', gap: 8 },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, marginTop: 15 },
  msgBubble: { borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxWidth: '100%' },
  myBubble: { backgroundColor: Theme.colors.primary, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 4 },
  msgSender: { color: Theme.colors.primary, fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  msgText: { color: 'white', fontSize: 15, lineHeight: 21 },
  msgTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, textAlign: 'right' },
  inputArea: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(15,12,41,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 28, paddingLeft: 16, paddingRight: 5, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1, color: 'white', fontSize: 15, maxHeight: 100 },
  sendButton: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#1E1B4B', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  modalInput: { backgroundColor: 'rgba(0,0,0,0.3)', color: 'white', borderRadius: 10, padding: 14, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalSubLabel: { color: Theme.colors.textMuted, fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  membersList: { maxHeight: 200, marginBottom: 20 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)', gap: 12 },
  memberRowSelected: { backgroundColor: 'rgba(139,92,246,0.1)' },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.2)', justifyContent: 'center', alignItems: 'center' },
  memberName: { color: 'white', fontSize: 14, flex: 1 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  createBtn: { backgroundColor: Theme.colors.primary, borderRadius: 10, padding: 15, alignItems: 'center' },
  createBtnText: { color: 'white', fontWeight: 'bold', letterSpacing: 1 }
});
