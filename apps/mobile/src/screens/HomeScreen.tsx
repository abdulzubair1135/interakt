import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  Image, SafeAreaView, ScrollView, Dimensions, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import { Heart, MessageCircle, Share2, Plus, Flame, Award, Users, Bookmark, Tag, X, Image as ImageIcon } from 'lucide-react-native';
import { Theme } from '../theme/Theme';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const POST_TAGS = ['general', 'funny', 'study', 'confession', 'memes', 'exam', 'events', 'clubs'];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostMedia, setNewPostMedia] = useState('');
  const [selectedTag, setSelectedTag] = useState('general');
  const [activeFilter, setActiveFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need media library permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let base64Data = asset.base64;

        if (!base64Data) {
          setUploadingImage(true);
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64String = reader.result as string;
              await uploadBase64Image(base64String);
            };
            reader.readAsDataURL(blob);
          } catch (e: any) {
            Alert.alert('Error', 'Failed to read picked image: ' + e.message);
            setUploadingImage(false);
          }
        } else {
          const mimeType = asset.mimeType || 'image/jpeg';
          const formattedBase64 = base64Data.startsWith('data:')
            ? base64Data
            : `data:${mimeType};base64,${base64Data}`;

          setUploadingImage(true);
          await uploadBase64Image(formattedBase64);
        }
      }
    } catch (err: any) {
      console.log('Error picking image', err);
      Alert.alert('Error', err.message || 'Failed to pick image');
    }
  };

  const uploadBase64Image = async (base64String: string) => {
    try {
      const res = await api.post('/posts/upload', { base64: base64String });
      if (res.data.success) {
        setNewPostMedia(res.data.url);
      } else {
        Alert.alert('Upload Failed', 'Failed to upload image.');
      }
    } catch (err: any) {
      console.log('Error uploading image', err);
      Alert.alert('Upload Error', err.response?.data?.error || err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const tagColors: Record<string, string> = {
    funny: '#f59e0b',
    study: '#3b82f6',
    confession: '#ec4899',
    memes: '#10b981',
    exam: '#ef4444',
    events: '#8b5cf6',
    clubs: '#06b6d4',
    general: '#9ca3af',
  };

  const fetchPosts = useCallback(async () => {
    try {
      const params: any = {};
      if (activeFilter !== 'all') params.tag = activeFilter;
      const res = await api.get('/posts', { params });
      setPosts(res.data.data);
      // Track liked posts
      if (user) {
        const liked = new Set<string>(
          res.data.data.filter((p: any) => p.likes?.includes(user._id || user.id)).map((p: any) => p._id)
        );
        setLikedPosts(liked);
      }
    } catch (err) {
      console.log('Error fetching posts', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/posts', {
        text: newPostText,
        media: newPostMedia || undefined,
        category: selectedTag,
        tags: [selectedTag],
      });
      setNewPostText('');
      setNewPostMedia('');
      setSelectedTag('general');
      setModalVisible(false);
      fetchPosts();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await api.put(`/posts/${postId}/like`);
      const isNowLiked = res.data.liked;
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (isNowLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts(prev => prev.map(p =>
        p._id === postId ? { ...p, likes: res.data.data } : p
      ));
    } catch (err) {
      console.log('Error liking post', err);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      await api.put(`/posts/${postId}/save`);
      Alert.alert('Saved!', 'Post saved to your profile.');
    } catch (err) {
      console.log('Error saving post', err);
    }
  };

  const renderFilterBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
      {['all', ...POST_TAGS].map(tag => (
        <TouchableOpacity
          key={tag}
          onPress={() => setActiveFilter(tag)}
          style={[styles.filterChip, activeFilter === tag && { backgroundColor: tagColors[tag] || Theme.colors.primary, borderColor: 'transparent' }]}
        >
          <Text style={[styles.filterChipText, activeFilter === tag && { color: 'white' }]}>
            #{tag}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderPost = ({ item }: { item: any }) => {
    const isLiked = likedPosts.has(item._id);
    const tag = item.tags?.[0] || item.category || 'general';
    const tagColor = tagColors[tag] || Theme.colors.textMuted;
    const avatarUri = item.user?.avatar?.startsWith('http')
      ? item.user.avatar
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?._id}`;

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.author}>{item.user?.username || 'Anonymous'}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={[styles.tagBadge, { backgroundColor: `${tagColor}20`, borderColor: `${tagColor}40` }]}>
            <Text style={[styles.tagBadgeText, { color: tagColor }]}>#{tag}</Text>
          </View>
        </View>

        {/* Post Content */}
        <Text style={styles.content}>{item.text}</Text>

        {/* Media */}
        {item.media && (
          <Image source={{ uri: item.media }} style={styles.postImage} resizeMode="cover" />
        )}

        {/* Post Footer */}
        <View style={styles.postFooter}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item._id)}>
            <Heart size={20} color={isLiked ? '#ef4444' : Theme.colors.textMuted} fill={isLiked ? '#ef4444' : 'transparent'} />
            <Text style={[styles.actionText, isLiked && { color: '#ef4444' }]}>{item.likes?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Comments', 'Coming soon!')}>
            <MessageCircle size={20} color={Theme.colors.textMuted} />
            <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => handleSave(item._id)}>
            <Bookmark size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Share', 'Coming soon!')}>
            <Share2 size={20} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.feedHeaderText}>
        <Text style={styles.sectionTitle}>🔥 For You</Text>
      </View>
      {renderFilterBar()}
      <View style={{ height: 10 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Interakt<Text style={{ color: Theme.colors.primary, fontSize: 13, fontWeight: 'normal' }}> by project x²</Text></Text>
        <TouchableOpacity
          style={styles.newPostQuick}
          onPress={() => setModalVisible(true)}
        >
          {user?.avatar?.startsWith('http') ? (
            <Image source={{ uri: user.avatar }} style={styles.userAvatarSmall} />
          ) : (
            <View style={[styles.userAvatarSmall, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 18 }}>{user?.avatar || '😀'}</Text>
            </View>
          )}
          <Text style={styles.newPostPlaceholder}>What's happening on campus?</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
          contentContainerStyle={styles.feed}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🌙</Text>
                <Text style={styles.emptyText}>The campus is quiet... be the first!</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fabContainer} activeOpacity={0.9} onPress={() => setModalVisible(true)}>
        <LinearGradient colors={Theme.gradients.primary} style={styles.fab}>
          <Plus color="white" size={32} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#9ca3af" size={24} />
              </TouchableOpacity>
            </View>

            {/* User Info */}
            <View style={styles.postInputHeader}>
              {user?.avatar?.startsWith('http') ? (
                <Image source={{ uri: user.avatar }} style={styles.postUserAvatar} />
              ) : (
                <View style={[styles.postUserAvatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(139,92,246,0.2)' }]}>
                  <Text style={{ fontSize: 22 }}>{user?.avatar || '😀'}</Text>
                </View>
              )}
              <View>
                <Text style={styles.postUserName}>{user?.username}</Text>
                <Text style={styles.postUserSub}>Posting to Campus Feed</Text>
              </View>
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.input}
              placeholder="What's on your mind? Share with your campus..."
              placeholderTextColor="#6b7280"
              multiline
              value={newPostText}
              onChangeText={setNewPostText}
            />

            {/* Image Preview / Uploading / Picker */}
            {uploadingImage ? (
              <View style={{ padding: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, marginBottom: 12 }}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>Uploading image to Interakt...</Text>
              </View>
            ) : newPostMedia ? (
              <View style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                <Image source={{ uri: newPostMedia }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => setNewPostMedia('')}
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)'
                  }}
                >
                  <X size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: 16, padding: 14,
                    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)'
                  }}
                >
                  <ImageIcon size={18} color={Theme.colors.primary} />
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Upload Local Image File</Text>
                </TouchableOpacity>
                
                <View style={styles.mediaInputRow}>
                  <ImageIcon size={16} color={Theme.colors.textMuted} />
                  <TextInput
                    style={styles.mediaInput}
                    placeholder="Or paste image URL (optional)"
                    placeholderTextColor="#6b7280"
                    value={newPostMedia}
                    onChangeText={setNewPostMedia}
                  />
                </View>
              </View>
            )}

            {/* Tag Selection */}
            <Text style={styles.tagLabel}>📌 Tag your post:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {POST_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => setSelectedTag(tag)}
                  style={[styles.tagChip, selectedTag === tag && { backgroundColor: tagColors[tag] || Theme.colors.primary, borderColor: 'transparent' }]}
                >
                  <Text style={[styles.tagChipText, selectedTag === tag && { color: 'white' }]}>#{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.postButton, (!newPostText || submitting) && { opacity: 0.5 }]}
              onPress={handleCreatePost}
              disabled={!newPostText || submitting}
            >
              <LinearGradient colors={Theme.gradients.primary} style={styles.postButtonGradient}>
                <Text style={styles.postButtonText}>{submitting ? 'Posting...' : '🚀 Post to Campus'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -1, marginBottom: 12 },
  newPostQuick: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 5,
  },
  userAvatarSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(139,92,246,0.15)' },
  newPostPlaceholder: { color: '#6b7280', fontSize: 14, flex: 1 },
  filterBar: { marginTop: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  filterChipText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  feed: { paddingBottom: 100 },
  feedHeaderText: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 8 },
  sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 18,
    marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: Theme.colors.primary + '60' },
  author: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  time: { color: Theme.colors.textMuted, fontSize: 11, marginTop: 1 },
  tagBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1,
  },
  tagBadgeText: { fontSize: 11, fontWeight: '700' },
  content: { color: '#e5e7eb', lineHeight: 23, fontSize: 15, marginBottom: 12 },
  postImage: { width: '100%', height: 220, borderRadius: 16, marginBottom: 12 },
  postFooter: {
    flexDirection: 'row', paddingTop: 12, borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)', gap: 20,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: Theme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Theme.colors.textMuted, fontSize: 16, fontStyle: 'italic' },
  fabContainer: { position: 'absolute', bottom: 30, right: 25 },
  fab: {
    width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center',
    shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5, shadowRadius: 15, elevation: 8,
  },
  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.85)' },
  modalContent: {
    backgroundColor: '#16133a', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(139,92,246,0.4)',
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  postInputHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  postUserAvatar: { width: 44, height: 44, borderRadius: 22 },
  postUserName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  postUserSub: { color: Theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16, color: '#fff',
    padding: 15, minHeight: 110, textAlignVertical: 'top', fontSize: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 12,
  },
  mediaInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 14,
  },
  mediaInput: { flex: 1, color: '#fff', fontSize: 14 },
  tagLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tagChipText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  postButton: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  postButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  postButtonText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
});
