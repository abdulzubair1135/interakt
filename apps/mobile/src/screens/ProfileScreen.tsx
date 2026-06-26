import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, ScrollView,
  Dimensions, Alert, Modal, TextInput, ActivityIndicator, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Settings, LogOut, Grid, Bookmark, Edit3, Shield, MapPin, Calendar,
  Heart, MessageCircle, X, Check, Image as ImageIcon, User
} from 'lucide-react-native';
import { Theme } from '../theme/Theme';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation, route }: any) {
  const { user: currentUser, logout, setUser } = useAuth();
  // Support viewing other users' profiles via route.params.userId
  const viewingUserId = route?.params?.userId;
  const isOwnProfile = !viewingUserId || viewingUserId === (currentUser?._id || currentUser?.id);

  const [profile, setProfile] = useState<any>(isOwnProfile ? currentUser : null);
  const [posts, setPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'saved'>('posts');
  const [loading, setLoading] = useState(!isOwnProfile);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Edit profile modal
  const [editVisible, setEditVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editUsername, setEditUsername] = useState(currentUser?.username || '');
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '😀');
  const [editCover, setEditCover] = useState(currentUser?.coverImage || '');
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!isOwnProfile && viewingUserId) {
      try {
        const res = await api.get(`/auth/profile/${viewingUserId}`);
        setProfile(res.data.data);
        // Check if current user is following this profile
        if (currentUser) {
          const myProfile = await api.get('/auth/me');
          const following = myProfile.data.data.following || [];
          setIsFollowing(following.map((id: any) => id.toString()).includes(viewingUserId));
        }
      } catch (err) {
        Alert.alert('Error', 'Could not load profile');
      } finally {
        setLoading(false);
      }
    }
  }, [viewingUserId, isOwnProfile, currentUser]);

  const fetchPosts = useCallback(async () => {
    const uid = viewingUserId || currentUser?._id || currentUser?.id;
    if (!uid) return;
    try {
      const res = await api.get(`/posts/user/${uid}`);
      setPosts(res.data.data);
    } catch (err) { console.log(err); }
  }, [viewingUserId, currentUser]);

  const fetchSaved = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      const res = await api.get('/posts/saved');
      setSavedPosts(res.data.data);
    } catch (err) { console.log(err); }
  }, [isOwnProfile]);

  const fetchLiked = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      const res = await api.get('/posts/liked');
      setLikedPosts(res.data.data);
    } catch (err) { console.log(err); }
  }, [isOwnProfile]);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    if (isOwnProfile) { fetchSaved(); fetchLiked(); }
  }, [fetchProfile, fetchPosts, fetchSaved, fetchLiked, isOwnProfile]);

  const handleFollow = async () => {
    if (!currentUser) return Alert.alert('Error', 'You must be logged in to follow');
    setFollowLoading(true);
    try {
      const res = await api.put(`/auth/${viewingUserId}/follow`);
      setIsFollowing(res.data.isFollowing);
      setProfile((prev: any) => ({ ...prev, followers: { length: res.data.followersCount } }));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSubmitting(true);
    try {
      const res = await api.put('/auth/updatedetails', {
        username: editUsername,
        bio: editBio,
        avatar: editAvatar,
        coverImage: editCover || undefined,
      });
      if (setUser) setUser(res.data.data);
      setProfile(res.data.data);
      Alert.alert('✅ Success', 'Profile updated!');
      setEditVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const displayProfile = profile || currentUser;
  if (!displayProfile) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator color={Theme.colors.primary} style={{ marginTop: 50 }} />
    </SafeAreaView>
  );

  const followerCount = Array.isArray(displayProfile.followers) ? displayProfile.followers.length : (displayProfile.followers || 0);
  const followingCount = Array.isArray(displayProfile.following) ? displayProfile.following.length : (displayProfile.following || 0);

  const getDisplayPosts = () => {
    if (activeTab === 'posts') return posts;
    if (activeTab === 'saved') return savedPosts;
    if (activeTab === 'media') return likedPosts;
    return posts;
  };

  const avatarUri = displayProfile.avatar?.startsWith('http')
    ? displayProfile.avatar
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayProfile._id}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover & Avatar */}
        <View style={styles.headerSection}>
          <Image
            source={{ uri: displayProfile.coverImage || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070' }}
            style={styles.coverImage}
          />
          <LinearGradient colors={['transparent', 'rgba(15, 12, 41, 0.9)', '#0f0c29']} style={styles.coverOverlay} />
          {/* Back button for other profiles */}
          {!isOwnProfile && (
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <X color="white" size={20} />
            </TouchableOpacity>
          )}
          <View style={styles.avatarWrapper}>
            <LinearGradient colors={Theme.gradients.primary} style={styles.avatarBorder}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            </LinearGradient>
            {isOwnProfile && (
              <TouchableOpacity style={styles.editAvatarButton} onPress={() => setEditVisible(true)}>
                <Edit3 color="white" size={14} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.infoSection}>
          <Text style={styles.username}>{displayProfile.username}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Shield size={11} color={Theme.colors.primary} />
              <Text style={styles.badgeText}>Verified Student</Text>
            </View>
            {displayProfile.isPremium && (
              <View style={[styles.badge, { borderColor: '#f59e0b40', backgroundColor: '#f59e0b10' }]}>
                <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}>👑 Premium</Text>
              </View>
            )}
          </View>
          <Text style={styles.bio}>{displayProfile.bio || 'Interakt Member 🚀'}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {isOwnProfile ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={() => setEditVisible(true)}>
                <Text style={styles.primaryBtnText}>✏️ Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.iconBtn]} onPress={() => setSettingsVisible(true)}>
                <Settings color="white" size={20} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.btn, isFollowing ? styles.secondaryBtn : styles.followBtn]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? <ActivityIndicator color="white" size="small" /> :
                  <Text style={styles.primaryBtnText}>{isFollowing ? '✓ Following' : '+ Follow'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.iconBtn]}
                onPress={() => navigation.navigate('PersonalChat', { userId: viewingUserId, username: displayProfile.username })}
              >
                <MessageCircle color="white" size={20} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {[
            { key: 'posts', label: '📝 Posts' },
            { key: 'media', label: isOwnProfile ? '❤️ Liked' : '📸 Media' },
            { key: 'saved', label: '🔖 Saved', ownOnly: true },
          ].filter(t => !t.ownOnly || isOwnProfile).map(tab => (
            <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}>
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts Grid */}
        <View style={styles.postsList}>
          {getDisplayPosts().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🌙</Text>
              <Text style={styles.emptyText}>Nothing here yet</Text>
            </View>
          ) : (
            getDisplayPosts().map((post: any) => (
              <View key={post._id} style={styles.miniPostCard}>
                <Text style={styles.miniPostText} numberOfLines={3}>{post.text}</Text>
                {post.media && <Image source={{ uri: post.media }} style={styles.miniPostImage} />}
                <View style={styles.miniPostFooter}>
                  <Text style={styles.miniPostStat}>❤️ {post.likes?.length || 0}</Text>
                  <Text style={styles.miniPostTag}>#{post.tags?.[0] || post.category || 'general'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Logout (own profile) */}
        {isOwnProfile && (
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <LogOut color="#ef4444" size={18} />
            <Text style={styles.logoutText}>Sign Out Securely</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal animationType="slide" transparent visible={editVisible} onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setEditVisible(false)}>
                  <X color="#9ca3af" size={22} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Avatar (emoji or image URL)</Text>
              <TextInput style={styles.input} value={editAvatar} onChangeText={setEditAvatar} placeholder="😀 or https://..." placeholderTextColor="#6b7280" />

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput style={styles.input} value={editUsername} onChangeText={setEditUsername} autoCapitalize="none" />

              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={editBio} onChangeText={setEditBio} multiline placeholder="Tell the campus about yourself..." placeholderTextColor="#6b7280" />

              <Text style={styles.inputLabel}>Cover Image URL (optional)</Text>
              <TextInput style={styles.input} value={editCover} onChangeText={setEditCover} placeholder="https://..." placeholderTextColor="#6b7280" />

              <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.5 }]} onPress={handleUpdateProfile} disabled={submitting}>
                <LinearGradient colors={Theme.gradients.primary} style={styles.saveBtnGradient}>
                  <Text style={styles.saveBtnText}>{submitting ? 'Saving...' : '✅ Save Profile'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal animationType="slide" transparent visible={settingsVisible} onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Text style={{ color: '#9ca3af', fontSize: 16 }}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={{ color: '#9ca3af' }}>v1.0.0 ✨</Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Account Type</Text>
              <Text style={{ color: displayProfile.isPremium ? '#f59e0b' : '#9ca3af' }}>
                {displayProfile.isPremium ? '👑 Premium' : '⚡ Free'}
              </Text>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Role</Text>
              <Text style={{ color: '#9ca3af', textTransform: 'capitalize' }}>{displayProfile.role}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  headerSection: { height: 230, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverOverlay: { position: 'absolute', bottom: 0, width: '100%', height: '70%' },
  backBtn: {
    position: 'absolute', top: 15, left: 15, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  avatarWrapper: { position: 'absolute', bottom: -50, alignSelf: 'center', zIndex: 10 },
  avatarBorder: { padding: 3, borderRadius: 60, shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1f2937' },
  editAvatarButton: {
    position: 'absolute', right: 3, bottom: 3,
    backgroundColor: Theme.colors.primary, width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Theme.colors.background,
  },
  infoSection: { marginTop: 60, alignItems: 'center', paddingHorizontal: 24 },
  username: { fontSize: 26, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139,92,246,0.1)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  badgeText: { color: Theme.colors.primary, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  bio: { fontSize: 14, color: Theme.colors.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 20 },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20, paddingVertical: 18, marginTop: 24, width: '100%',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: 'white', fontSize: 20, fontWeight: '900' },
  statLabel: { color: Theme.colors.textMuted, fontSize: 11, marginTop: 3 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'center', height: '60%' },
  actionButtons: { flexDirection: 'row', marginTop: 20, gap: 10, width: '100%' },
  btn: { height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primaryBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  followBtn: { flex: 1, backgroundColor: Theme.colors.primary },
  secondaryBtn: { flex: 1, backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' },
  iconBtn: { width: 50, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  primaryBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  tabBar: { flexDirection: 'row', marginTop: 24, marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: Theme.colors.primary },
  tabText: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: 'white' },
  postsList: { padding: 20, paddingTop: 12 },
  miniPostCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  miniPostText: { color: '#e5e7eb', fontSize: 14, lineHeight: 20 },
  miniPostImage: { width: '100%', height: 160, borderRadius: 12, marginTop: 10 },
  miniPostFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  miniPostStat: { color: Theme.colors.textMuted, fontSize: 12 },
  miniPostTag: { color: Theme.colors.primary, fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Theme.colors.textMuted, fontSize: 15 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 20, marginTop: 10, marginBottom: 50, gap: 10, padding: 18,
    borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.05)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.1)',
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#16133a', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(139,92,246,0.4)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  inputLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, color: '#fff',
    padding: 14, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  saveBtn: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  saveBtnGradient: { paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  settingLabel: { color: 'white', fontSize: 15, fontWeight: '500' },
});
