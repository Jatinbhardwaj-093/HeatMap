import React from 'react';
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
  ArrowLeft,
  ArrowRight,
  Github,
  Monitor,
  Smartphone,
  Globe,
  Download,
  ExternalLink,
  Sun,
  Moon,
  Tag,
  CheckCircle2,
} from 'lucide-react-native';
import { useAppTheme, useIsDark, useThemeMode } from '../theme/theme';
import { isMacDesktop, dragRegion, noDragRegion } from '../utils/platform';

interface ReleasesScreenProps {
  onBack: () => void;
  onOpenDashboard?: () => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
}

interface ReleaseData {
  version: string;
  date: string;
  tag: string;
  isLatest: boolean;
  summary: string;
  highlights: string[];
  links: {
    label: string;
    url: string;
    primary?: boolean;
  }[];
}

const GITHUB_REPO = 'https://github.com/Jatinbhardwaj-093/HeatMap';

const ALL_RELEASES: ReleaseData[] = [
  {
    version: 'v1.2.2',
    date: 'October 2026',
    tag: 'Latest Stable',
    isLatest: true,
    summary: 'High-reliability engine update resolving background cloud sync, vector widget centering, and calibrated window safe areas.',
    highlights: [
      'Account Profile Authority: Local-first persistence for display names and handles with active Supabase session refresh.',
      'Automated Background Sync: Removed manual synchronization buttons; state reconciles completely in the background without user intervention.',
      'Vector Centered Widgets: Android RemoteViews use geometric SVG paths for check and plus icons, ensuring mathematical centering across all display densities.',
      'Widget Setup Safe Area: Calibrated status bar and camera punch-hole clearances alongside an authentic 20-week preview matrix.',
      'macOS Navbar Alignment: Window title bar padding under native traffic lights is applied strictly to the macOS desktop app, keeping the web dashboard navbar compact.',
    ],
    links: [
      { label: 'Download .DMG (macOS)', url: `${GITHUB_REPO}/releases/download/v1.2.2/TrackHeat-1.2.2-arm64.dmg`, primary: true },
      { label: 'Download .APK (Android)', url: `${GITHUB_REPO}/releases/download/v1.2.2/TrackHeat-1.2.2.apk`, primary: true },
      { label: 'GitHub Release', url: `${GITHUB_REPO}/releases/tag/v1.2.2` },
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

export const ReleasesScreen: React.FC<ReleasesScreenProps> = ({
  onBack,
  onOpenDashboard,
  onLogin,
  isLoggedIn = false,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const theme = useAppTheme();
  const isDark = useIsDark();
  const { setThemeMode } = useThemeMode();

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const handleGithubRepo = () => {
    Linking.openURL(GITHUB_REPO);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, isMobile && styles.contentContainerMobile]}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── NAVIGATION BAR ────────────────────────────────────── */}
      <View style={[styles.navbar, isMobile && styles.navbarMobile, { borderColor: theme.borderSubtle }, dragRegion]}>
        <View style={[styles.brandGroup, noDragRegion]}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to application"
          >
            <ArrowLeft size={15} color={theme.text} />
            <Text style={[styles.backButtonText, { color: theme.text }]}>Back</Text>
          </TouchableOpacity>

          <View style={styles.brandTitleRow}>
            <View
              style={[
                styles.logoBadge,
                { borderColor: isDark ? '#30363D' : '#D0D7DE', backgroundColor: theme.surface },
              ]}
            >
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandText, { color: theme.text }]}>TRACKHEAT</Text>
            <View
              style={[
                styles.releasesTag,
                {
                  backgroundColor: isDark ? 'rgba(57, 211, 83, 0.15)' : 'rgba(26, 127, 55, 0.12)',
                  borderColor: isDark ? 'rgba(57, 211, 83, 0.4)' : 'rgba(26, 127, 55, 0.3)',
                },
              ]}
            >
              <Text style={[styles.releasesTagText, { color: theme.success }]}>RELEASES</Text>
            </View>
          </View>
        </View>

        <View style={[styles.navActions, noDragRegion]}>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Theme"
          >
            {isDark ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#656D76" />}
          </TouchableOpacity>

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

          {isLoggedIn && onOpenDashboard ? (
            <TouchableOpacity
              style={[
                styles.navActionBtn,
                {
                  borderColor: theme.success,
                  backgroundColor: isDark ? 'rgba(57, 211, 83, 0.12)' : 'rgba(26, 127, 55, 0.1)',
                },
              ]}
              onPress={onOpenDashboard}
              activeOpacity={0.8}
            >
              <Text style={[styles.navActionText, { color: isDark ? '#39D353' : '#1A7F37' }]}>
                Dashboard
              </Text>
            </TouchableOpacity>
          ) : onLogin ? (
            <TouchableOpacity
              style={[
                styles.navActionBtn,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
              onPress={onLogin}
              activeOpacity={0.8}
            >
              <Text style={[styles.navActionText, { color: theme.text }]}>Sign In</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ─── PAGE HEADER ────────────────────────────────────────── */}
      <View style={styles.headerSection}>
        <Text style={[styles.sectionOverline, { color: isDark ? '#39D353' : '#1A7F37' }]}>
          OFFICIAL ARCHIVE
        </Text>
        <Text style={[styles.headerTitle, isMobile && styles.headerTitleMobile, { color: theme.text }]}>
          Releases & Distribution
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          TrackHeat cross-platform release logs, changelogs, and direct binary downloads for macOS, Android, and Web.
        </Text>
      </View>

      {/* ─── QUICK DOWNLOADS ROW ─────────────────────────────────── */}
      <View style={styles.quickDownloadsContainer}>
        <View style={styles.quickDownloadsGrid}>
          {/* macOS */}
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => Linking.openURL(`${GITHUB_REPO}/releases/download/v1.2.2/TrackHeat-1.2.2-arm64.dmg`)}
            activeOpacity={0.7}
          >
            <View style={styles.quickCardTop}>
              <View style={[styles.quickIconFrame, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceHighlight }]}>
                <Monitor size={16} color={theme.text} />
              </View>
              <View style={[styles.quickBadge, { backgroundColor: 'rgba(57, 211, 83, 0.12)', borderColor: 'rgba(57, 211, 83, 0.3)' }]}>
                <Text style={[styles.quickBadgeText, { color: isDark ? '#39D353' : '#1A7F37' }]}>v1.2.2 · DMG</Text>
              </View>
            </View>
            <Text style={[styles.quickTitle, { color: theme.text }]}>macOS Universal</Text>
            <Text style={[styles.quickDesc, { color: theme.textSecondary }]}>Apple Silicon & Intel DMG</Text>
            <View style={[styles.quickAction, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              <Download size={12} color={theme.text} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Download .dmg</Text>
            </View>
          </TouchableOpacity>

          {/* Android */}
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => Linking.openURL(`${GITHUB_REPO}/releases/download/v1.2.2/TrackHeat-1.2.2.apk`)}
            activeOpacity={0.7}
          >
            <View style={styles.quickCardTop}>
              <View style={[styles.quickIconFrame, { borderColor: theme.borderSubtle, backgroundColor: theme.surfaceHighlight }]}>
                <Smartphone size={16} color={theme.text} />
              </View>
              <View style={[styles.quickBadge, { backgroundColor: 'rgba(57, 211, 83, 0.12)', borderColor: 'rgba(57, 211, 83, 0.3)' }]}>
                <Text style={[styles.quickBadgeText, { color: isDark ? '#39D353' : '#1A7F37' }]}>v1.2.2 · APK</Text>
              </View>
            </View>
            <Text style={[styles.quickTitle, { color: theme.text }]}>Android Mobile</Text>
            <Text style={[styles.quickDesc, { color: theme.textSecondary }]}>Standalone APK with Widgets</Text>
            <View style={[styles.quickAction, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              <Download size={12} color={theme.text} />
              <Text style={[styles.quickActionText, { color: theme.text }]}>Download .apk</Text>
            </View>
          </TouchableOpacity>

          {/* Web App */}
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: theme.surface, borderColor: isDark ? '#39D353' : '#1A7F37' }]}
            onPress={isLoggedIn && onOpenDashboard ? onOpenDashboard : onLogin ? onLogin : onBack}
            activeOpacity={0.7}
          >
            <View style={styles.quickCardTop}>
              <View style={[styles.quickIconFrame, { borderColor: isDark ? '#39D353' : '#1A7F37', backgroundColor: isDark ? 'rgba(57, 211, 83, 0.1)' : 'rgba(26, 127, 55, 0.08)' }]}>
                <Globe size={16} color={isDark ? '#39D353' : '#1A7F37'} />
              </View>
              <View style={[styles.quickBadge, { backgroundColor: isDark ? 'rgba(57, 211, 83, 0.15)' : 'rgba(26, 127, 55, 0.12)', borderColor: isDark ? 'rgba(57, 211, 83, 0.4)' : 'rgba(26, 127, 55, 0.3)' }]}>
                <Text style={[styles.quickBadgeText, { color: isDark ? '#39D353' : '#1A7F37' }]}>LIVE PWA</Text>
              </View>
            </View>
            <Text style={[styles.quickTitle, { color: theme.text }]}>Browser Web App</Text>
            <Text style={[styles.quickDesc, { color: theme.textSecondary }]}>Zero-install cloud sync</Text>
            <View style={[styles.quickAction, { backgroundColor: isDark ? '#39D353' : '#1A7F37', borderColor: isDark ? '#39D353' : '#1A7F37' }]}>
              <ArrowRight size={12} color="#FFFFFF" />
              <Text style={[styles.quickActionText, { color: '#FFFFFF' }]}>Open App</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── ALL RELEASES LIST ───────────────────────────────────── */}
      <View style={styles.releasesSection}>
        <View style={styles.releasesList}>
          {ALL_RELEASES.map((rel) => (
            <View
              key={rel.version}
              style={[
                styles.releaseCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: rel.isLatest
                    ? (isDark ? 'rgba(57, 211, 83, 0.45)' : 'rgba(26, 127, 55, 0.35)')
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

      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <View style={[styles.footer, isMobile && styles.footerMobile, { borderTopColor: theme.borderSubtle }]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.footerBrand, { color: theme.text }]}>TRACKHEAT</Text>
          <Text style={[styles.footerCopy, { color: theme.textMuted }]}>
            MIT Licensed · Open Source Habit Engine
          </Text>
        </View>
        <TouchableOpacity onPress={handleGithubRepo} style={styles.footerLink}>
          <Github size={13} color={theme.textSecondary} />
          <Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>GitHub Repository</Text>
        </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 60,
    maxWidth: 960,
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
    paddingVertical: 12,
    marginBottom: 32,
    borderBottomWidth: 1,
  },
  navbarMobile: {
    marginBottom: 24,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 16,
    height: 16,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  releasesTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  releasesTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navGithubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
  },
  navGithubText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  navActionBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Header Section
  headerSection: {
    marginBottom: 28,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headerTitleMobile: {
    fontSize: 24,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 14.5,
    lineHeight: 22,
    maxWidth: 640,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Quick Downloads
  quickDownloadsContainer: {
    marginBottom: 36,
  },
  quickDownloadsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  quickCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickIconFrame: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  quickBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  quickDesc: {
    fontSize: 12,
    marginBottom: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Releases Section
  releasesSection: {
    marginBottom: 40,
  },
  releasesList: {
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

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    borderTopWidth: 1,
    gap: 16,
  },
  footerMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footerCopy: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
