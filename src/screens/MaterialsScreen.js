import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MATERIALS = [
  { id: '1', name: 'Portland Cement (50kg)', unit: 'Bags', stock: 420, min: 100, category: 'Concrete' },
  { id: '2', name: 'Steel Rebar Y16', unit: 'Tonnes', stock: 18, min: 10, category: 'Steel' },
  { id: '3', name: 'Coarse Aggregate', unit: 'M³', stock: 85, min: 30, category: 'Concrete' },
  { id: '4', name: 'River Sand', unit: 'M³', stock: 12, min: 20, category: 'Concrete' },
  { id: '5', name: 'Steel Rebar Y12', unit: 'Tonnes', stock: 6, min: 8, category: 'Steel' },
  { id: '6', name: 'Timber Planks 2x4', unit: 'Pieces', stock: 310, min: 50, category: 'Formwork' },
  { id: '7', name: 'Plywood Sheets 18mm', unit: 'Sheets', stock: 44, min: 40, category: 'Formwork' },
  { id: '8', name: 'Binding Wire', unit: 'Rolls', stock: 75, min: 20, category: 'Steel' },
  { id: '9', name: 'Waterproof Membrane', unit: 'Rolls', stock: 8, min: 15, category: 'Roofing' },
  { id: '10', name: 'Galv. Roofing Sheets', unit: 'Sheets', stock: 200, min: 50, category: 'Roofing' },
];

const CATEGORIES = ['All', 'Concrete', 'Steel', 'Formwork', 'Roofing'];

function stockStatus(stock, min) {
  const ratio = stock / min;
  if (ratio < 1) return { label: 'Low Stock', color: '#D0021B', bg: '#FDECEA' };
  if (ratio < 1.5) return { label: 'Moderate', color: '#F5A623', bg: '#FFF8EC' };
  return { label: 'Adequate', color: '#417505', bg: '#EDF7ED' };
}

export default function MaterialsScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const insets = useSafeAreaInsets();

  const filtered = MATERIALS.filter((m) => {
    const matchCat = activeCategory === 'All' || m.category === activeCategory;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const lowCount = MATERIALS.filter((m) => m.stock < m.min).length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerSub}>Inventory</Text>
        <Text style={styles.headerTitle}>Materials</Text>
        {lowCount > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>⚠️ {lowCount} items need reorder</Text>
          </View>
        )}
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search materials..."
          placeholderTextColor="#8E8E93"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, activeCategory === c && styles.chipActive]}
            onPress={() => setActiveCategory(c)}
          >
            <Text style={[styles.chipText, activeCategory === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filtered.map((m) => {
          const st = stockStatus(m.stock, m.min);
          return (
            <View key={m.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.matName}>{m.name}</Text>
                <Text style={styles.matMeta}>{m.unit} · min {m.min}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.stockVal}>{m.stock}</Text>
                <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <Text style={styles.empty}>No materials match your filter.</Text>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    backgroundColor: '#3D2B1F',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerSub: { color: '#A0887A', fontSize: 13, marginBottom: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  alertBadge: {
    marginTop: 8,
    backgroundColor: '#D0021B22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  alertBadgeText: { color: '#FF6B6B', fontSize: 12, fontWeight: '600' },
  searchBar: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10 },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1C1C1E',
  },
  chips: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  chipActive: { backgroundColor: '#3D2B1F' },
  chipText: { fontSize: 13, color: '#636366', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rowLeft: { flex: 1 },
  matName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 3 },
  matMeta: { fontSize: 12, color: '#8E8E93' },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  stockVal: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 14 },
});
