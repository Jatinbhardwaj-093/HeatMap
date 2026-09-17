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
import { LandingPage } from './src/components/LandingPage';
import { LoginScreen } from './src/components/LoginScreen';
import { Search, Plus } from 'lucide-react-native';
import { supabase } from './src/utils/supabase';

type ScreenState = 'landing' | 'login' | 'dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('landing');
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  
  const [heatmaps, setHeatmaps] = useState<HeatMapModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedDayInfo, setSelectedDayInfo] = useState<{ mapId: string; dateKey: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWidgetStudio, setShowWidgetStudio] = useState(false);

  useEffect(() => {
    async function initAuthAndData() {
      // 1. Check Auth Session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email);
        setCurrentScreen('dashboard');
      }

      // 2. Load Local Data (if applicable)
      const data = await loadHeatMaps();
      setHeatmaps(data);
      setLoading(false);
    }

    initAuthAndData();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email);
        setCurrentScreen('dashboard');
      } else {
        setUserEmail(undefined);
        setCurrentScreen('landing');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const updateHeatmaps = (updated: HeatMapModel[]) => {
    setHeatmaps(updated);
    saveHeatMaps(updated);
  };

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

  const handleDeleteMap = (mapId: string) => {
    const updated = heatmaps.filter((m) => m.id !== mapId);
    updateHeatmaps(updated);
  };

  const handleCreateMap = (newMap: Omit<HeatMapModel, 'id' | 'createdAt' | 'entries'>) => {
    const id = `hm-${Date.now()}`;
    const mapToSave: HeatMapModel = {
      ...newMap,
      id,
      createdAt: new Date().toISOString(),
      entries: {},
    };
    updateHeatmaps([...heatmaps, mapToSave]);
  };

  const categories = useMemo(() => {
    const cats = new Set(heatmaps.map((m) => m.category.toUpperCase()));
    return ['ALL', ...Array.from(cats)];
  }, [heatmaps]);

  const filteredHeatmaps = useMemo(() => {
    let filtered = heatmaps;
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter((m) => m.category.toUpperCase() === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(q));
    }
    return filtered;
  }, [heatmaps, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Loading HeatMaps...</Text>
      </View>
    );
  }

  if (currentScreen === 'landing') {
    return (
      <SafeAreaView style={styles.container}>
        <ExpoStatusBar style="light" />
        <LandingPage 
          onLogin={() => setCurrentScreen('login')} 
          onDashboard={() => setCurrentScreen('dashboard')} 
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={styles.container}>
        <ExpoStatusBar style="light" />
        <LoginScreen 
          onBack={() => setCurrentScreen('landing')} 
          onLoginSuccess={() => setCurrentScreen('dashboard')} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />

      <Header
        currentView={viewMode}
        onChangeViewMode={setViewMode}
        onOpenWidgetStudio={() => setShowWidgetStudio(true)}
        onLogout={handleLogout}
        userEmail={userEmail}
      />

      <View style={styles.mainContent}>
        <View style={styles.controlsRow}>
          <View style={styles.searchBar}>
            <Search size={14} color="#8B949E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search heatmaps..."
              placeholderTextColor="#8B949E"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={3} />
            <Text style={styles.createButtonText}>New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.7}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
          {filteredHeatmaps.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No heatmaps found.</Text>
            </View>
          ) : (
            filteredHeatmaps.map((hm) => (
              <HeatmapCard
                key={hm.id}
                heatmap={hm}
                viewMode={viewMode}
                onSelectDate={(mapId, dKey) => setSelectedDayInfo({ mapId, dateKey: dKey })}
                onQuickLogToday={handleQuickLogToday}
                onDeleteMap={handleDeleteMap}
              />
            ))
          )}
        </ScrollView>
      </View>

      <DayDetailModal
        visible={!!selectedDayInfo}
        dateKey={selectedDayInfo?.dateKey || null}
        heatmap={heatmaps.find((m) => m.id === selectedDayInfo?.mapId) || null}
        onClose={() => setSelectedDayInfo(null)}
        onSave={handleSaveDayEntry}
        onDelete={handleDeleteDayEntry}
      />

      <CreateHeatmapModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateMap}
      />

      <WidgetStudioModal
        visible={showWidgetStudio}
        heatmaps={heatmaps}
        onClose={() => setShowWidgetStudio(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0C',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8B949E',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1116',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 4,
    paddingHorizontal: 10,
    height: 36,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#F0F6FC',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#238636',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 4,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  categoryScroll: {
    maxHeight: 40,
    minHeight: 40,
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    backgroundColor: '#0E1116',
  },
  categoryPillActive: {
    borderColor: '#58A6FF',
    backgroundColor: '#0D1117',
  },
  categoryText: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  categoryTextActive: {
    color: '#F0F6FC',
    fontWeight: '600',
  },
  cardsScroll: {
    paddingBottom: 40,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#6E7681',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
