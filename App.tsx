import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
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
import { AccountModal } from './src/components/AccountModal';
import { DesktopWidgetView } from './src/components/DesktopWidgetView';
import { getCurrentUserProfile, UserProfile } from './src/services/accountService';
import { Search, Plus, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/utils/supabase';
import { useAppTheme, useIsDark, ThemeProvider } from './src/theme/theme';
import { shouldSkipLanding } from './src/utils/platform';

type ScreenState = 'landing' | 'login' | 'dashboard';

const SAVED_USER_KEY = '@trackheat_saved_user';

const fontStack = Platform.select({
  web: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  ios: 'System',
  default: 'sans-serif',
  });

function AppContent() {
  const isWidgetMode = typeof window !== 'undefined' && window.location?.search?.includes('mode=widget');
  if (isWidgetMode) {
    return <DesktopWidgetView />;
  }

  const [currentScreen, setCurrentScreen] = useState<ScreenState>(
    shouldSkipLanding ? 'login' : 'landing'
  );
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [heatmaps, setHeatmaps] = useState<HeatMapModel[]>([]);
  const [loading, setLoading] = useState(shouldSkipLanding);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedDayInfo, setSelectedDayInfo] = useState<{ mapId: string; dateKey: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWidgetStudio, setShowWidgetStudio] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const theme = useAppTheme();
  const isDark = useIsDark();

  useEffect(() => {
    async function initAuthAndData() {
      // 1. Immediately check cached user for zero-latency dashboard restore (no landing page flash)
      try {
        let cachedUserStr = await AsyncStorage.getItem(SAVED_USER_KEY);
        if (!cachedUserStr) {
          cachedUserStr = await AsyncStorage.getItem('@habitheat_saved_user');
        }
        if (cachedUserStr) {
          const cachedUser = JSON.parse(cachedUserStr);
          if (cachedUser?.id && cachedUser?.email) {
            setUserEmail(cachedUser.email);
            setUserId(cachedUser.id);
            setCurrentScreen('dashboard');
            const localData = await loadHeatMaps(cachedUser.id);
            if (localData && localData.length > 0) {
              setHeatmaps(localData);
            }
          }
        }
      } catch (e) {
        // ignore cache read errors
      } finally {
        setLoading(false);
      }

      // 2. Validate / Hydrate session from Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (session?.user && uid) {
          setUserEmail(session.user.email);
          setUserId(uid);
          setCurrentScreen('dashboard');
          await AsyncStorage.setItem(SAVED_USER_KEY, JSON.stringify({ id: uid, email: session.user.email }));
          const freshData = await loadHeatMaps(uid);
          setHeatmaps(freshData);
          getCurrentUserProfile().then((p) => {
            if (p) setUserProfile(p);
          });
        } else {
          // If no active session, attempt background token refresh if cached user exists
          const cachedUserStr = await AsyncStorage.getItem(SAVED_USER_KEY);
          if (cachedUserStr) {
            const { data: refreshed } = await supabase.auth.refreshSession();
            if (refreshed.session?.user) {
              const rUid = refreshed.session.user.id;
              setUserEmail(refreshed.session.user.email);
              setUserId(rUid);
              setCurrentScreen('dashboard');
              const freshData = await loadHeatMaps(rUid);
              setHeatmaps(freshData);
              getCurrentUserProfile().then((p) => {
                if (p) setUserProfile(p);
              });
            }
          }
        }
      } catch (err) {
        // If offline or network issue, maintain current cached dashboard
      } finally {
        setLoading(false);
      }
    }

    initAuthAndData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id;
      if (session?.user && uid) {
        setUserEmail(session.user.email);
        setUserId(uid);
        setCurrentScreen('dashboard');
        await AsyncStorage.setItem(SAVED_USER_KEY, JSON.stringify({ id: uid, email: session.user.email }));
        const data = await loadHeatMaps(uid);
        setHeatmaps(data);
        getCurrentUserProfile().then((p) => {
          if (p) setUserProfile(p);
        });
      } else if (event === 'SIGNED_OUT') {
        // Explicit logout only
        await AsyncStorage.removeItem(SAVED_USER_KEY);
        await AsyncStorage.removeItem('@habitheat_saved_user');
        setUserEmail(undefined);
        setUserId(undefined);
        setUserProfile(null);
        setCurrentScreen(shouldSkipLanding ? 'login' : 'landing');
        setHeatmaps([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem(SAVED_USER_KEY);
    await AsyncStorage.removeItem('@habitheat_saved_user');
    setUserEmail(undefined);
    setUserId(undefined);
    setUserProfile(null);
    setCurrentScreen(shouldSkipLanding ? 'login' : 'landing');
    setHeatmaps([]);
    await supabase.auth.signOut();
  };

  const handleContinueAsGuest = async () => {
    setUserEmail(undefined);
    setUserId(undefined);
    setUserProfile(null);
    setCurrentScreen('dashboard');
    const guestData = await loadHeatMaps();
    setHeatmaps(guestData);
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

  const handleUpdateMapViewMode = (mapId: string, mode: ViewMode) => {
    const updated = heatmaps.map((m) => (m.id === mapId ? { ...m, defaultView: mode } : m));
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
          Loading TrackHeat...
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
          onBack={shouldSkipLanding ? undefined : () => setCurrentScreen('landing')} 
          onLoginSuccess={() => setCurrentScreen('dashboard')}
          onContinueAsGuest={handleContinueAsGuest}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ExpoStatusBar style={isDark ? "light" : "dark"} />

      <Header
        onOpenWidgetStudio={() => setShowWidgetStudio(true)}
        onOpenAccountModal={() => setShowAccountModal(true)}
        onLogout={handleLogout}
        userEmail={userEmail}
        userName={userProfile?.displayName}
        userHandle={userProfile?.username}
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
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: isDark ? '#39D353' : '#1A7F37' }]}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.85}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.createButtonText}>New Habit</Text>
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
                onSelectDate={(mapId, dKey) => setSelectedDayInfo({ mapId, dateKey: dKey })}
                onQuickLogToday={handleQuickLogToday}
                onDeleteMap={handleDeleteMap}
                onUpdateViewMode={handleUpdateMapViewMode}
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

      <AccountModal
        visible={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onLogout={handleLogout}
        onProfileUpdated={(p) => setUserProfile(p)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
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
    marginBottom: 16,
    gap: 10,
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
    height: '100%',
    paddingVertical: 0,
    fontSize: 14,
    fontFamily: fontStack,
    ...(Platform.OS === 'android'
      ? {
          includeFontPadding: false,
          textAlignVertical: 'center',
        }
      : {}),
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
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
