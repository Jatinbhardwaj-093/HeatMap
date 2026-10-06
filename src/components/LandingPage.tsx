import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Image,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowRight,
  Github,
  Monitor,
  Smartphone,
  Globe,
  Download,
  Flame,
  Check,
  X,
  Sun,
  Moon,
  Sparkles,
  Lock,
  History,
  Tag,
  ExternalLink,
} from 'lucide-react-native';
import { useAppTheme, useIsDark, useThemeMode } from '../theme/theme';
import { isMacDesktop, dragRegion, noDragRegion } from '../utils/platform';

interface LandingPageProps {
  onLogin: () => void;
  onDashboard: () => void;
  isLoggedIn?: boolean;
}

const DEMO_DATA = {
  id: 'deep-work',
  name: 'Core Discipline & Deep Work',
  colorName: 'Emerald Matrix',
  accentColor: '#39D353',
  levelColors: ['#161B22', '#0E4429', '#006D32', '#26A641', '#39D353'] as [string, string, string, string, string],
  streak: 48,
  completionRate: '94.8%',
  totalDays: 286,
};

const MONTH_HEADERS = [
  { label: 'Jan', week: 0 },
  { label: 'Feb', week: 4 },
  { label: 'Mar', week: 8 },
  { label: 'Apr', week: 13 },
  { label: 'May', week: 17 },
  { label: 'Jun', week: 21 },
  { label: 'Jul', week: 26 },
  { label: 'Aug', week: 30 },
  { label: 'Sep', week: 35 },
  { label: 'Oct', week: 39 },
  { label: 'Nov', week: 44 },
  { label: 'Dec', week: 48 },
];

const MOBILE_MONTH_HEADERS = [
  { label: 'Jan', week: 0 },
  { label: 'Mar', week: 9 },
  { label: 'May', week: 18 },
  { label: 'Jul', week: 26 },
  { label: 'Sep', week: 35 },
  { label: 'Nov', week: 44 },
];

