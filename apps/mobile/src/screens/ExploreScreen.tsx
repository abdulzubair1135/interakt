import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ScrollView, Image, ActivityIndicator
} from 'react-native';
import api from '../services/api';
import { Theme } from '../theme/Theme';
import { Heart, Bookmark, MessageCircle } from 'lucide-react-native';

const TAGS = [
  { key: 'all', label: '🔥 All', color: '#f59e0b' },
  { key: 'funny', label: '😂 Funny', color: '#f59e0b' },
  { key: 'study', label: '📚 Study', color: '#3b82f6' },
  { key: 'memes', label: '🎭 Memes', color: '#10b981' },
  { key: 'events', label: '🎉 Events', color: '#8b5cf6' },
  { key: 'confession', label: '🤫 Confession', color: '#ec4899' },
  { key: 'exam', label: '📝 Exam', color: '#ef4444' },
  { key: 'clubs', label: '🏆 Clubs', color: '#06b6d4' },
];

const tagColors: Record<string, string> = {
  funny: '#f59e0b', study: '#3b82f6', memes: '#10b981',
  events: '#8b5cf6', confession: '#ec4899', exam: '#ef4444',
  clubs: '#06b6d4', general: '#9ca3af',
};

export default function ExploreScreen({ navigation }: any) {
  const [activeTag, setActiveTag] = useState('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeTag !== 'all') params.tag = activeTag;
      const res = await api.get('/posts', { params });
      setPosts(res.data.data);
    } catch (err) {
      console.log('Explore fetch error', err);
    } finally {
      setLoading(false);
    }
  }, [activeTag]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const renderPost = ({ item }: { item: any }) => {
    const tag = item.tags?.[0] || item.category || 'general';
    const tagColor = tagColors[tag] || Theme.colors.textMuted;
    const avatarUri = item.user?.avatar?.startsWith('http')
      ? item.user.avatar
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?._id}`;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.author}>{item.user?.username || 'Campus User'}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={[styles.tagBadge, { backgroundColor: `${tagColor}20`, borderColor: `${tagColor}40` }]}>
            <Text style={[styles.tagText, { color: tagColor }]}>#{tag}</Text>
          </View>
        </View>
        <Text style={styles.postText} numberOfLines={4}>{item.text}</Text>
        {item.media && <Image source={{ uri: item.media }} style={styles.postMedia} />}
        <View style={styles.postFooter}>
          <Text style={styles.footerStat}>❤️ {item.likes?.length || 0}</Text>
          <Text style={styles.footerStat}>💬 {item.comments?.length || 0}</Text>
          <Text style={styles.footerStat}>🔖 {item.saves?.length || 0}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Explore 🌎</Text>
      </View>

      {/* Tag Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagBar} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
        {TAGS.map(tag => (
          <TouchableOpacity
            key={tag.key}
            onPress={() => setActiveTag(tag.key)}
            style={[styles.tagChip, activeTag === tag.key && { backgroundColor: tag.color, borderColor: 'transparent' }]}
          >
            <Text style={[styles.tagChipText, activeTag === tag.key && { color: 'white' }]}>{tag.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={Theme.colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 50 }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>🔭</Text>
              <Text style={{ color: Theme.colors.textMuted, fontSize: 15 }}>No posts found for #{activeTag}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  topBar: { paddingHorizontal: 20, paddingVertical: 15 },
  title: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  tagBar: { marginBottom: 10 },
  tagChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tagChipText: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  postCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: Theme.colors.primary + '60' },
  author: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  time: { color: Theme.colors.textMuted, fontSize: 11, marginTop: 1 },
  tagBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '700' },
  postText: { color: '#e5e7eb', fontSize: 14, lineHeight: 22, marginBottom: 10 },
  postMedia: { width: '100%', height: 180, borderRadius: 14, marginBottom: 10 },
  postFooter: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 10 },
  footerStat: { color: Theme.colors.textMuted, fontSize: 13 },
});
