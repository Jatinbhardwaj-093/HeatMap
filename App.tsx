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
  Image,
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
import { Search, Plus, Sparkles } from 'lucide-react-native';
import { supabase } from './src/utils/supabase';
import { useAppTheme, useIsDark, ThemeProvider } from './src/theme/theme';

type ScreenState = 'landing' | 'login' | 'dashboard';

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
});

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('landing');
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  const [heatmaps, setHeatmaps] = useState<HeatMapModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedDayInfo, setSelectedDayInfo] = useState<{ mapId: string; dateKey: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWidgetStudio, setShowWidgetStudio] = useState(false);

  const theme = useAppTheme();
  const isDark = useIsDark();

  useEffect(() => {
    async function initAuthAndData() {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (session?.user) {
        setUserEmail(session.user.email);
        setUserId(uid);
        setCurrentScreen('dashboard');
      }
      const data = await loadHeatMaps(uid);
      setHeatmaps(data);
      setLoading(false);
    }

    initAuthAndData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id;
      if (session?.user) {
        setUserEmail(session.user.email);
        setUserId(uid);
        setCurrentScreen('dashboard');
        const data = await loadHeatMaps(uid);
        setHeatmaps(data);
      } else {
        setUserEmail(undefined);
        setUserId(undefined);
        setCurrentScreen('landing');
        setHeatmaps([]);
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
    saveHeatMaps(updated, userId);
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

  const filteredHeatmaps = useMemo(() => {
    if (!searchQuery.trim()) return heatmaps;
    const q = searchQuery.toLowerCase();
    return heatmaps.filter((m) => m.title.toLowerCase().includes(q));
  }, [heatmaps, searchQuery]);

  if (loading) {
    return (
      <View style={[{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.textSecondary, fontFamily: fontStack }}>
          Loading HabitHeat...
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
        {/* Controls: Clean search and new button */}
        <View style={styles.controlsRow}>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
            <Search size={15} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search habits..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: isDark ? '#39D353' : '#1A7F37' }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.85}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.createButtonText}>New Map</Text>
          </TouchableOpacity>
        </View>

        {/* Dashboard Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
          {filteredHeatmaps.length === 0 ? (
            <View style={[styles.emptyContainer, { backgroundColor: theme.surface, borderColor: theme.borderSubtle }]}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
                <Image source={require('./assets/icon.png')} style={styles.emptyIcon} resizeMode="contain" />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Start tracking. Create new map.</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Your dashboard is fresh. Create your first habit matrix to start compounding your daily streak.
              </Text>
              <TouchableOpacity
                style={[styles.emptyCreateBtn, { backgroundColor: isDark ? '#39D353' : '#1A7F37' }]}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.85}
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.emptyCreateBtnText}>Create New Map</Text>
              </TouchableOpacity>
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

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontStack,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 10,
    gap: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: fontStack,
  },
  cardsScroll: {
    paddingBottom: 40,
  },

  // Empty state right in the middle
  emptyContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginTop: 36,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  emptyIcon: {
    width: 36,
    height: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fontStack,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontStack,
    textAlign: 'center',
    maxWidth: 380,
    marginBottom: 24,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    height: 44,
    borderRadius: 10,
  },
  emptyCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontStack,
  },
});
