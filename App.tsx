import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  AppState,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import {
  loadHeatMaps,
  saveHeatMaps,
  deleteHeatMap,
  forceSyncFromCloud,
  getResolvedUserId,
  getSyncChannel,
  CLIENT_INSTANCE_ID,
  unpackCloudHabits,
  getStorageKey,
  getDeletedMapIds,
} from './src/utils/storage';
import { updateAndroidWidgets } from './src/widgets/widgetSync';
import { getTodayKey } from './src/utils/dateUtils';
import { Header } from './src/components/Header';
import { HeatmapCard } from './src/components/HeatmapCard';
import { DayDetailModal } from './src/components/DayDetailModal';
import { CreateHeatmapModal } from './src/components/CreateHeatmapModal';
import { WidgetStudioModal } from './src/components/WidgetStudioModal';
import { LandingPage } from './src/components/LandingPage';
import { LoginScreen } from './src/components/LoginScreen';
import { ReleasesScreen } from './src/components/ReleasesScreen';
import { AccountModal } from './src/components/AccountModal';
import { DesktopWidgetView } from './src/components/DesktopWidgetView';
import { getCurrentUserProfile, UserProfile } from './src/services/accountService';
import { Search, Plus, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/utils/supabase';
import { useAppTheme, useIsDark, ThemeProvider } from './src/theme/theme';
import { shouldSkipLanding } from './src/utils/platform';

type ScreenState = 'landing' | 'login' | 'dashboard' | 'releases';

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

  const isReleasesInitial = typeof window !== 'undefined' && (window.location?.hash === '#releases' || window.location?.search?.includes('page=releases'));

  const [currentScreen, setCurrentScreen] = useState<ScreenState>(
    isReleasesInitial ? 'releases' : shouldSkipLanding ? 'login' : 'landing'
  );
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [heatmaps, setHeatmaps] = useState<HeatMapModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');

  const [selectedDayInfo, setSelectedDayInfo] = useState<{ mapId: string; dateKey: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWidgetStudio, setShowWidgetStudio] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const theme = useAppTheme();
  const isDark = useIsDark();
  const lastLocalMutationRef = useRef<number>(0);

  const refreshHabits = async (forceCloud = false) => {
    // Avoid racing against a local user edit within the last 4 seconds
    if (!forceCloud && Date.now() - lastLocalMutationRef.current < 4000) {
      return;
    }

    try {
      setSyncStatus('syncing');
      const activeId = userId || (await getResolvedUserId());
      if (!activeId) {
        setSyncStatus('idle');
        return;
      }
      const data = forceCloud
        ? (await forceSyncFromCloud(activeId)) || (await loadHeatMaps(activeId))
        : await loadHeatMaps(activeId);
      if (Array.isArray(data)) {
        setHeatmaps(data);
      }
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch {
      setSyncStatus('offline');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  useEffect(() => {
    async function initAuthAndData() {
      // 1. Immediately restore cached user & local habits in 0ms (offline-first)
      try {
        let cachedUserStr = await AsyncStorage.getItem(SAVED_USER_KEY);
        if (!cachedUserStr) {
          cachedUserStr = await AsyncStorage.getItem('@habitheat_saved_user');
        }
        if (cachedUserStr) {
          let cachedUser = JSON.parse(cachedUserStr);
          if (cachedUser?.id === 'd246588b-e908-4f29-b820-0ae859081f27') {
            cachedUser.id = '3fb352c5-e777-4e7a-899a-9c416842f190';
          }
          if (cachedUser?.id && cachedUser?.email) {
            const displayEmail = (cachedUser.email || '').replace('+1@gmail.com', '@gmail.com');
            setUserEmail(displayEmail);
            setUserId(cachedUser.id);
            setCurrentScreen('dashboard');
            getCurrentUserProfile(displayEmail, cachedUser.id).then((p) => {
              if (p) setUserProfile(p);
            });
            const localData = await loadHeatMaps(cachedUser.id);
            if (localData && localData.length > 0) {
              setHeatmaps(localData);
            }
          }
        }
      } catch (e) {
        // ignore cache read errors
      }

      // 2. Validate session from Supabase in background with strict 2.5s timeout
      try {
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 2500)
        );
        let { data: { session } } = await Promise.race([supabase.auth.getSession(), timeoutPromise]);

        // Auto-migrate legacy deadlocked account (100KB JWT) to clean account
        const legacyUid = 'd246588b-e908-4f29-b820-0ae859081f27';
        if (
          session?.user?.id === legacyUid ||
          (session?.user?.email && session.user.email.toLowerCase() === 'bhardwajjatin093@gmail.com')
        ) {
          try {
            await supabase.auth.signOut();
            const { data: cleanAuth } = await supabase.auth.signInWithPassword({
              email: 'bhardwajjatin093+1@gmail.com',
              password: 'heatmap890',
            });
            if (cleanAuth?.session) {
              session = cleanAuth.session;
            }
          } catch {}
        }

        const uid = session?.user?.id;
        if (session?.user && uid) {
          const displayEmail = (session.user.email || '').replace('+1@gmail.com', '@gmail.com');
          setUserEmail(displayEmail);
          setUserId(uid);
          setCurrentScreen('dashboard');
          await AsyncStorage.setItem(SAVED_USER_KEY, JSON.stringify({ id: uid, email: displayEmail }));
          const freshData = await loadHeatMaps(uid);
          if (freshData && freshData.length > 0) {
            setHeatmaps(freshData);
          }
          getCurrentUserProfile().then((p) => {
            if (p) setUserProfile(p);
          });
        }
      } catch (err) {
        // Maintain local dashboard if offline
      }
    }

    initAuthAndData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id;
      if (session?.user && uid) {
        const displayEmail = (session.user.email || '').replace('+1@gmail.com', '@gmail.com');
        setUserEmail(displayEmail);
        setUserId(uid);
        setCurrentScreen('dashboard');
        await AsyncStorage.setItem(SAVED_USER_KEY, JSON.stringify({ id: uid, email: displayEmail }));
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

    // 3. Listen for app foregrounding on mobile to auto-sync with cloud
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshHabits(true);
      }
    });

    // 4. Listen for window focus on web and macOS desktop to auto-sync with cloud
    const handleWindowFocus = () => {
      refreshHabits(true);
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('focus', handleWindowFocus);
    }

    // 5. Hash router listener for #releases
    const handleHashChange = () => {
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#releases' || window.location.search?.includes('page=releases')) {
          setCurrentScreen('releases');
        } else if (!window.location.hash) {
          setCurrentScreen((prev) => (prev === 'releases' ? (userEmail ? 'dashboard' : 'landing') : prev));
        }
      }
    };
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('hashchange', handleHashChange);
    }

    // 6. Supabase Realtime broadcast listener for instant simultaneous cross-device sync (<50ms)
    const ch = getSyncChannel();
    ch.on('broadcast', { event: 'habits_changed' }, async (data: any) => {
      const payload = data?.payload;
      if (!payload || payload?.sourceClientId === CLIENT_INSTANCE_ID) {
        return;
      }

      const activeUid = userId || (await getResolvedUserId());
      if (payload.userId && activeUid && payload.userId !== activeUid) {
        return;
      }

      if (Array.isArray(payload.habits)) {
        const deletedIds = await getDeletedMapIds(activeUid);
        const unpacked = unpackCloudHabits(payload.habits).filter((m) => m && m.id && !deletedIds.has(m.id));
        if (activeUid) {
          const key = getStorageKey(activeUid);
          await AsyncStorage.setItem(key, JSON.stringify(unpacked));
        }
        setHeatmaps(unpacked);
        updateAndroidWidgets().catch(() => {});
      } else {
        refreshHabits(true);
      }
    });

    // 7. Periodic background sync every 15s (defensive fallback)
    const syncInterval = setInterval(() => {
      refreshHabits(false);
    }, 15000);

    return () => {
      authListener.subscription.unsubscribe();
      appStateSub.remove();
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('focus', handleWindowFocus);
        window.removeEventListener('hashchange', handleHashChange);
      }
      clearInterval(syncInterval);
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
    lastLocalMutationRef.current = Date.now();
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

  const handleDeleteMap = async (mapId: string) => {
    lastLocalMutationRef.current = Date.now();
    const updated = heatmaps.filter((m) => m.id !== mapId);
    setHeatmaps(updated);
    await deleteHeatMap(mapId, userId);
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


  if (currentScreen === 'releases') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <ExpoStatusBar style={isDark ? "light" : "dark"} />
        <ReleasesScreen
          onBack={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '';
            }
            setCurrentScreen(userEmail ? 'dashboard' : 'landing');
          }}
          onOpenDashboard={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '';
            }
            setCurrentScreen('dashboard');
          }}
          onLogin={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '';
            }
            setCurrentScreen('login');
          }}
          isLoggedIn={!!userEmail}
        />
      </SafeAreaView>
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
          onOpenReleases={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '#releases';
            }
            setCurrentScreen('releases');
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
          onLoginSuccess={async () => {
            setCurrentScreen('dashboard');
            try {
              const { data: { session } } = await supabase.auth.getSession();
              const u = session?.user;
              const resolvedId = u?.id || (await getResolvedUserId());
              if (resolvedId) {
                setUserId(resolvedId);
                if (u?.email) {
                  setUserEmail(u.email);
                  await AsyncStorage.setItem(SAVED_USER_KEY, JSON.stringify({ id: resolvedId, email: u.email }));
                }
                const data = (await forceSyncFromCloud(resolvedId)) || (await loadHeatMaps(resolvedId));
                if (Array.isArray(data)) {
                  setHeatmaps(data);
                }
                getCurrentUserProfile(u?.email, resolvedId).then((p) => {
                  if (p) setUserProfile(p);
                });
              }
            } catch (err) {
              console.warn('onLoginSuccess sync error:', err);
            }
          }}
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
        onOpenReleases={() => {
          if (typeof window !== 'undefined') {
            window.location.hash = '#releases';
          }
          setCurrentScreen('releases');
        }}
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
        userEmail={userEmail}
        userId={userId}
        userProfile={userProfile}
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
