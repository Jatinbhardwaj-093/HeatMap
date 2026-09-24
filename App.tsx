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
import { useAppTheme, useIsDark } from './src/theme/theme';

type ScreenState = 'landing' | 'login' | 'dashboard';

function AppContent() {
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

  const theme = useAppTheme();
  const isDark = useIsDark();

  useEffect(() => {
    async function initAuthAndData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email);
        setCurrentScreen('dashboard');
      }
      const data = await loadHeatMaps();
      setHeatmaps(data);
      setLoading(false);
    }

    initAuthAndData();

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
      <View style={[{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textSecondary, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' }}>
          Loading HeatMaps...
        </Text>
      </View>
    );
  }

  if (currentScreen === 'landing') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ExpoStatusBar style={isDark ? "light" : "dark"} />
        <LandingPage 
          onLogin={() => setCurrentScreen('login')} 
          onDashboard={() => {
            if (userEmail) {
              setCurrentScreen('dashboard');
            } else {
              setCurrentScreen('login');
            }
          }}
          isLoggedIn={!!userEmail}
        />
      </SafeAreaView>
    );
  }

  if (currentScreen === 'login') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ExpoStatusBar style={isDark ? "light" : "dark"} />
        <LoginScreen 
          onBack={() => setCurrentScreen('landing')} 
          onLoginSuccess={() => setCurrentScreen('dashboard')} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ExpoStatusBar style={isDark ? "light" : "dark"} />

      <Header
        currentView={viewMode}
        onChangeViewMode={setViewMode}
        onOpenWidgetStudio={() => setShowWidgetStudio(true)}
        onLogout={handleLogout}
        userEmail={userEmail}
      />

      <View style={styles.mainContent}>
        <View style={styles.controlsRow}>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search size={14} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search heatmaps..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: theme.success }]}
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
                  { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle },
                  selectedCategory === cat && { borderColor: '#58A6FF', backgroundColor: theme.surface },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: theme.textSecondary },
                    selectedCategory === cat && { color: theme.text, fontWeight: '600' },
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
              <Text style={{ color: theme.textMuted, fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' }}>
                No heatmaps found.
              </Text>
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
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 6,
    gap: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  categoryScroll: {
    maxHeight: 44,
    minHeight: 44,
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cardsScroll: {
    paddingBottom: 40,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },
});

import { ThemeProvider } from './src/theme/theme';
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
