import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import ChatWidgetOverlay from '../components/ChatWidget';

const STATS = [
  { label: 'Active Projects', value: '12', color: '#F5A623' },
  { label: 'Workers On-Site', value: '84', color: '#4A90E2' },
  { label: 'Tasks Due Today', value: '7', color: '#D0021B' },
  { label: 'Completed This Month', value: '31', color: '#417505' },
];

const RECENT = [
  { id: '1', title: 'Bridge Foundation', status: 'In Progress', pct: 65 },
  { id: '2', title: 'Office Block A', status: 'Planning', pct: 20 },
  { id: '3', title: 'Highway Overpass', status: 'In Progress', pct: 48 },
];

export default function DashboardScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerSub}>Good Morning 👷</Text>
        <Text style={styles.headerTitle}>Site Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Stats grid */}
        <View style={styles.grid}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent projects */}
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        {RECENT.map((p) => (
          <View key={p.id} style={styles.projectCard}>
            <View style={styles.projectRow}>
              <Text style={styles.projectTitle}>{p.title}</Text>
              <Text style={styles.projectStatus}>{p.status}</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${p.pct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{p.pct}% complete</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.alertCard}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View>
            <Text style={styles.alertTitle}>Safety Inspection Due</Text>
            <Text style={styles.alertSub}>Bridge Foundation — Tomorrow, 08:00</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <ChatWidgetOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: '#1C1C1E',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerSub: { color: '#8E8E93', fontSize: 13, marginBottom: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8E8E93' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  projectRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  projectTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  projectStatus: { fontSize: 12, color: '#F5A623', fontWeight: '600' },
  progressBg: { height: 6, backgroundColor: '#E5E5EA', borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: '#F5A623', borderRadius: 3 },
  progressLabel: { fontSize: 11, color: '#8E8E93' },
  alertCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  alertIcon: { fontSize: 24 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#856404' },
  alertSub: { fontSize: 12, color: '#856404', marginTop: 2 },
});
