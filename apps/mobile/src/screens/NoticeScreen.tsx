import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Theme } from '../theme/Theme';
import { Bell, Calendar, BookOpen, Megaphone } from 'lucide-react-native';

// Static college notices - in a real app these would come from the API
const NOTICES = [
  {
    id: 1,
    icon: '📅',
    type: 'Academic',
    title: 'Mid-Semester Exam Schedule',
    body: 'Examinations for all departments will begin on May 5th. Students are advised to check their timetables on the college portal.',
    date: 'Apr 22, 2026',
    urgent: true,
  },
  {
    id: 2,
    icon: '🎉',
    type: 'Event',
    title: 'Annual Tech Fest Registration Open',
    body: 'Register your teams for CampusFest 2026! Last date for registration is April 30th. Maximum 4 members per team.',
    date: 'Apr 21, 2026',
    urgent: false,
  },
  {
    id: 3,
    icon: '📚',
    type: 'Library',
    title: 'Library Hours Extended',
    body: 'The central library will remain open until 10 PM during exam season (May 1 - June 15).',
    date: 'Apr 20, 2026',
    urgent: false,
  },
  {
    id: 4,
    icon: '🏆',
    type: 'Sports',
    title: 'Inter-College Cricket Tournament',
    body: 'Tryouts for the college cricket team will be held on April 28th at the main ground. All interested students may attend.',
    date: 'Apr 19, 2026',
    urgent: false,
  },
  {
    id: 5,
    icon: '💰',
    type: 'Finance',
    title: 'Scholarship Application Deadline',
    body: 'Merit scholarship applications for the academic year 2026-27 are due by May 10th. Submit documents to the admin office.',
    date: 'Apr 18, 2026',
    urgent: true,
  },
];

export default function NoticeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notice Board 📌</Text>
          <Text style={styles.subtitle}>Official college announcements</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {NOTICES.map(notice => (
          <View key={notice.id} style={[styles.card, notice.urgent && styles.urgentCard]}>
            {notice.urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>⚠️ Important</Text>
              </View>
            )}
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>{notice.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardType}>{notice.type}</Text>
                <Text style={styles.cardTitle}>{notice.title}</Text>
              </View>
            </View>
            <Text style={styles.cardBody}>{notice.body}</Text>
            <Text style={styles.cardDate}>📅 Posted: {notice.date}</Text>
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: Theme.colors.textMuted, fontSize: 13, marginTop: 3 },
  list: { paddingHorizontal: 20, paddingTop: 10 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 22, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  urgentCard: { borderColor: 'rgba(245,158,11,0.3)', backgroundColor: 'rgba(245,158,11,0.04)' },
  urgentBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    marginBottom: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  urgentText: { color: '#f59e0b', fontSize: 11, fontWeight: '800' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 12 },
  cardIcon: { fontSize: 28, lineHeight: 34 },
  cardType: { color: Theme.colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  cardTitle: { color: 'white', fontSize: 16, fontWeight: '800', lineHeight: 22 },
  cardBody: { color: '#9ca3af', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  cardDate: { color: '#6b7280', fontSize: 12 },
});
