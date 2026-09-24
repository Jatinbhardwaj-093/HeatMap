import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Dimensions,
  Image,
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
} from 'lucide-react-native';
import { useAppTheme, useIsDark, useThemeMode } from '../theme/theme';

interface LandingPageProps {
  onLogin: () => void;
  onDashboard: () => void;
  isLoggedIn?: boolean;
}

interface DemoPreset {
  id: string;
  name: string;
  category: string;
  colorName: string;
  accentColor: string;
  levelColors: [string, string, string, string, string];
  streak: number;
  completionRate: string;
  totalDays: number;
}

const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'deep-work',
    name: 'Deep Engineering',
    category: 'FOCUS',
    colorName: 'Emerald Matrix',
    accentColor: '#39D353',
    levelColors: ['#161B22', '#0E4429', '#006D32', '#26A641', '#39D353'],
    streak: 42,
    completionRate: '94.2%',
    totalDays: 198,
  },
  {
    id: 'workout',
    name: 'High-Intensity Training',
    category: 'FITNESS',
    colorName: 'Industrial Amber',
    accentColor: '#F59E0B',
    levelColors: ['#1A1713', '#43280B', '#78470E', '#B45309', '#F59E0B'],
    streak: 18,
    completionRate: '86.5%',
    totalDays: 142,
  },
  {
    id: 'read-meditate',
    name: 'Morning Reading & Solitude',
    category: 'MIND',
    colorName: 'Cold Cyan',
    accentColor: '#38BDF8',
    levelColors: ['#111923', '#0C384D', '#0E5D7F', '#0284C7', '#38BDF8'],
    streak: 29,
    completionRate: '91.8%',
    totalDays: 176,
  },
];

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

