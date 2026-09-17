import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { HeatMapModel, ViewMode } from './src/types/heatmap';
import { loadHeatMaps, saveHeatMaps } from './src/utils/storage';
import { getTodayKey } from './src/utils/dateUtils';
import { Header } from './src/components/Header';
import { HeatmapCard } from './src/components/HeatmapCard';
import { DayDetailModal } from './src/components/DayDetailModal';
import { CreateHeatmapModal } from './src/components/CreateHeatmapModal';
import { WidgetStudioModal } from './src/components/WidgetStudioModal';
import { Search, Plus } from 'lucide-react-native';

export default function App() {
  const [heatmaps, setHeatmaps] = useState<HeatMapModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    mapId: string;
    dateKey: string;
  } | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    async function init() {
      try {
        const loaded = await loadHeatMaps();
        setHeatmaps(loaded);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Update storage whenever heatmaps state changes
  const updateHeatmaps = (newMaps: HeatMapModel[]) => {
    setHeatmaps(newMaps);
    saveHeatMaps(newMaps);
  };

  // Distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    heatmaps.forEach((m) => {
      if (m.category) set.add(m.category.toUpperCase());
    });
    return ['ALL', ...Array.from(set)];
  }, [heatmaps]);

  // Filtered heatmaps
  const filteredMaps = useMemo(() => {
    return heatmaps.filter((m) => {
      const matchCategory =
        selectedCategory === 'ALL' ||
        m.category.toUpperCase() === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [heatmaps, selectedCategory, searchQuery]);

  // Quick log today
  const handleQuickLogToday = (mapId: string) => {
    const todayKey = getTodayKey();
    const updated = heatmaps.map((m) => {
      if (m.id !== mapId) return m;
      const entries = { ...m.entries };
      if (entries[todayKey]?.completed) {
        delete entries[todayKey];
      } else {
        entries[todayKey] = { date: todayKey, completed: true };
      }
      return { ...m, entries };
    });
    updateHeatmaps(updated);
  };

  // Save specific day entry
  const handleSaveDayEntry = (dateKey: string, completed: boolean, notes?: string) => {
    if (!selectedDayInfo) return;
    const { mapId } = selectedDayInfo;
    const updated = heatmaps.map((m) => {
      if (m.id !== mapId) return m;
      const entries = { ...m.entries };
      if (!completed && !notes) {
        delete entries[dateKey];
      } else {
        entries[dateKey] = { date: dateKey, completed, notes };
      }
      return { ...m, entries };
    });
    updateHeatmaps(updated);
  };

  // Delete day entry
  const handleDeleteDayEntry = (dateKey: string) => {
    if (!selectedDayInfo) return;
    const { mapId } = selectedDayInfo;
    const updated = heatmaps.map((m) => {
      if (m.id !== mapId) return m;
      const entries = { ...m.entries };
      delete entries[dateKey];
      return { ...m, entries };
    });
    updateHeatmaps(updated);
  };

  // Delete entire heatmap
  const handleDeleteMap = (mapId: string) => {
    const updated = heatmaps.filter((m) => m.id !== mapId);
    updateHeatmaps(updated);
  };

  // Create new heatmap
  const handleCreateMap = (
    newMapData: Omit<HeatMapModel, 'id' | 'createdAt' | 'entries'>
  ) => {
    const newMap: HeatMapModel = {
      ...newMapData,
      id: `map-${Date.now()}`,
      createdAt: new Date().toISOString(),
      entries: {},
    };
    const updated = [newMap, ...heatmaps];
    updateHeatmaps(updated);
  };

  const activeModalHeatmap = selectedDayInfo
    ? heatmaps.find((m) => m.id === selectedDayInfo.mapId) || null
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor="#090B0E" />

      {/* Main container with max-width for desktop window layout */}
      <View style={styles.appContainer}>
        {/* Header */}
        <Header
          currentView={viewMode}
          onViewChange={setViewMode}
          onOpenCreate={() => setIsCreateOpen(true)}
          onOpenWidgetStudio={() => setIsWidgetOpen(true)}
          mapsCount={heatmaps.length}
        />

        {/* Filter & Search Bar */}
        <View style={styles.filterBar}>
          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.categoryTabText, isSelected && styles.categoryTabTextActive]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Search Input */}
          <View style={styles.searchBox}>
            <Search size={13} color="#6E7681" />
            <TextInput
              style={styles.searchInput}
              placeholder="Filter maps..."
              placeholderTextColor="#484F58"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Heatmaps List */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>INITIALIZING LOCAL DATA...</Text>
            </View>
          ) : filteredMaps.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>NO HEATMAPS FOUND</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try modifying your search filter.'
                  : 'Start tracking your habits, fitness goals, and routines.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setIsCreateOpen(true)}
                activeOpacity={0.7}
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>CREATE FIRST HEATMAP</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredMaps.map((map) => (
              <HeatmapCard
                key={map.id}
                heatmap={map}
                viewMode={viewMode}
                onSelectDate={(mId, dKey) =>
                  setSelectedDayInfo({ mapId: mId, dateKey: dKey })
                }
                onQuickLogToday={handleQuickLogToday}
                onDeleteMap={handleDeleteMap}
              />
            ))
          )}
        </ScrollView>
      </View>

      {/* Day Inspection & Edit Modal */}
      <DayDetailModal
        visible={!!selectedDayInfo}
        dateKey={selectedDayInfo?.dateKey || null}
        heatmap={activeModalHeatmap}
        onClose={() => setSelectedDayInfo(null)}
        onSave={handleSaveDayEntry}
        onDelete={handleDeleteDayEntry}
      />

      {/* Create New HeatMap Modal */}
      <CreateHeatmapModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateMap}
      />

      {/* Widget Studio Modal */}
      <WidgetStudioModal
        visible={isWidgetOpen}
        heatmaps={heatmaps}
        onClose={() => setIsWidgetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07080A',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    backgroundColor: '#07080A',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#090B0E',
    borderBottomWidth: 1,
    borderBottomColor: '#161B22',
    gap: 12,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#21262D',
    backgroundColor: '#0E1116',
  },
  categoryTabActive: {
    borderColor: '#58A6FF',
    backgroundColor: '#161B22',
  },
  categoryTabText: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    
    letterSpacing: 0.5,
  },
  categoryTabTextActive: {
    color: '#F0F6FC',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E1116',
    borderColor: '#21262D',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 140,
  },
  searchInput: {
    color: '#F0F6FC',
    fontSize: 11,
    
    padding: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '700',
    
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#6E7681',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 320,
    lineHeight: 18,
  },
  emptyText: {
    color: '#6E7681',
    fontSize: 12,
    
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#238636',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 3,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    
    letterSpacing: 0.5,
  },
});