// Generate authentic full-year 52-week matrix patterns with realistic blanks and streaks
function generateFullYearData(): number[][] {
  const weeks: number[][] = [];
  const TOTAL_WEEKS = 52;

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const weekDays: number[] = [];

    for (let d = 0; d < 7; d++) {
      const isWeekend = d >= 5;

      // Weeks 44 to 51 (November & December): Strong momentum and consistency leading up to year end
      if (w >= 44) {
        if (isWeekend) {
          const r = (w * 13 + d * 7) % 10;
          weekDays.push(r > 6 ? 2 : 0);
        } else {
          const r = (w * 17 + d * 11) % 10;
          if (r === 0) weekDays.push(2);
          else if (r < 5) weekDays.push(3);
          else weekDays.push(4);
        }
        continue;
      }

      // Weeks 36 to 43 (September - October): Active compounding streak
      if (w >= 36) {
        if (isWeekend) {
          const r = (w * 7 + d * 5) % 10;
          weekDays.push(r > 6 ? 2 : 0);
        } else {
          const r = (w * 11 + d * 13) % 10;
          weekDays.push(r === 0 ? 0 : r < 4 ? 3 : 4);
        }
        continue;
      }

      // Mid-year vacation (week 26 in July)
      if (w === 26) {
        weekDays.push(0);
        continue;
      }

      // Rest of the year (January - August): realistic consistency with authentic human variation
      if (isWeekend) {
        const r = (w * 7 + d * 13) % 10;
        weekDays.push(r > 7 ? 2 : 0);
      } else {
        const r = (w * 11 + d * 17) % 10;
        if (r === 0 || r === 5) weekDays.push(0);
        else if (r < 4) weekDays.push(2);
        else if (r < 7) weekDays.push(3);
        else weekDays.push(4);
      }
    }
    weeks.push(weekDays);
  }

  return weeks;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  onDashboard,
  isLoggedIn = false,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const matrixScrollRef = useRef<ScrollView>(null);

  const theme = useAppTheme();
  const isDark = useIsDark();
  const { themeMode, setThemeMode } = useThemeMode();

  const activePreset = DEMO_DATA;

  // Dynamic cell sizing on mobile to fit the entire year with ZERO horizontal scrolling
  const mobileCellGap = 1.5;
  const mobileDayLabelWidth = 14;
  const mobileAvailableWidth = Math.max(260, width - 48);
  const mobileMatrixWidth = mobileAvailableWidth - mobileDayLabelWidth;
  const mobileCellSize = Math.max(3.2, Math.min(6, (mobileMatrixWidth - (51 * mobileCellGap)) / 52));
  const mobileStep = mobileCellSize + mobileCellGap;

  // Interactive user edits in the demo
  const [clickedCells, setClickedCells] = useState<Record<string, number>>({});

  // 52-week full year data matrix
  const baseMatrix = useMemo(() => {
    return generateFullYearData();
  }, []);

  const toggleDemoCell = (cellKey: string, currentLevel: number) => {
    setClickedCells((prev) => ({
      ...prev,
      [cellKey]: prev[cellKey] !== undefined ? (prev[cellKey] === 0 ? 4 : 0) : currentLevel > 0 ? 0 : 4,
    }));
  };

  const GITHUB_REPO = 'https://github.com/Jatinbhardwaj-093/HeatMap';
  const RELEASE_TAG_URL = `${GITHUB_REPO}/releases/tag/v1.2.2`;
  const MAC_DMG_URL = `${GITHUB_REPO}/releases/download/v1.2.2/TrackHeat-1.2.2-arm64.dmg`;
  const ANDROID_APK_URL = `${GITHUB_REPO}/releases/download/v1.2.2/TrackHeat-1.2.2.apk`;

  const RELEASES_DATA = [
    {
      version: 'v1.2.2',
      date: 'October 2026',
      tag: 'Latest Stable',
      isLatest: true,
      summary: 'High-reliability update featuring automated background sync, vector-centered widget icons, and calibrated window safe areas.',
      highlights: [
        'Local Authority Account Persistence: Real-time optimistic caching and Supabase session synchronization for user display names and handles.',
        '100% Background Cloud Sync: Removed manual synchronization buttons; state reconciles completely in the background.',
        'Vector SVG Widget Actions: Replaced Android RemoteViews text glyphs with geometric SVGs for mathematically centered icons across all densities.',
        'Widget Safe Areas: Calibrated top spacing for camera cutouts and status bars, plus an authentic 20-week preview matrix.',
        'Calibrated macOS Clearances: Desktop window dragging clearance under native traffic lights while maintaining compact web dashboard navbar.',
      ],
      links: [
        { label: 'Download .DMG (macOS)', url: MAC_DMG_URL, primary: true },
        { label: 'Download .APK (Android)', url: ANDROID_APK_URL, primary: true },
        { label: 'GitHub Release', url: RELEASE_TAG_URL },
      ],
    },
    {
      version: 'v1.2.1',
      date: 'October 2026',
      tag: 'Maintenance',
      isLatest: false,
      summary: 'Dynamic widget layout scaling and typography refinement for home screen habit cards.',
      highlights: [
        'Adaptive Widget Formats: Responsive layout handling for 2x1 horizontal quick-log pills and 2x2 multi-week matrix views.',
        'Habit Identity Header: Habit title display next to log toggle with automatic font scaling.',
        'Typography Polish: Resolved font metric descent clipping on compact Android launchers.',
        'Asset Catalog: Re-architected screenshot gallery with high-density responsive presentation.',
      ],
      links: [
        { label: 'Download .DMG (macOS)', url: `${GITHUB_REPO}/releases/download/v1.2.1/TrackHeat-1.2.1-arm64.dmg` },
        { label: 'Download .APK (Android)', url: `${GITHUB_REPO}/releases/download/v1.2.1/TrackHeat-1.2.1.apk` },
        { label: 'GitHub Release', url: `${GITHUB_REPO}/releases/tag/v1.2.1` },
      ],
    },
    {
      version: 'v1.2.0',
      date: 'October 2026',
      tag: 'Feature',
      isLatest: false,
      summary: 'Introduction of native Android home screen widgets and the Obsidian monochrome palette.',
      highlights: [
        'Interactive Android Widgets: Glanceable home screen widgets with direct 1-tap logging without opening the application.',
        'Widget Configuration Screen: Dedicated in-app studio for habit selection, theme picking, and live grid previews.',
        'Obsidian Palette: Ultra-clean monochromatic colorway engineered for high contrast in both light and dark modes.',
        'Android Preview Pipeline: Automated signed standalone APK releases distributed through EAS.',
      ],
      links: [
        { label: 'GitHub Release', url: `${GITHUB_REPO}/releases/tag/v1.2.0` },
      ],
    },
    {
      version: 'v1.1.0',
      date: 'September 2026',
      tag: 'Feature',
      isLatest: false,
      summary: 'Cross-platform expansion introducing universal macOS desktop client and Supabase cloud sync.',
      highlights: [
        'macOS Desktop Application: Native Electron client with draggable frameless window title bar and native macOS controls.',
        'Cloud Synchronization: Supabase PostgreSQL database backend with offline cache reconciliation.',
        'Progressive Web App: Deployed on high-performance global CDN edge for zero-install access.',
        'Matrix Performance: Virtualized rendering optimizations for multi-year habit histories.',
      ],
      links: [
        { label: 'GitHub Release', url: `${GITHUB_REPO}/releases/tag/v1.1.0` },
      ],
    },
    {
      version: 'v1.0.0',
      date: 'September 2026',
      tag: 'Initial Release',
      isLatest: false,
      summary: 'Foundational release of the binary habit matrix engine inspired by GitHub contribution graphs.',
      highlights: [
        'Binary Habit Matrix: Clean day-by-day contribution graph visualization with streak calculation.',
        'Local-First Storage: Zero-latency tracking with full offline persistence and privacy.',
        'Dynamic Color Themes: 10 curated themes including GitHub Green, GitLab Orange, Synthwave, and Minimal Dark.',
      ],
      links: [
        { label: 'GitHub Release', url: `${GITHUB_REPO}/releases/tag/v1.0.0` },
      ],
    },
  ];

  const pageScrollRef = useRef<ScrollView>(null);
  const [releasesY, setReleasesY] = useState(0);

  const handleScrollToReleases = () => {
    if (pageScrollRef.current && releasesY > 0) {
      pageScrollRef.current.scrollTo({ y: releasesY - 20, animated: true });
    }
  };

  const handleDownloadMac = () => {
    Linking.openURL(MAC_DMG_URL).catch(() => Linking.openURL(RELEASE_TAG_URL));
  };

  const handleDownloadAndroid = () => {
    Linking.openURL(ANDROID_APK_URL).catch(() => Linking.openURL(RELEASE_TAG_URL));
  };

  const handleDownloadRelease = () => {
    Linking.openURL(RELEASE_TAG_URL).catch(() => Linking.openURL(`${GITHUB_REPO}/releases`));
  };

  const handleGithubRepo = () => {
    Linking.openURL(GITHUB_REPO);
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const handlePrimaryAuthAction = () => {
    if (isLoggedIn) {
      onDashboard();
    } else {
      onLogin();
    }
  };

  return (
    <ScrollView
      ref={pageScrollRef}
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, isMobile && styles.contentContainerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── NAVIGATION BAR ────────────────────────────────────── */}
      <View style={[styles.navbar, isMobile && styles.navbarMobile, { borderColor: theme.borderSubtle }, dragRegion]}>
        <View style={[styles.brandGroup, noDragRegion]}>
          <View
            style={[
              styles.logoBadge,
              isMobile && styles.logoBadgeMobile,
              { borderColor: isDark ? '#30363D' : '#D0D7DE', backgroundColor: theme.surface },
            ]}
          >
            <Image
              source={require('../../assets/icon.png')}
              style={[styles.logoImage, isMobile && styles.logoImageMobile]}
              resizeMode="contain"
            />
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={[styles.brandText, isMobile && styles.brandTextMobile, { color: theme.text }]}>TRACKHEAT</Text>
              {!isMobile && (
                <TouchableOpacity
                  style={[
                    styles.statusTag,
                    {
                      backgroundColor: isDark ? 'rgba(57, 211, 83, 0.15)' : 'rgba(26, 127, 55, 0.12)',
                      borderColor: isDark ? 'rgba(57, 211, 83, 0.4)' : 'rgba(26, 127, 55, 0.3)',
                    },
                  ]}
                  onPress={handleScrollToReleases}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                  <Text style={[styles.statusText, { color: theme.success }]}>v1.2.2 · RELEASES</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.navActions, isMobile && styles.navActionsMobile]}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              isMobile && styles.iconButtonMobile,
              { borderColor: theme.borderSubtle, backgroundColor: theme.surface },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Theme"
          >
            {isDark ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#656D76" />}
          </TouchableOpacity>

          {!isMobile && (
            <TouchableOpacity
              style={[styles.navGithubBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
              onPress={handleScrollToReleases}
              activeOpacity={0.7}
            >
              <History size={13} color={theme.textSecondary} />
              <Text style={[styles.navGithubText, { color: theme.textSecondary }]}>Releases</Text>
            </TouchableOpacity>
          )}

          {!isMobile && (
            <TouchableOpacity
              style={[styles.navGithubBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
              onPress={handleGithubRepo}
              activeOpacity={0.7}
            >
              <Github size={14} color={theme.textSecondary} />
              <Text style={[styles.navGithubText, { color: theme.textSecondary }]}>GitHub</Text>
            </TouchableOpacity>
          )}

          {isLoggedIn ? (
            <TouchableOpacity
              style={[
                styles.navSignInBtn,
                isMobile && styles.navSignInBtnMobile,
                {
                  borderColor: theme.success,
                  backgroundColor: isDark ? 'rgba(57, 211, 83, 0.12)' : 'rgba(26, 127, 55, 0.1)',
                },
              ]}
              onPress={onDashboard}
              activeOpacity={0.8}
            >
              <Text style={[styles.navSignInText, isMobile && styles.navSignInTextMobile, { color: isDark ? '#39D353' : '#1A7F37' }]}>
                DASHBOARD
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.navSignInBtn,
                isMobile && styles.navSignInBtnMobile,
                {
                  borderColor: isDark ? '#39D353' : '#1A7F37',
                  backgroundColor: isDark ? '#39D353' : '#1A7F37',
                },
              ]}
              onPress={onLogin}
              activeOpacity={0.8}
            >
              <Text style={[styles.navSignInText, isMobile && styles.navSignInTextMobile, { color: '#FFFFFF' }]}>
                SIGN IN
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── HERO SECTION ──────────────────────────────────────── */}
      <View style={[styles.heroSection, isMobile && styles.heroSectionMobile]}>
        {/* Editorial Pill */}
        <View
          style={[
            styles.heroPill,
            isMobile && styles.heroPillMobile,
            {
              borderColor: isDark ? 'rgba(57, 211, 83, 0.35)' : 'rgba(26, 127, 55, 0.3)',
              backgroundColor: isDark ? 'rgba(14, 68, 41, 0.2)' : 'rgba(26, 127, 55, 0.08)',
            },
          ]}
        >
          <Flame size={12} color={isDark ? '#39D353' : '#1A7F37'} strokeWidth={2.5} />
          <Text style={[styles.heroPillText, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            BINARY HABIT MATRIX
          </Text>
        </View>

        {/* Dual-Tone Headline */}
        <View style={styles.headlineWrapper}>
          <Text style={[styles.heroTitleMain, isMobile && styles.heroTitleMainMobile, { color: theme.text }]}>
            DON'T BREAK THE CHAIN.
          </Text>
          <Text style={[styles.heroTitleAccent, isMobile && styles.heroTitleAccentMobile, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            COMPOUND EVERY DAY.
          </Text>
        </View>

        {/* Subtitle with Clean Flow */}
        <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile, { color: theme.textSecondary }]}>
          {isMobile
            ? 'No continuous numbers. No target anxiety. Log a pure yes or no and let daily discipline compound into green contribution heatmaps.'
            : 'Stop drowning in continuous numbers, target meters, and bookkeeping anxiety. TrackHeat strips routine tracking down to an elegant binary check-in. Log yes or no and let daily consistency compound into green contribution matrices.'}
        </Text>

        {/* Hero Actions (Strict Auth Protection) */}
        <View style={[styles.heroButtonsRow, isMobile && styles.heroButtonsRowMobile]}>
          <TouchableOpacity
            style={[
              styles.primaryActionBtn,
              isMobile && styles.primaryActionBtnMobile,
              { backgroundColor: isDark ? '#39D353' : '#1A7F37' },
            ]}
            onPress={handlePrimaryAuthAction}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>
              {isLoggedIn ? 'OPEN YOUR DASHBOARD' : 'START TRACKING FREE'}
            </Text>
            <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>

          {!isLoggedIn && (
            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                isMobile && styles.secondaryActionBtnMobile,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
              onPress={onLogin}
              activeOpacity={0.85}
            >
              <Lock size={14} color={theme.textSecondary} />
              <Text style={[styles.secondaryActionText, { color: theme.text }]}>SIGN IN TO ACCOUNT</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Micro Tech Guarantee */}
        <View style={[styles.guaranteeRow, isMobile && styles.guaranteeRowMobile]}>
          <View style={styles.guaranteeItem}>
            <Check size={12} color={theme.success} strokeWidth={3} />
            <Text style={[styles.guaranteeText, { color: theme.textMuted }]}>Local-First Offline</Text>
          </View>
          <View style={styles.guaranteeDot} />
          <View style={styles.guaranteeItem}>
            <Check size={12} color={theme.success} strokeWidth={3} />
            <Text style={[styles.guaranteeText, { color: theme.textMuted }]}>Zero Ads & Telemetry</Text>
          </View>
          <View style={styles.guaranteeDot} />
          <View style={styles.guaranteeItem}>
            <Check size={12} color={theme.success} strokeWidth={3} />
            <Text style={[styles.guaranteeText, { color: theme.textMuted }]}>100% Open Source</Text>
          </View>
        </View>
      </View>

      {/* ─── LIVE 52-WEEK MATRIX SHOWCASE ──────────────────────── */}
      <View style={[styles.interactiveCard, isMobile && styles.interactiveCardMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Card Header */}
        <View style={[styles.interactiveHeader, isMobile && styles.interactiveHeaderMobile, { borderBottomColor: theme.borderSubtle }]}>
          <View style={styles.interactiveHeaderLeft}>
            <View style={[styles.terminalIndicator, { backgroundColor: activePreset.accentColor }]} />
            <View>
              <Text style={[styles.interactiveTitle, isMobile && { fontSize: 13 }, { color: theme.text }]}>
                {isMobile ? 'CORE DISCIPLINE' : activePreset.name.toUpperCase()}
              </Text>
              <Text style={[styles.interactiveSub, { color: theme.textMuted }]}>
                Palette: <Text style={{ color: activePreset.accentColor, fontWeight: '600' }}>{activePreset.colorName}</Text>
              </Text>
            </View>
          </View>

          {/* Clean Status Badge */}
          <View
            style={[
              styles.showcaseBadge,
              isMobile && styles.showcaseBadgeMobile,
              {
                backgroundColor: isDark ? 'rgba(57, 211, 83, 0.1)' : 'rgba(26, 127, 55, 0.08)',
                borderColor: isDark ? 'rgba(57, 211, 83, 0.28)' : 'rgba(26, 127, 55, 0.22)',
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: activePreset.accentColor }]} />
            <Text
              style={[
                styles.showcaseBadgeText,
                isMobile && { fontSize: 9 },
                { color: isDark ? '#39D353' : '#1A7F37' },
              ]}
            >
              {isMobile ? '48D STREAK' : '52-WEEK ANNUAL VIEW'}
            </Text>
          </View>
        </View>

        {/* Matrix Grid Visualization */}
        <View style={[styles.matrixViewWrapper, isMobile && styles.matrixViewWrapperMobile]}>
          {isMobile ? (
            <View style={styles.matrixContainerInnerMobile}>
              {/* Month Header Labels across the 52 weeks (Clean non-overlapping bi-monthly markers) */}
              <View style={styles.monthHeaderRowMobile}>
                <View style={{ width: mobileDayLabelWidth }} />
                <View style={[styles.monthLabelsContainerMobile, { width: 52 * mobileStep }]}>
                  {MOBILE_MONTH_HEADERS.map((m) => (
                    <Text
                      key={m.label}
                      style={[
                        styles.monthHeaderTextMobile,
                        {
                          left: m.week * mobileStep,
                          color: theme.textMuted,
                        },
                      ]}
                    >
                      {m.label}
                    </Text>
                  ))}
                </View>
              </View>

              {/* Grid Body: Day labels + 52-week micro columns */}
              <View style={styles.matrixBodyRowMobile}>
                {/* Day Labels column */}
                <View style={[styles.matrixDayLabelsMobile, { width: mobileDayLabelWidth }]}>
                  <Text style={[styles.dayLabelMobile, { color: theme.textMuted }]}>M</Text>
                  <Text style={[styles.dayLabelMobile, { color: theme.textMuted }]}>W</Text>
                  <Text style={[styles.dayLabelMobile, { color: theme.textMuted }]}>F</Text>
                  <Text style={[styles.dayLabelMobile, { color: theme.textMuted }]}>S</Text>
                </View>

                {/* 52 Columns fitted to card */}
                <View style={styles.columnsWrapperMobile}>
                  {baseMatrix.map((week, weekIdx) => (
                    <View
                      key={`week-${weekIdx}`}
                      style={[styles.matrixColumnMobile, { width: mobileCellSize, marginRight: mobileCellGap }]}
                    >
                      {week.map((baseLevel, dayIdx) => {
                        const cellKey = `w${weekIdx}-d${dayIdx}`;
                        const currentLevel =
                          clickedCells[cellKey] !== undefined ? clickedCells[cellKey] : baseLevel;
                        const cellColor =
                          activePreset.levelColors[currentLevel] || activePreset.levelColors[0];

                        return (
                          <TouchableOpacity
                            key={cellKey}
                            activeOpacity={0.6}
                            onPress={() => toggleDemoCell(cellKey, currentLevel)}
                            style={[
                              styles.matrixCellMobile,
                              {
                                width: mobileCellSize,
                                height: mobileCellSize,
                                marginBottom: mobileCellGap,
                                backgroundColor: !isDark && currentLevel === 0 ? '#EAECEF' : cellColor,
                                borderColor: isDark ? '#21262D' : '#D0D7DE',
                              },
                            ]}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <ScrollView
              ref={matrixScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fullWidthMatrixScroll}
            >
              <View style={styles.matrixContainerInner}>
                {/* Month Header Labels across the 52 weeks */}
                <View style={styles.monthHeaderRow}>
                  <View style={{ width: 40 }} />
                  <View style={styles.monthLabelsContainer}>
                    {MONTH_HEADERS.map((m) => (
                      <Text
                        key={m.label}
                        style={[
                          styles.monthHeaderText,
                          {
                            left: m.week * 19,
                            color: theme.textMuted,
                          },
                        ]}
                      >
                        {m.label}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* Grid Body: Day labels + 52-week columns */}
                <View style={styles.matrixBodyRow}>
                  {/* Day Labels column */}
                  <View style={styles.matrixDayLabels}>
                    <Text style={[styles.dayLabel, { color: theme.textMuted }]}>Mon</Text>
                    <Text style={[styles.dayLabel, { color: theme.textMuted }]}>Wed</Text>
                    <Text style={[styles.dayLabel, { color: theme.textMuted }]}>Fri</Text>
                    <Text style={[styles.dayLabel, { color: theme.textMuted }]}>Sun</Text>
                  </View>

                  {/* 52 Columns */}
                  <View style={styles.columnsWrapper}>
                    {baseMatrix.map((week, weekIdx) => (
                      <View key={`week-${weekIdx}`} style={styles.matrixColumn}>
                        {week.map((baseLevel, dayIdx) => {
                          const cellKey = `w${weekIdx}-d${dayIdx}`;
                          const currentLevel =
                            clickedCells[cellKey] !== undefined ? clickedCells[cellKey] : baseLevel;
                          const cellColor =
                            activePreset.levelColors[currentLevel] || activePreset.levelColors[0];

                          return (
                            <TouchableOpacity
                              key={cellKey}
                              activeOpacity={0.6}
                              onPress={() => toggleDemoCell(cellKey, currentLevel)}
                              style={[
                                styles.matrixCell,
                                {
                                  backgroundColor: !isDark && currentLevel === 0 ? '#EAECEF' : cellColor,
                                  borderColor: isDark ? '#21262D' : '#D0D7DE',
                                },
                              ]}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Matrix Footnote / Legend */}
          <View style={[styles.matrixFooterRow, isMobile && styles.matrixFooterRowMobile, { borderTopColor: theme.borderSubtle }]}>
            <View style={styles.interactiveHintRow}>
              <Sparkles size={12} color={activePreset.accentColor} />
              <Text style={[styles.interactiveHint, isMobile && { fontSize: 10 }, { color: theme.textSecondary }]}>
                {isMobile
                  ? 'Tap any cell to test streak intensity.'
                  : 'Interactive Demo: 52-week annual matrix. Tap any cell to test intensity.'}
              </Text>
            </View>

            <View style={styles.legendGroup}>
              <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Blank</Text>
              <View style={styles.swatchesRow}>
                {activePreset.levelColors.map((color, i) => (
                  <View
                    key={`swatch-${i}`}
                    style={[
                      styles.legendSwatch,
                      {
                        backgroundColor: !isDark && i === 0 ? '#EAECEF' : color,
                        borderColor: isDark ? '#30363D' : '#D0D7DE',
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Max</Text>
            </View>
          </View>
        </View>

        {/* Live Matrix Metrics Strip */}
        <View style={[styles.metricsStrip, isMobile && styles.metricsStripMobile, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
          <View style={styles.metricBlock}>
            <Text style={[styles.metricLabel, isMobile && { fontSize: 8 }, { color: theme.textMuted }]}>STREAK</Text>
            <View style={styles.metricValueRow}>
              <Flame size={14} color={activePreset.accentColor} strokeWidth={2.5} />
              <Text style={[styles.metricValue, isMobile && { fontSize: 14 }, { color: activePreset.accentColor }]}>
                {activePreset.streak} <Text style={{ fontSize: 11, color: theme.textSecondary }}>DAYS</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

          <View style={styles.metricBlock}>
            <Text style={[styles.metricLabel, isMobile && { fontSize: 8 }, { color: theme.textMuted }]}>CONSISTENCY</Text>
            <Text style={[styles.metricValue, isMobile && { fontSize: 14 }, { color: theme.text }]}>
              {activePreset.completionRate}
            </Text>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

          <View style={styles.metricBlock}>
            <Text style={[styles.metricLabel, isMobile && { fontSize: 8 }, { color: theme.textMuted }]}>TOTAL SESSIONS</Text>
            <Text style={[styles.metricValue, isMobile && { fontSize: 14 }, { color: theme.text }]}>
              {activePreset.totalDays} <Text style={{ fontSize: 11, color: theme.textSecondary }}>DAYS</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* ─── PHILOSOPHY SECTION (BRIEF & PUNCHY) ────────────────── */}
      <View style={[styles.sectionWrapper, isMobile && styles.sectionWrapperMobile]}>
        <View style={styles.sectionHeaderCol}>
          <Text style={[styles.sectionOverline, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            WHY TRACKHEAT
          </Text>
          <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile, { color: theme.text }]}>
            Architecture of Pure Discipline
          </Text>
        </View>

        {isMobile ? (
          <View style={[styles.mobilePillarsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Pillar 01 */}
            <View style={[styles.mobilePillarItem, { borderBottomColor: theme.borderSubtle }]}>
              <View style={styles.mobilePillarTop}>
                <View
                  style={[
                    styles.mobilePillarBadge,
                    { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' },
                  ]}
                >
                  <Text style={[styles.mobilePillarBadgeText, { color: '#F59E0B' }]}>01 · ZERO FRICTION</Text>
                </View>
              </View>
              <Text style={[styles.mobilePillarTitle, { color: theme.text }]}>Binary Simplicity</Text>
              <Text style={[styles.mobilePillarBody, { color: theme.textSecondary }]}>
                Did you execute today? Yes or no. No counting calories, timer logging, or metric fatigue. One tap and complete.
              </Text>
            </View>

            {/* Pillar 02 */}
            <View style={[styles.mobilePillarItem, { borderBottomColor: theme.borderSubtle }]}>
              <View style={styles.mobilePillarTop}>
                <View
                  style={[
                    styles.mobilePillarBadge,
                    { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' },
                  ]}
                >
                  <Text style={[styles.mobilePillarBadgeText, { color: '#38BDF8' }]}>02 · ISOLATION</Text>
                </View>
              </View>
              <Text style={[styles.mobilePillarTitle, { color: theme.text }]}>Dedicated Matrices</Text>
              <Text style={[styles.mobilePillarBody, { color: theme.textSecondary }]}>
                Never blend discordant habits into a generic checklist. Running, deep coding, and reading each get their own autonomous heatmap.
              </Text>
            </View>

            {/* Pillar 03 */}
            <View style={[styles.mobilePillarItem, { borderBottomWidth: 0 }]}>
              <View style={styles.mobilePillarTop}>
                <View
                  style={[
                    styles.mobilePillarBadge,
                    { backgroundColor: 'rgba(57, 211, 83, 0.12)', borderColor: 'rgba(57, 211, 83, 0.3)' },
                  ]}
                >
                  <Text style={[styles.mobilePillarBadgeText, { color: isDark ? '#39D353' : '#1A7F37' }]}>03 · PSYCHOLOGY</Text>
                </View>
              </View>
              <Text style={[styles.mobilePillarTitle, { color: theme.text }]}>GitHub Momentum</Text>
              <Text style={[styles.mobilePillarBody, { color: theme.textSecondary }]}>
                Inspired by GitHub contribution graphs. Watch your daily discipline compound into vibrant green matrix tiles.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.pillarsGrid}>
            {/* Pillar 01 */}
            <View style={[styles.pillarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.pillarHeaderRow}>
                <View
                  style={[
                    styles.pillarBadge,
                    { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)' },
                  ]}
                >
                  <Text style={[styles.pillarBadgeText, { color: '#F59E0B' }]}>01 · ZERO FRICTION</Text>
                </View>
              </View>

              <Text style={[styles.pillarTitle, { color: theme.text }]}>
                Binary Simplicity
              </Text>

              <Text style={[styles.pillarBody, { color: theme.textSecondary }]}>
                Did you execute today? Yes or no. No counting calories, timer logging, or metric fatigue. One tap and complete.
              </Text>

              <View style={[styles.comparisonBox, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
                <View style={styles.comparisonRow}>
                  <View style={[styles.compStatusTag, { backgroundColor: 'rgba(248, 81, 73, 0.15)' }]}>
                    <X size={12} color="#F85149" strokeWidth={3} />
                  </View>
                  <Text style={[styles.compTextStriked, { color: theme.textMuted }]}>
                    Logged 42/60 mins (fail)
                  </Text>
                </View>
                <View style={styles.comparisonRow}>
                  <View style={[styles.compStatusTag, { backgroundColor: 'rgba(57, 211, 83, 0.15)' }]}>
                    <Check size={12} color={theme.success} strokeWidth={3} />
                  </View>
                  <Text style={[styles.compTextSuccess, { color: theme.text }]}>
                    Executed workout (complete)
                  </Text>
                </View>
              </View>
            </View>

            {/* Pillar 02 */}
            <View style={[styles.pillarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.pillarHeaderRow}>
                <View
                  style={[
                    styles.pillarBadge,
                    { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)' },
                  ]}
                >
                  <Text style={[styles.pillarBadgeText, { color: '#38BDF8' }]}>02 · ISOLATION</Text>
                </View>
              </View>

              <Text style={[styles.pillarTitle, { color: theme.text }]}>
                Dedicated Matrices
              </Text>

              <Text style={[styles.pillarBody, { color: theme.textSecondary }]}>
                Never blend discordant habits into a generic checklist. Running, deep coding, and reading each get their own autonomous heatmap.
              </Text>

              <View style={[styles.paletteShowcase, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
                <View style={styles.palettePill}>
                  <View style={[styles.dotSmall, { backgroundColor: '#39D353' }]} />
                  <Text style={[styles.palettePillText, { color: theme.textSecondary }]}>Emerald</Text>
                </View>
                <View style={styles.palettePill}>
                  <View style={[styles.dotSmall, { backgroundColor: '#F59E0B' }]} />
                  <Text style={[styles.palettePillText, { color: theme.textSecondary }]}>Amber</Text>
                </View>
                <View style={styles.palettePill}>
                  <View style={[styles.dotSmall, { backgroundColor: '#38BDF8' }]} />
                  <Text style={[styles.palettePillText, { color: theme.textSecondary }]}>Cyan</Text>
                </View>
              </View>
            </View>

            {/* Pillar 03 */}
            <View style={[styles.pillarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.pillarHeaderRow}>
                <View
                  style={[
                    styles.pillarBadge,
                    { backgroundColor: 'rgba(57, 211, 83, 0.1)', borderColor: 'rgba(57, 211, 83, 0.3)' },
                  ]}
                >
                  <Text style={[styles.pillarBadgeText, { color: isDark ? '#39D353' : '#1A7F37' }]}>03 · PSYCHOLOGY</Text>
                </View>
              </View>

              <Text style={[styles.pillarTitle, { color: theme.text }]}>
                GitHub Momentum
              </Text>

              <Text style={[styles.pillarBody, { color: theme.textSecondary }]}>
                Inspired by GitHub contribution graphs. Watch your daily discipline compound into vibrant green matrix tiles.
              </Text>

              <View style={[styles.intensityBox, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
                <Text style={[styles.intensityBoxLabel, { color: theme.textMuted }]}>DYNAMIC STREAK INTENSITY</Text>
                <View style={styles.intensityBar}>
                  <View style={[styles.intensitySegment, { backgroundColor: '#0E4429' }]}>
                    <Text style={styles.segText}>1d</Text>
                  </View>
                  <View style={[styles.intensitySegment, { backgroundColor: '#006D32' }]}>
                    <Text style={styles.segText}>3d</Text>
                  </View>
                  <View style={[styles.intensitySegment, { backgroundColor: '#26A641' }]}>
                    <Text style={styles.segText}>7d</Text>
                  </View>
                  <View style={[styles.intensitySegment, { backgroundColor: '#39D353' }]}>
                    <Text style={[styles.segText, { color: '#090A0C', fontWeight: '800' }]}>14d+</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ─── NATIVE APPLICATIONS & PLATFORMS ─────────────────────── */}
      <View style={[styles.sectionWrapper, isMobile && styles.sectionWrapperMobile]}>
        <View style={styles.sectionHeaderCol}>
          <Text style={[styles.sectionOverline, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            MULTI-PLATFORM
          </Text>
          <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile, { color: theme.text }]}>
            Engineered for Desktop, Web, and Mobile
          </Text>
        </View>

        {isMobile ? (
          <View style={[styles.mobilePlatformsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* macOS Universal */}
            <TouchableOpacity
              style={[styles.mobilePlatformRow, { borderBottomColor: theme.borderSubtle }]}
              onPress={handleDownloadMac}
              activeOpacity={0.7}
            >
              <View style={[styles.mobilePlatformIcon, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}>
                <Monitor size={18} color={theme.text} />
              </View>
              <View style={styles.mobilePlatformContent}>
                <View style={styles.mobilePlatformTitleRow}>
                  <Text style={[styles.mobilePlatformTitle, { color: theme.text }]}>macOS Universal</Text>
                  <View style={[styles.mobilePlatformBadge, { backgroundColor: 'rgba(57, 211, 83, 0.1)', borderColor: 'rgba(57, 211, 83, 0.3)' }]}>
                    <Text style={[styles.mobilePlatformBadgeText, { color: isDark ? '#39D353' : '#1A7F37' }]}>DMG · v1.2.2</Text>
                  </View>
                </View>
                <Text style={[styles.mobilePlatformSubtitle, { color: theme.textSecondary }]}>
                  Native desktop client with offline-first disk storage.
                </Text>
              </View>
              <Download size={15} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Android Mobile */}
            <TouchableOpacity
              style={[styles.mobilePlatformRow, { borderBottomColor: theme.borderSubtle }]}
              onPress={handleDownloadAndroid}
              activeOpacity={0.7}
            >
              <View style={[styles.mobilePlatformIcon, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}>
                <Smartphone size={18} color={theme.text} />
              </View>
              <View style={styles.mobilePlatformContent}>
                <View style={styles.mobilePlatformTitleRow}>
                  <Text style={[styles.mobilePlatformTitle, { color: theme.text }]}>Android Mobile</Text>
                  <View style={[styles.mobilePlatformBadge, { backgroundColor: 'rgba(57, 211, 83, 0.1)', borderColor: 'rgba(57, 211, 83, 0.3)' }]}>
                    <Text style={[styles.mobilePlatformBadgeText, { color: isDark ? '#39D353' : '#1A7F37' }]}>APK · v1.2.2</Text>
                  </View>
                </View>
                <Text style={[styles.mobilePlatformSubtitle, { color: theme.textSecondary }]}>
                  Pocket tracking with interactive Home Screen widgets.
                </Text>
              </View>
              <Download size={15} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Browser Web App */}
            <TouchableOpacity
              style={[styles.mobilePlatformRow, { borderBottomColor: theme.borderSubtle }]}
              onPress={handlePrimaryAuthAction}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.mobilePlatformIcon,
                  {
                    borderColor: isDark ? '#39D353' : '#1A7F37',
                    backgroundColor: isDark ? 'rgba(57, 211, 83, 0.12)' : 'rgba(26, 127, 55, 0.08)',
                  },
                ]}
              >
                <Globe size={18} color={isDark ? '#39D353' : '#1A7F37'} />
              </View>
              <View style={styles.mobilePlatformContent}>
                <View style={styles.mobilePlatformTitleRow}>
                  <Text style={[styles.mobilePlatformTitle, { color: theme.text }]}>Browser Web App</Text>
                  <View style={[styles.mobilePlatformBadge, { backgroundColor: 'rgba(57, 211, 83, 0.1)', borderColor: 'rgba(57, 211, 83, 0.3)' }]}>
                    <Text style={[styles.mobilePlatformBadgeText, { color: isDark ? '#39D353' : '#1A7F37' }]}>LIVE</Text>
                  </View>
                </View>
                <Text style={[styles.mobilePlatformSubtitle, { color: theme.textSecondary }]}>
                  Instant access with Supabase cloud backup.
                </Text>
              </View>
              <ArrowRight size={15} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Apple iOS */}
            <View style={[styles.mobilePlatformRow, { borderBottomWidth: 0, opacity: 0.65 }]}>
              <View style={[styles.mobilePlatformIcon, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}>
                <Smartphone size={18} color={theme.textSecondary} />
              </View>
              <View style={styles.mobilePlatformContent}>
                <View style={styles.mobilePlatformTitleRow}>
                  <Text style={[styles.mobilePlatformTitle, { color: theme.text }]}>Apple iOS</Text>
                  <View style={[styles.mobilePlatformBadge, { backgroundColor: 'rgba(139, 148, 158, 0.1)', borderColor: 'rgba(139, 148, 158, 0.3)' }]}>
                    <Text style={[styles.mobilePlatformBadgeText, { color: theme.textMuted }]}>COMING SOON</Text>
                  </View>
                </View>
                <Text style={[styles.mobilePlatformSubtitle, { color: theme.textSecondary }]}>
                  Native iOS client with WidgetKit currently in development.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.platformsGrid}>
            {/* macOS Desktop */}
            <View style={[styles.platformCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.platformTop}>
                <View style={[styles.platformIconFrame, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}>
                  <Monitor size={20} color={theme.text} />
                </View>
                <View style={[styles.osTag, { backgroundColor: 'rgba(57, 211, 83, 0.1)', borderColor: 'rgba(57, 211, 83, 0.3)' }]}>
                  <Text style={[styles.osTagText, { color: isDark ? '#39D353' : '#1A7F37' }]}>DMG · v1.2.2</Text>
                </View>
              </View>

              <Text style={[styles.platformName, { color: theme.text }]}>macOS Universal</Text>
              <Text style={[styles.platformDesc, { color: theme.textSecondary }]}>
                Native desktop build with custom traffic-light styling, title bar dragging, and offline-first disk persistence.
              </Text>

              <TouchableOpacity
                style={[styles.platformDownloadBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}
                onPress={handleDownloadMac}
                activeOpacity={0.7}
              >
                <Download size={14} color={theme.text} />
                <Text style={[styles.platformDownloadText, { color: theme.text }]}>DOWNLOAD .DMG</Text>
              </TouchableOpacity>
            </View>

            {/* Android Mobile */}
            <View style={[styles.platformCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.platformTop}>
                <View style={[styles.platformIconFrame, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}>
                  <Smartphone size={20} color={theme.text} />
                </View>
                <View style={[styles.osTag, { backgroundColor: 'rgba(57, 211, 83, 0.1)', borderColor: 'rgba(57, 211, 83, 0.3)' }]}>
                  <Text style={[styles.osTagText, { color: isDark ? '#39D353' : '#1A7F37' }]}>APK · v1.2.2</Text>
                </View>
              </View>

              <Text style={[styles.platformName, { color: theme.text }]}>Android Mobile</Text>
              <Text style={[styles.platformDesc, { color: theme.textSecondary }]}>
                Native Android app with live interactive Home Screen widgets, real-time 1-tap logging, and theme customization.
              </Text>

              <TouchableOpacity
                style={[styles.platformDownloadBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}
                onPress={handleDownloadAndroid}
                activeOpacity={0.7}
              >
                <Download size={14} color={theme.text} />
                <Text style={[styles.platformDownloadText, { color: theme.text }]}>DOWNLOAD .APK</Text>
              </TouchableOpacity>
            </View>

            {/* Web App */}
            <View style={[styles.platformCard, { backgroundColor: theme.surface, borderColor: isDark ? '#39D353' : '#1A7F37' }]}>
              <View style={styles.platformTop}>
                <View
                  style={[
                    styles.platformIconFrame,
                    {
                      borderColor: isDark ? '#39D353' : '#1A7F37',
                      backgroundColor: isDark ? 'rgba(57, 211, 83, 0.1)' : 'rgba(26, 127, 55, 0.08)',
                    },
                  ]}
                >
                  <Globe size={20} color={isDark ? '#39D353' : '#1A7F37'} />
                </View>
                <View
                  style={[
                    styles.osTag,
                    {
                      backgroundColor: isDark ? 'rgba(57, 211, 83, 0.15)' : 'rgba(26, 127, 55, 0.12)',
                      borderColor: isDark ? 'rgba(57, 211, 83, 0.4)' : 'rgba(26, 127, 55, 0.3)',
                    },
                  ]}
                >
                  <Text style={[styles.osTagText, { color: isDark ? '#39D353' : '#1A7F37' }]}>LIVE</Text>
                </View>
              </View>

              <Text style={[styles.platformName, { color: theme.text }]}>Browser Web App</Text>
              <Text style={[styles.platformDesc, { color: theme.textSecondary }]}>
                Instant zero-install access with Supabase cloud backup across all your workstations.
              </Text>

              <TouchableOpacity
                style={[
                  styles.platformDownloadBtn,
                  {
                    backgroundColor: isDark ? '#39D353' : '#1A7F37',
                    borderColor: isDark ? '#39D353' : '#1A7F37',
                  },
                ]}
                onPress={handlePrimaryAuthAction}
                activeOpacity={0.8}
              >
                <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={[styles.platformDownloadText, { color: '#FFFFFF' }]}>
                  {isLoggedIn ? 'OPEN DASHBOARD' : 'SIGN IN TO WEB'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Apple iOS */}
            <View style={[styles.platformCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: 0.65 }]}>
              <View style={styles.platformTop}>
                <View style={[styles.platformIconFrame, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}>
                  <Smartphone size={20} color={theme.textSecondary} />
                </View>
                <View style={[styles.osTag, { backgroundColor: 'rgba(139, 148, 158, 0.1)', borderColor: 'rgba(139, 148, 158, 0.3)' }]}>
                  <Text style={[styles.osTagText, { color: theme.textMuted }]}>COMING SOON</Text>
                </View>
              </View>

              <Text style={[styles.platformName, { color: theme.text }]}>Apple iOS</Text>
              <Text style={[styles.platformDesc, { color: theme.textSecondary }]}>
                Native iOS client with WidgetKit extensions for lock screen and home screen tracking in active development.
              </Text>

              <View
                style={[styles.platformDownloadBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.platformDownloadText, { color: theme.textMuted }]}>IN DEVELOPMENT</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ─── RELEASE HISTORY & CHANGELOG ─────────────────────────── */}
      <View
        style={[styles.sectionWrapper, isMobile && styles.sectionWrapperMobile]}
        onLayout={(e) => setReleasesY(e.nativeEvent.layout.y)}
      >
        <View style={styles.sectionHeaderCol}>
          <Text style={[styles.sectionOverline, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            VERSION LOG
          </Text>
          <Text style={[styles.sectionTitle, isMobile && styles.sectionTitleMobile, { color: theme.text }]}>
            Release History & Changelog
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            TrackHeat evolves continuously with offline-first reliability, high-density matrix visualizations, and native OS integrations.
          </Text>
        </View>

        <View style={styles.releasesContainer}>
          {RELEASES_DATA.map((rel) => (
            <View
              key={rel.version}
              style={[
                styles.releaseCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: rel.isLatest
                    ? (isDark ? 'rgba(57, 211, 83, 0.4)' : 'rgba(26, 127, 55, 0.35)')
                    : theme.border,
                },
              ]}
            >
              <View style={[styles.releaseHeader, isMobile && styles.releaseHeaderMobile]}>
                <View style={styles.releaseVersionRow}>
                  <Text style={[styles.releaseVersion, { color: theme.text }]}>{rel.version}</Text>
                  <View
                    style={[
                      styles.releaseBadge,
                      {
                        backgroundColor: rel.isLatest
                          ? (isDark ? 'rgba(57, 211, 83, 0.15)' : 'rgba(26, 127, 55, 0.12)')
                          : theme.surfaceHighlight,
                        borderColor: rel.isLatest
                          ? (isDark ? 'rgba(57, 211, 83, 0.4)' : 'rgba(26, 127, 55, 0.3)')
                          : theme.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.releaseBadgeText,
                        {
                          color: rel.isLatest
                            ? (isDark ? '#39D353' : '#1A7F37')
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {rel.tag.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.releaseDate, { color: theme.textMuted }]}>{rel.date}</Text>
              </View>

              <Text style={[styles.releaseSummary, { color: theme.textSecondary }]}>
                {rel.summary}
              </Text>

              <View style={styles.highlightsContainer}>
                {rel.highlights.map((item, idx) => (
                  <View key={idx} style={styles.highlightRow}>
                    <View
                      style={[
                        styles.highlightBullet,
                        { backgroundColor: rel.isLatest ? (isDark ? '#39D353' : '#1A7F37') : theme.textMuted },
                      ]}
                    />
                    <Text style={[styles.highlightText, { color: theme.textSecondary }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.releaseActionsRow}>
                {rel.links.map((link, lIdx) => (
                  <TouchableOpacity
                    key={lIdx}
                    style={[
                      styles.releaseActionBtn,
                      link.primary
                        ? {
                            backgroundColor: isDark ? 'rgba(57, 211, 83, 0.12)' : 'rgba(26, 127, 55, 0.08)',
                            borderColor: isDark ? 'rgba(57, 211, 83, 0.35)' : 'rgba(26, 127, 55, 0.3)',
                          }
                        : {
                            backgroundColor: theme.surfaceHighlight,
                            borderColor: theme.borderSubtle,
                          },
                    ]}
                    onPress={() => Linking.openURL(link.url)}
                    activeOpacity={0.7}
                  >
                    {link.label.includes('Download') ? (
                      <Download
                        size={12}
                        color={link.primary ? (isDark ? '#39D353' : '#1A7F37') : theme.textSecondary}
                      />
                    ) : (
                      <ExternalLink
                        size={12}
                        color={link.primary ? (isDark ? '#39D353' : '#1A7F37') : theme.textSecondary}
                      />
                    )}
                    <Text
                      style={[
                        styles.releaseActionText,
                        {
                          color: link.primary
                            ? (isDark ? '#39D353' : '#1A7F37')
                            : theme.textSecondary,
                          fontWeight: link.primary ? '600' : '500',
                        },
                      ]}
                    >
                      {link.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ─── BOTTOM CALL TO ACTION ───────────────────────────────── */}
      <View style={[styles.bottomCtaCard, isMobile && styles.bottomCtaCardMobile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.bottomCtaContent}>
          <Text style={[styles.bottomCtaOverline, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            START COMPOUNDING TODAY
          </Text>
          <Text style={[styles.bottomCtaTitle, isMobile && styles.bottomCtaTitleMobile, { color: theme.text }]}>
            Build Your Chain In 10 Seconds.
          </Text>
          <Text style={[styles.bottomCtaSub, isMobile && styles.bottomCtaSubMobile, { color: theme.textSecondary }]}>
            Free and open-source habit tracking with zero paywalls or ads.
          </Text>

          <View style={[styles.bottomCtaButtons, isMobile && styles.bottomCtaButtonsMobile]}>
            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                isMobile && styles.primaryActionBtnMobile,
                { backgroundColor: isDark ? '#39D353' : '#1A7F37' },
              ]}
              onPress={handlePrimaryAuthAction}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryActionText, isMobile && { fontSize: 12 }]}>
                {isLoggedIn ? 'OPEN YOUR DASHBOARD' : 'CREATE ACCOUNT & START'}
              </Text>
              <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryActionBtn,
                isMobile && styles.secondaryActionBtnMobile,
                { borderColor: theme.border, backgroundColor: theme.surfaceHighlight },
              ]}
              onPress={handleGithubRepo}
              activeOpacity={0.85}
            >
              <Github size={14} color={theme.text} />
              <Text style={[styles.secondaryActionText, isMobile && { fontSize: 12 }, { color: theme.text }]}>STAR ON GITHUB</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <View style={[styles.footer, isMobile && styles.footerMobile, { borderTopColor: theme.borderSubtle }]}>
        <View style={[styles.footerLeft, isMobile && styles.footerLeftMobile]}>
          <View style={styles.footerBrandRow}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.footerLogo}
              resizeMode="contain"
            />
            <Text style={[styles.footerBrand, { color: theme.text }]}>TRACKHEAT</Text>
          </View>
          <Text style={[styles.footerCopy, isMobile && { textAlign: 'center', fontSize: 11, marginTop: 4 }, { color: theme.textMuted }]}>
            {isMobile ? '© 2026 TrackHeat · Open Source' : '© 2026 TrackHeat. Open Source. Built for high-discipline builders.'}
          </Text>
        </View>

        <View style={[styles.footerLinks, isMobile && styles.footerLinksMobile]}>
          <TouchableOpacity onPress={handleGithubRepo} style={styles.footerLinkItem}>
            <Text style={[styles.footerLinkText, isMobile && { fontSize: 11 }, { color: theme.textSecondary }]}>GitHub</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownloadRelease} style={styles.footerLinkItem}>
            <Text style={[styles.footerLinkText, isMobile && { fontSize: 11 }, { color: theme.textSecondary }]}>Releases</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogin} style={styles.footerLinkItem}>
            <Text style={[styles.footerLinkText, isMobile && { fontSize: 11 }, { color: theme.textSecondary }]}>
              {isLoggedIn ? 'Account' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: isMacDesktop ? 28 : 20,
    paddingBottom: 60,
    maxWidth: 1140,
    width: '100%',
    alignSelf: 'center',
  },
  contentContainerMobile: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: isMacDesktop ? 20 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 56,
  },
  navbarMobile: {
    paddingVertical: 12,
    marginBottom: 28,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoBadgeMobile: {
    width: 32,
    height: 32,
    borderRadius: 7,
  },
  logoImage: {
    width: 26,
    height: 26,
  },
  logoImageMobile: {
    width: 22,
    height: 22,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  brandTextMobile: {
    fontSize: 15,
    letterSpacing: 1,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  brandSub: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navActionsMobile: {
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonMobile: {
    width: 34,
    height: 34,
  },
  navGithubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 5,
    borderWidth: 1,
  },
  navGithubText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  navSignInBtn: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navSignInBtnMobile: {
    paddingHorizontal: 12,
    height: 34,
  },
  navSignInText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  navSignInTextMobile: {
    fontSize: 11,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 56,
  },
  heroSectionMobile: {
    marginBottom: 36,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  heroPillMobile: {
    marginBottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headlineWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitleMain: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: 56,
  },
  heroTitleMainMobile: {
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.4,
  },
  heroTitleAccent: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: 56,
  },
  heroTitleAccentMobile: {
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 720,
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heroSubtitleMobile: {
    fontSize: 13,
    lineHeight: 18.5,
    maxWidth: 330,
    marginBottom: 20,
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroButtonsRowMobile: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
    marginBottom: 22,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 26,
    height: 48,
    borderRadius: 6,
  },
  primaryActionBtnMobile: {
    width: '100%',
    height: 46,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
  },
  secondaryActionBtnMobile: {
    width: '100%',
    height: 46,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  guaranteeRowMobile: {
    gap: 8,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guaranteeText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  guaranteeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#6E7681',
  },

  // Interactive Matrix Showcase Card
  interactiveCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 72,
  },
  interactiveCardMobile: {
    borderRadius: 10,
    marginBottom: 44,
  },
  interactiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    gap: 12,
  },
  interactiveHeaderMobile: {
    padding: 14,
  },
  interactiveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  terminalIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  interactiveTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  interactiveSub: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginTop: 2,
  },
  showcaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
  },
  showcaseBadgeMobile: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  showcaseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  matrixViewWrapper: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  matrixViewWrapperMobile: {
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  fullWidthMatrixScroll: {
    paddingBottom: 8,
    minWidth: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixContainerInner: {
    alignSelf: 'center',
    width: 1024,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    height: 18,
    marginBottom: 6,
    position: 'relative',
    width: 1024,
  },
  monthLabelsContainer: {
    position: 'relative',
    height: 18,
    width: 984,
  },
  monthHeaderText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  matrixBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 1024,
  },
  matrixDayLabels: {
    width: 32,
    height: 129,
    justifyContent: 'space-between',
    paddingTop: 1,
    paddingBottom: 1,
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  columnsWrapper: {
    flexDirection: 'row',
    gap: 4,
    width: 984,
    marginLeft: 8,
  },
  matrixColumn: {
    flexDirection: 'column',
    gap: 4,
    width: 15,
  },
  matrixCell: {
    width: 15,
    height: 15,
    borderRadius: 3,
    borderWidth: 1,
  },
  matrixContainerInnerMobile: {
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
  },
  monthHeaderRowMobile: {
    flexDirection: 'row',
    height: 16,
    marginBottom: 4,
    width: '100%',
    position: 'relative',
  },
  monthLabelsContainerMobile: {
    position: 'relative',
    height: 16,
  },
  monthHeaderTextMobile: {
    position: 'absolute',
    fontSize: 8.5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  matrixBodyRowMobile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  matrixDayLabelsMobile: {
    height: 46,
    justifyContent: 'space-between',
    paddingTop: 1,
    paddingBottom: 1,
  },
  dayLabelMobile: {
    fontSize: 7.5,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  columnsWrapperMobile: {
    flexDirection: 'row',
    flex: 1,
  },
  matrixColumnMobile: {
    flexDirection: 'column',
  },
  matrixCellMobile: {
    borderRadius: 1.5,
    borderWidth: 0.5,
  },
  matrixFooterRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  matrixFooterRowMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    marginTop: 10,
  },
  interactiveHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interactiveHint: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  legendGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLabel: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  swatchesRow: {
    flexDirection: 'row',
    gap: 3,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 2,
    borderWidth: 1,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  metricsStripMobile: {
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  metricBlock: {
    alignItems: 'center',
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Philosophy Section
  sectionWrapper: {
    marginBottom: 72,
  },
  sectionWrapperMobile: {
    marginBottom: 44,
  },
  sectionHeaderCol: {
    marginBottom: 28,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sectionTitleMobile: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  // Mobile Streamlined Architecture Card
  mobilePillarsCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mobilePillarItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  mobilePillarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mobilePillarBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
  },
  mobilePillarBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  mobilePillarTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  mobilePillarBody: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  pillarsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  pillarsGridMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  pillarCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 22,
    justifyContent: 'space-between',
  },
  pillarCardMobile: {
    padding: 16,
    width: '100%',
  },
  pillarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillarBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: 1,
  },
  pillarBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  pillarTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  pillarBody: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  comparisonBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    gap: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compStatusTag: {
    width: 18,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compTextStriked: {
    fontSize: 11,
    textDecorationLine: 'line-through',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  compTextSuccess: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  paletteShowcase: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    gap: 8,
  },
  palettePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  palettePillText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  intensityBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
  },
  intensityBoxLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  intensityBar: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    height: 22,
  },
  intensitySegment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Mobile Streamlined Platforms Card
  mobilePlatformsCard: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mobilePlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  mobilePlatformIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mobilePlatformContent: {
    flex: 1,
  },
  mobilePlatformTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  mobilePlatformTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  mobilePlatformBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    borderWidth: 1,
  },
  mobilePlatformBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  mobilePlatformSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Platforms Grid
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  platformsGridMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  platformCard: {
    flex: 1,
    minWidth: 230,
    borderWidth: 1,
    borderRadius: 8,
    padding: 22,
    justifyContent: 'space-between',
  },
  platformCardMobile: {
    padding: 16,
    width: '100%',
  },
  platformTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  platformIconFrame: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  osTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: 1,
  },
  osTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  platformName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  platformDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  platformDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
  },
  platformDownloadText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Bottom CTA
  bottomCtaCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 36,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 60,
  },
  bottomCtaCardMobile: {
    padding: 20,
    marginBottom: 40,
  },
  bottomCtaContent: {
    alignItems: 'center',
    maxWidth: 600,
  },
  bottomCtaOverline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomCtaTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomCtaTitleMobile: {
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  bottomCtaSub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomCtaSubMobile: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 16,
  },
  bottomCtaButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  bottomCtaButtonsMobile: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    gap: 16,
  },
  footerMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    paddingTop: 20,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  footerLeftMobile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLogo: {
    width: 20,
    height: 20,
  },
  footerBrand: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footerCopy: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerLinksMobile: {
    justifyContent: 'center',
    gap: 14,
  },
  footerLinkItem: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Release History & Changelog
  releasesContainer: {
    width: '100%',
    gap: 16,
  },
  releaseCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
  },
  releaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  releaseHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  releaseVersionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  releaseVersion: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  releaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  releaseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  releaseDate: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  releaseSummary: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  highlightsContainer: {
    gap: 6,
    marginBottom: 14,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  highlightBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 7,
  },
  highlightText: {
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  releaseActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  releaseActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  releaseActionText: {
    fontSize: 11,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