// Generate authentic full-year 52-week matrix patterns with realistic blanks and streaks
function generateFullYearData(presetId: string): number[][] {
  const weeks: number[][] = [];
  const TOTAL_WEEKS = 52;
  const CURRENT_WEEK = 42; // today is around week 42; weeks 43-51 are future blanks

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const weekDays: number[] = [];

    for (let d = 0; d < 7; d++) {
      if (w > CURRENT_WEEK) {
        // Future days: unlogged blank place
        weekDays.push(0);
        continue;
      }

      if (presetId === 'deep-work') {
        // Engineering: focus on weekdays (d = 0 to 4), weekends mostly blank
        if (d >= 5) {
          // Weekend: mostly unlogged, occasional light session
          const r = (w * 7 + d * 13) % 10;
          weekDays.push(r > 7 ? 2 : 0);
        } else if (w >= 36) {
          // Current unbroken streak (weeks 36 to 42)
          weekDays.push(4);
        } else if (w === 18 || w === 19) {
          // Two-week vacation: blank place
          weekDays.push(0);
        } else {
          // Normal weekday consistency with realistic gaps
          const r = (w * 11 + d * 17) % 10;
          if (r === 0 || r === 5) weekDays.push(0); // Rest / blank
          else if (r < 4) weekDays.push(2);
          else if (r < 8) weekDays.push(3);
          else weekDays.push(4);
        }
      } else if (presetId === 'workout') {
        // Fitness: 4 sessions per week (Mon, Wed, Fri, Sat)
        const isWorkoutDay = d === 0 || d === 2 || d === 4 || d === 5;
        if (w >= 39 && isWorkoutDay) {
          // Current streak in recent weeks
          weekDays.push(4);
        } else if (w === 12 || w === 28) {
          // Deload / travel week: blank
          weekDays.push(0);
        } else if (isWorkoutDay) {
          const r = (w * 13 + d * 7) % 10;
          if (r === 1) weekDays.push(0); // Missed day
          else if (r < 5) weekDays.push(3);
          else weekDays.push(4);
        } else {
          // Rest day: clean blank place
          weekDays.push(0);
        }
      } else {
        // Mind / Reading: daily habit with occasional missed days
        if (w >= 38) {
          // Current 29-day streak
          weekDays.push(4);
        } else if (w === 14 || w === 25) {
          // Blank break
          weekDays.push(0);
        } else {
          const r = (w * 7 + d * 5) % 10;
          if (r <= 2) weekDays.push(0); // Blank day
          else if (r <= 5) weekDays.push(2);
          else if (r <= 8) weekDays.push(3);
          else weekDays.push(4);
        }
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
  const theme = useAppTheme();
  const isDark = useIsDark();
  const { themeMode, setThemeMode } = useThemeMode();

  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const activePreset = DEMO_PRESETS[activePresetIndex];

  // Interactive user edits in the demo
  const [clickedCells, setClickedCells] = useState<Record<string, number>>({});

  // 52-week full year data matrix for active preset
  const baseMatrix = useMemo(() => {
    return generateFullYearData(activePreset.id);
  }, [activePreset.id]);

  const toggleDemoCell = (cellKey: string, currentLevel: number) => {
    setClickedCells((prev) => ({
      ...prev,
      [cellKey]: prev[cellKey] !== undefined ? (prev[cellKey] === 0 ? 4 : 0) : currentLevel > 0 ? 0 : 4,
    }));
  };

  const handleDownloadRelease = () => {
    Linking.openURL('https://github.com/Jatinbhardwaj-093/HeatMap/releases');
  };

  const handleGithubRepo = () => {
    Linking.openURL('https://github.com/Jatinbhardwaj-093/HeatMap');
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  // Auth gate: If logged in, go to dashboard. If not logged in, must go to login/register
  const handlePrimaryAuthAction = () => {
    if (isLoggedIn) {
      onDashboard();
    } else {
      onLogin();
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── NAVIGATION BAR ────────────────────────────────────── */}
      <View style={[styles.navbar, { borderColor: theme.borderSubtle }]}>
        <View style={styles.brandGroup}>
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
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={[styles.brandText, { color: theme.text }]}>HABITHEAT</Text>
              <View
                style={[
                  styles.statusTag,
                  {
                    backgroundColor: isDark ? 'rgba(57, 211, 83, 0.15)' : 'rgba(26, 127, 55, 0.12)',
                    borderColor: isDark ? 'rgba(57, 211, 83, 0.4)' : 'rgba(26, 127, 55, 0.3)',
                  },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.statusText, { color: theme.success }]}>V1.2 · LIVE</Text>
              </View>
            </View>
            <Text style={[styles.brandSub, { color: theme.textSecondary }]}>Binary Habit Matrix</Text>
          </View>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity
            style={[styles.iconButton, { borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            {isDark ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#656D76" />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navGithubBtn, { borderColor: theme.borderSubtle, backgroundColor: theme.surface }]}
            onPress={handleGithubRepo}
            activeOpacity={0.7}
          >
            <Github size={14} color={theme.textSecondary} />
            <Text style={[styles.navGithubText, { color: theme.textSecondary }]}>GitHub</Text>
          </TouchableOpacity>

          {isLoggedIn ? (
            <TouchableOpacity
              style={[styles.navSignInBtn, { borderColor: theme.success, backgroundColor: theme.surfaceHighlight }]}
              onPress={onDashboard}
              activeOpacity={0.8}
            >
              <Text style={[styles.navSignInText, { color: theme.success }]}>DASHBOARD</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navSignInBtn, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}
              onPress={onLogin}
              activeOpacity={0.8}
            >
              <Text style={[styles.navSignInText, { color: theme.text }]}>SIGN IN</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── HERO SECTION ──────────────────────────────────────── */}
      <View style={styles.heroSection}>
        {/* Editorial Pill */}
        <View
          style={[
            styles.heroPill,
            {
              borderColor: isDark ? 'rgba(57, 211, 83, 0.35)' : 'rgba(26, 127, 55, 0.3)',
              backgroundColor: isDark ? 'rgba(14, 68, 41, 0.2)' : 'rgba(26, 127, 55, 0.08)',
            },
          ]}
        >
          <Flame size={13} color={isDark ? '#39D353' : '#1A7F37'} strokeWidth={2.5} />
          <Text style={[styles.heroPillText, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            GITHUB-STYLE DISCIPLINE · ZERO NUMERIC FATIGUE
          </Text>
        </View>

        {/* Dual-Tone Headline */}
        <View style={styles.headlineWrapper}>
          <Text style={[styles.heroTitleMain, { color: theme.text }]}>
            DON'T BREAK THE CHAIN.
          </Text>
          <Text style={[styles.heroTitleAccent, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            COMPOUND EVERY DAY.
          </Text>
        </View>

        {/* Subtitle with Clean Flow (No M-dash) */}
        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
          Stop drowning in continuous numbers, target meters, and bookkeeping anxiety.
          HabitHeat strips routine tracking down to an elegant <Text style={{ color: theme.text, fontWeight: '700' }}>binary check-in</Text>.
          Log yes or no and let daily consistency compound into green contribution matrices.
        </Text>

        {/* Hero Actions (Strict Auth Protection) */}
        <View style={styles.heroButtonsRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: isDark ? '#39D353' : '#1A7F37' }]}
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
              style={[styles.secondaryActionBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
              onPress={onLogin}
              activeOpacity={0.85}
            >
              <Lock size={14} color={theme.textSecondary} />
              <Text style={[styles.secondaryActionText, { color: theme.text }]}>SIGN IN TO ACCOUNT</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Micro Tech Guarantee */}
        <View style={styles.guaranteeRow}>
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

      {/* ─── LIVE FULL-WIDTH 52-WEEK MATRIX SHOWCASE ───────────── */}
      <View style={[styles.interactiveCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {/* Card Header */}
        <View style={[styles.interactiveHeader, { borderBottomColor: theme.borderSubtle }]}>
          <View style={styles.interactiveHeaderLeft}>
            <View style={[styles.terminalIndicator, { backgroundColor: activePreset.accentColor }]} />
            <View>
              <Text style={[styles.interactiveTitle, { color: theme.text }]}>
                {activePreset.name.toUpperCase()}
              </Text>
              <Text style={[styles.interactiveSub, { color: theme.textMuted }]}>
                Annual Matrix Grid · Palette: <Text style={{ color: activePreset.accentColor, fontWeight: '600' }}>{activePreset.colorName}</Text>
              </Text>
            </View>
          </View>

          {/* Preset Switcher */}
          <View style={[styles.presetTabs, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
            {DEMO_PRESETS.map((preset, idx) => {
              const isSelected = activePresetIndex === idx;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetTab,
                    isSelected && { backgroundColor: theme.surface, borderColor: preset.accentColor },
                  ]}
                  onPress={() => {
                    setActivePresetIndex(idx);
                    setClickedCells({});
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetTabText,
                      { color: isSelected ? theme.text : theme.textMuted },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {preset.category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Full-Width Matrix Grid Visualization */}
        <View style={styles.matrixViewWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fullWidthMatrixScroll}
          >
            <View>
              {/* Month Header Labels across the 52 weeks */}
              <View style={styles.monthHeaderRow}>
                <View style={{ width: 28 }} />
                <View style={styles.monthLabelsContainer}>
                  {MONTH_HEADERS.map((m) => (
                    <Text
                      key={m.label}
                      style={[
                        styles.monthHeaderText,
                        {
                          left: m.week * 16 + 28,
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

          {/* Matrix Footnote / Legend */}
          <View style={[styles.matrixFooterRow, { borderTopColor: theme.borderSubtle }]}>
            <View style={styles.interactiveHintRow}>
              <Sparkles size={12} color={activePreset.accentColor} />
              <Text style={[styles.interactiveHint, { color: theme.textSecondary }]}>
                Interactive Demo: 52-week annual matrix with real blanks. Click any cell to test intensity.
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
              <Text style={[styles.legendLabel, { color: theme.textMuted }]}>Max Streak</Text>
            </View>
          </View>
        </View>

        {/* Live Matrix Metrics Strip */}
        <View style={[styles.metricsStrip, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
          <View style={styles.metricBlock}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>CURRENT STREAK</Text>
            <View style={styles.metricValueRow}>
              <Flame size={16} color={activePreset.accentColor} strokeWidth={2.5} />
              <Text style={[styles.metricValue, { color: activePreset.accentColor }]}>
                {activePreset.streak} <Text style={{ fontSize: 13, color: theme.textSecondary }}>DAYS</Text>
              </Text>
            </View>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

          <View style={styles.metricBlock}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>ANNUAL CONSISTENCY</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {activePreset.completionRate}
            </Text>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: theme.border }]} />

          <View style={styles.metricBlock}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>TOTAL ACTIVE SESSIONS</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {activePreset.totalDays} <Text style={{ fontSize: 13, color: theme.textSecondary }}>DAYS</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* ─── PHILOSOPHY SECTION (NO M-DASH) ──────────────────────── */}
      <View style={styles.sectionWrapper}>
        <View style={styles.sectionHeaderCol}>
          <Text style={[styles.sectionOverline, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            ARCHITECTURE OF DISCIPLINE
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Why Binary Tracking Wins Where Numbers Fail
          </Text>
        </View>

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
              Binary Logging vs. Numeric Anxiety
            </Text>

            <Text style={[styles.pillarBody, { color: theme.textSecondary }]}>
              Apps that demand inputs like "8,450 / 10,000 steps" turn personal growth into exhausting bookkeeping. HabitHeat reduces everything to a pure boolean: <Text style={{ color: theme.text, fontWeight: '700' }}>Did you execute today? Yes or No.</Text>
            </Text>

            {/* Comparison Visual Block */}
            <View style={[styles.comparisonBox, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              <View style={styles.comparisonRow}>
                <View style={[styles.compStatusTag, { backgroundColor: 'rgba(248, 81, 73, 0.15)' }]}>
                  <X size={12} color="#F85149" strokeWidth={3} />
                </View>
                <Text style={[styles.compTextStriked, { color: theme.textMuted }]}>
                  "Logged 42 of 60 mins (70% fail)"
                </Text>
              </View>
              <View style={styles.comparisonRow}>
                <View style={[styles.compStatusTag, { backgroundColor: 'rgba(57, 211, 83, 0.15)' }]}>
                  <Check size={12} color={theme.success} strokeWidth={3} />
                </View>
                <Text style={[styles.compTextSuccess, { color: theme.text }]}>
                  "Executed workout. Day marked complete."
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
                <Text style={[styles.pillarBadgeText, { color: '#38BDF8' }]}>02 · MODULARITY</Text>
              </View>
            </View>

            <Text style={[styles.pillarTitle, { color: theme.text }]}>
              Isolated Cellular Matrices
            </Text>

            <Text style={[styles.pillarBody, { color: theme.textSecondary }]}>
              Never merge discordant habits into a generic checklist. Fitness, deep programming, hydration, and reading each command their own autonomous heat matrix, custom palette, and independent streak algorithm.
            </Text>

            {/* Palette Preview Swatches */}
            <View style={[styles.paletteShowcase, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
              <View style={styles.palettePill}>
                <View style={[styles.dotSmall, { backgroundColor: '#39D353' }]} />
                <Text style={[styles.palettePillText, { color: theme.textSecondary }]}>Emerald Matrix</Text>
              </View>
              <View style={styles.palettePill}>
                <View style={[styles.dotSmall, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.palettePillText, { color: theme.textSecondary }]}>Industrial Amber</Text>
              </View>
              <View style={styles.palettePill}>
                <View style={[styles.dotSmall, { backgroundColor: '#38BDF8' }]} />
                <Text style={[styles.palettePillText, { color: theme.textSecondary }]}>Cold Cyan</Text>
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
              The GitHub Contribution Feedback Loop
            </Text>

            <Text style={[styles.pillarBody, { color: theme.textSecondary }]}>
              Software engineers write code every single day just to keep their GitHub commit graph filled with bright green tiles. HabitHeat leverages this exact behavioral psychology to rewire your daily discipline.
            </Text>

            {/* Intensity Scale Preview */}
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
      </View>

      {/* ─── NATIVE APPLICATIONS & PLATFORMS ─────────────────────── */}
      <View style={styles.sectionWrapper}>
        <View style={styles.sectionHeaderCol}>
          <Text style={[styles.sectionOverline, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            PLATFORM AVAILABILITY
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Engineered for Desktop, Web, and Pocket
          </Text>
        </View>

        <View style={styles.platformsGrid}>
          {/* macOS Desktop */}
          <View style={[styles.platformCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.platformTop}>
              <View style={[styles.platformIconFrame, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}>
                <Monitor size={22} color={theme.text} />
              </View>
              <View style={[styles.osTag, { backgroundColor: 'rgba(57, 211, 83, 0.1)', borderColor: 'rgba(57, 211, 83, 0.3)' }]}>
                <Text style={[styles.osTagText, { color: isDark ? '#39D353' : '#1A7F37' }]}>MACOS READY</Text>
              </View>
            </View>

            <Text style={[styles.platformName, { color: theme.text }]}>macOS Universal</Text>
            <Text style={[styles.platformDesc, { color: theme.textSecondary }]}>
              Native Electron build with custom dock badges, menu bar tray shortcuts, and offline-first disk persistence.
            </Text>

            <View style={styles.specList}>
              <Text style={[styles.specItem, { color: theme.textMuted }]}>• Apple Silicon (M1/M2/M3/M4) + Intel DMG</Text>
              <Text style={[styles.specItem, { color: theme.textMuted }]}>• Global shortcut invocation</Text>
            </View>

            <TouchableOpacity
              style={[styles.platformDownloadBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}
              onPress={handleDownloadRelease}
              activeOpacity={0.7}
            >
              <Download size={14} color={theme.text} />
              <Text style={[styles.platformDownloadText, { color: theme.text }]}>DOWNLOAD .DMG</Text>
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
                <Globe size={22} color={isDark ? '#39D353' : '#1A7F37'} />
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
                <Text style={[styles.osTagText, { color: isDark ? '#39D353' : '#1A7F37' }]}>SECURE CLOUD</Text>
              </View>
            </View>

            <Text style={[styles.platformName, { color: theme.text }]}>Browser Cloud Client</Text>
            <Text style={[styles.platformDesc, { color: theme.textSecondary }]}>
              Zero-friction access on any workstation with authenticated Supabase cloud synchronization across all your devices.
            </Text>

            <View style={styles.specList}>
              <Text style={[styles.specItem, { color: theme.textMuted }]}>• Works on Safari, Chrome, Arc, Firefox</Text>
              <Text style={[styles.specItem, { color: theme.textMuted }]}>• Requires verified user account</Text>
            </View>

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
                {isLoggedIn ? 'OPEN WEB DASHBOARD' : 'SIGN IN TO WEB CLIENT'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Android & iOS Mobile */}
          <View style={[styles.platformCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.platformTop}>
              <View style={[styles.platformIconFrame, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}>
                <Smartphone size={22} color={theme.text} />
              </View>
              <View style={[styles.osTag, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                <Text style={[styles.osTagText, { color: '#38BDF8' }]}>WIDGETS INCLUDED</Text>
              </View>
            </View>

            <Text style={[styles.platformName, { color: theme.text }]}>Mobile & Lockscreen</Text>
            <Text style={[styles.platformDesc, { color: theme.textSecondary }]}>
              Standalone Android APK and iOS TestFlight client with live glanceable widgets for home screen and lockscreen.
            </Text>

            <View style={styles.specList}>
              <Text style={[styles.specItem, { color: theme.textMuted }]}>• Android RemoteViews widget</Text>
              <Text style={[styles.specItem, { color: theme.textMuted }]}>• Apple WidgetKit Glanceable tiles</Text>
            </View>

            <TouchableOpacity
              style={[styles.platformDownloadBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}
              onPress={handleDownloadRelease}
              activeOpacity={0.7}
            >
              <Download size={14} color={theme.text} />
              <Text style={[styles.platformDownloadText, { color: theme.text }]}>GET MOBILE BUILD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── BOTTOM CALL TO ACTION ───────────────────────────────── */}
      <View style={[styles.bottomCtaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.bottomCtaContent}>
          <Text style={[styles.bottomCtaOverline, { color: isDark ? '#39D353' : '#1A7F37' }]}>
            READY TO BUILD PERMANENT MOMENTUM?
          </Text>
          <Text style={[styles.bottomCtaTitle, { color: theme.text }]}>
            Start Your First Grid In 10 Seconds.
          </Text>
          <Text style={[styles.bottomCtaSub, { color: theme.textSecondary }]}>
            Free and open-source habit tracking with zero paywalled limits.
          </Text>

          <View style={styles.bottomCtaButtons}>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: isDark ? '#39D353' : '#1A7F37' }]}
              onPress={handlePrimaryAuthAction}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>
                {isLoggedIn ? 'OPEN YOUR DASHBOARD' : 'CREATE ACCOUNT & START'}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryActionBtn, { borderColor: theme.border, backgroundColor: theme.surfaceHighlight }]}
              onPress={handleGithubRepo}
              activeOpacity={0.85}
            >
              <Github size={16} color={theme.text} />
              <Text style={[styles.secondaryActionText, { color: theme.text }]}>STAR ON GITHUB</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <View style={[styles.footer, { borderTopColor: theme.borderSubtle }]}>
        <View style={styles.footerLeft}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={[styles.footerBrand, { color: theme.text }]}>HABITHEAT</Text>
          <Text style={[styles.footerCopy, { color: theme.textMuted }]}>
            © 2026 HabitHeat. Open Source Project. Built for high-discipline builders.
          </Text>
        </View>

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={handleGithubRepo} style={styles.footerLinkItem}>
            <Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>Repository</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownloadRelease} style={styles.footerLinkItem}>
            <Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>Releases</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogin} style={styles.footerLinkItem}>
            <Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>Account Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 60,
    maxWidth: 1140,
    width: '100%',
    alignSelf: 'center',
  },

  // Navbar
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 56,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  logoImage: {
    width: 26,
    height: 26,
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
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 5,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  navSignInText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 56,
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
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  headlineWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitleMain: {
    fontSize: width > 768 ? 52 : 32,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: width > 768 ? 60 : 38,
  },
  heroTitleAccent: {
    fontSize: width > 768 ? 52 : 32,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: width > 768 ? 60 : 38,
  },
  heroSubtitle: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'center',
    maxWidth: 720,
    marginBottom: 36,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heroButtonsRow: {
    flexDirection: width > 600 ? 'row' : 'column',
    gap: 14,
    marginBottom: 28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 88,
  },
  interactiveHeader: {
    flexDirection: width > 650 ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: width > 650 ? 'center' : 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    gap: 12,
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
  presetTabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 5,
    padding: 3,
    gap: 4,
  },
  presetTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetTabText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  matrixViewWrapper: {
    padding: 20,
  },
  fullWidthMatrixScroll: {
    paddingBottom: 8,
    minWidth: '100%',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    height: 18,
    marginBottom: 6,
    position: 'relative',
  },
  monthLabelsContainer: {
    position: 'relative',
    height: 18,
    flex: 1,
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
  },
  matrixDayLabels: {
    paddingTop: 2,
    width: 28,
    gap: 10,
  },
  dayLabel: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  columnsWrapper: {
    flexDirection: 'row',
    gap: 3,
  },
  matrixColumn: {
    flexDirection: 'column',
    gap: 3,
  },
  matrixCell: {
    width: 13,
    height: 13,
    borderRadius: 2.5,
    borderWidth: 1,
  },
  matrixFooterRow: {
    flexDirection: width > 650 ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: width > 650 ? 'center' : 'flex-start',
    paddingTop: 16,
    marginTop: 14,
    borderTopWidth: 1,
    gap: 10,
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
    marginBottom: 88,
  },
  sectionHeaderCol: {
    marginBottom: 36,
  },
  sectionOverline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sectionTitle: {
    fontSize: width > 768 ? 32 : 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  pillarsGrid: {
    flexDirection: width > 800 ? 'row' : 'column',
    gap: 20,
  },
  pillarCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    justifyContent: 'space-between',
  },
  pillarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  pillarBody: {
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  comparisonBox: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    gap: 10,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compStatusTag: {
    width: 20,
    height: 20,
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
    padding: 12,
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
    padding: 12,
  },
  intensityBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  intensityBar: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
    height: 24,
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

  // Platforms Grid
  platformsGrid: {
    flexDirection: width > 800 ? 'row' : 'column',
    gap: 20,
  },
  platformCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    justifyContent: 'space-between',
  },
  platformTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  platformIconFrame: {
    width: 44,
    height: 44,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  platformDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  specList: {
    gap: 6,
    marginBottom: 24,
  },
  specItem: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  platformDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
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
    padding: 40,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 72,
  },
  bottomCtaContent: {
    alignItems: 'center',
    maxWidth: 600,
  },
  bottomCtaOverline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomCtaTitle: {
    fontSize: width > 600 ? 30 : 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomCtaSub: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bottomCtaButtons: {
    flexDirection: width > 500 ? 'row' : 'column',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },

  // Footer
  footer: {
    flexDirection: width > 700 ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: width > 700 ? 'center' : 'flex-start',
    paddingTop: 28,
    borderTopWidth: 1,
    gap: 16,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
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
  footerLinkItem: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});
