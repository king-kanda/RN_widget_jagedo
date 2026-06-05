import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const JOBS = [
  {
    id: '1',
    name: 'Bridge Foundation Phase 2',
    site: 'Nairobi Expressway, KM 14',
    foreman: 'James Otieno',
    workers: 18,
    deadline: 'Jun 20, 2025',
    priority: 'HIGH',
    priorityColor: '#D0021B',
    tasks: ['Excavation', 'Steel Fixing', 'Concrete Pour'],
    done: [true, true, false],
  },
  {
    id: '2',
    name: 'Office Block A — Floors 3-5',
    site: 'Westlands, Nairobi',
    foreman: 'Grace Wanjiku',
    workers: 24,
    deadline: 'Jul 8, 2025',
    priority: 'MED',
    priorityColor: '#F5A623',
    tasks: ['Formwork', 'MEP Rough-in', 'Plastering'],
    done: [true, false, false],
  },
  {
    id: '3',
    name: 'Highway Overpass — Section B',
    site: 'Thika Road, KM 27',
    foreman: 'Peter Kamau',
    workers: 32,
    deadline: 'Aug 15, 2025',
    priority: 'MED',
    priorityColor: '#F5A623',
    tasks: ['Pile Driving', 'Beam Placement', 'Deck Slab'],
    done: [false, false, false],
  },
  {
    id: '4',
    name: 'Warehouse Roof — Zone C',
    site: 'Industrial Area, Nairobi',
    foreman: 'Samuel Njoroge',
    workers: 10,
    deadline: 'Jun 12, 2025',
    priority: 'LOW',
    priorityColor: '#417505',
    tasks: ['Steel Trusses', 'Roofing Sheets', 'Gutters'],
    done: [true, true, true],
  },
];

export default function ActiveJobsScreen() {
  const [expanded, setExpanded] = useState(null);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerSub}>Field Operations</Text>
        <Text style={styles.headerTitle}>Active Jobs</Text>
        <Text style={styles.headerCount}>{JOBS.length} jobs running</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {JOBS.map((job) => (
          <TouchableOpacity
            key={job.id}
            style={styles.card}
            onPress={() => setExpanded(expanded === job.id ? null : job.id)}
            activeOpacity={0.85}
          >
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobName}>{job.name}</Text>
                <Text style={styles.jobSite}>📍 {job.site}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: job.priorityColor }]}>
                <Text style={styles.badgeText}>{job.priority}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>👷 {job.foreman}</Text>
              <Text style={styles.meta}>🧑‍🤝‍🧑 {job.workers} workers</Text>
              <Text style={styles.meta}>📅 {job.deadline}</Text>
            </View>

            {expanded === job.id && (
              <View style={styles.tasks}>
                <Text style={styles.tasksTitle}>Tasks</Text>
                {job.tasks.map((t, i) => (
                  <View key={t} style={styles.taskRow}>
                    <Text style={[styles.taskCheck, { color: job.done[i] ? '#417505' : '#8E8E93' }]}>
                      {job.done[i] ? '✅' : '⬜'}
                    </Text>
                    <Text style={[styles.taskLabel, job.done[i] && styles.taskDone]}>{t}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.expand}>{expanded === job.id ? '▲ Less' : '▼ Details'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: '#2C3E50',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerSub: { color: '#95A5A6', fontSize: 13, marginBottom: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  headerCount: { color: '#F5A623', fontSize: 13, marginTop: 4, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  jobName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  jobSite: { fontSize: 12, color: '#8E8E93' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  meta: { fontSize: 12, color: '#636366', backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tasks: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 12 },
  tasksTitle: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  taskCheck: { fontSize: 16, marginRight: 8 },
  taskLabel: { fontSize: 13, color: '#1C1C1E' },
  taskDone: { textDecorationLine: 'line-through', color: '#8E8E93' },
  expand: { fontSize: 12, color: '#4A90E2', marginTop: 10, textAlign: 'right' },
});
