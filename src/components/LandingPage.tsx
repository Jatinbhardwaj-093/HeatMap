import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Linking, Dimensions } from 'react-native';
import { Activity, Monitor, Smartphone, Download, ArrowRight, Github, CheckSquare, Grid, Zap } from 'lucide-react-native';

interface LandingPageProps {
  onLogin: () => void;
  onDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onDashboard }) => {
  const handleDownload = () => {
    Linking.openURL('https://github.com/Jatinbhardwaj-093/HeatMap/releases');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Navbar */}
      <View style={styles.nav}>
        <View style={styles.logoGroup}>
          <Activity color="#F0F6FC" size={24} />
          <Text style={styles.logoText}>HEATMAP</Text>
        </View>
        <TouchableOpacity style={styles.navLoginBtn} onPress={onLogin} activeOpacity={0.7}>
          <Text style={styles.navLoginText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>TRACK DAILY ACTION.</Text>
        <Text style={styles.heroTitle}>BUILD UNBREAKABLE STREAKS.</Text>
        <Text style={styles.heroSub}>
          A minimalist, cross-platform heatmap tracker for fitness, deep work, and habits. 
          Zero fluff. Zero friction. Just your data visualized.
        </Text>
        
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onDashboard} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>OPEN WEB APP</Text>
            <ArrowRight color="#090A0C" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onLogin} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>CREATE ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Philosophy Section */}
      <View style={styles.philosophySection}>
        <Text style={styles.sectionHeader}>PHILOSOPHY</Text>
        <View style={styles.philosophyGrid}>
          <View style={styles.philosophyCard}>
            <CheckSquare color="#8B949E" size={24} style={styles.philosophyIcon} />
            <Text style={styles.philosophyTitle}>Binary Logging</Text>
            <Text style={styles.philosophyDesc}>Manage day-to-day habits. Log yes or no instead of stressing over continuous numbers.</Text>
          </View>
          <View style={styles.philosophyCard}>
            <Grid color="#8B949E" size={24} style={styles.philosophyIcon} />
            <Text style={styles.philosophyTitle}>Dedicated Views</Text>
            <Text style={styles.philosophyDesc}>A dedicated heatmap for each habit you need to track. Keep your routines separated and clear.</Text>
          </View>
          <View style={styles.philosophyCard}>
            <Zap color="#8B949E" size={24} style={styles.philosophyIcon} />
            <Text style={styles.philosophyTitle}>Visual Motivation</Text>
            <Text style={styles.philosophyDesc}>Inspired by GitHub heatmaps to track your routines and give visual motivation to achieve things.</Text>
          </View>
        </View>
      </View>

      {/* Features / Downloads */}
      <View style={styles.downloadsSection}>
        <Text style={styles.sectionHeader}>NATIVE APPLICATIONS</Text>
        <View style={styles.grid}>
          
          <View style={styles.card}>
            <Monitor color="#F0F6FC" size={28} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>macOS Desktop</Text>
            <Text style={styles.cardDesc}>Native window wrapper, system tray support, and offline persistence.</Text>
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={handleDownload}>
              <Download color="#090A0C" size={16} />
              <Text style={styles.downloadText}>DOWNLOAD .DMG</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Smartphone color="#F0F6FC" size={28} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Android</Text>
            <Text style={styles.cardDesc}>Standalone APK. Includes live RemoteViews home screen widgets.</Text>
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={handleDownload}>
              <Download color="#090A0C" size={16} />
              <Text style={styles.downloadText}>DOWNLOAD .APK</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Smartphone color="#F0F6FC" size={28} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>iOS</Text>
            <Text style={styles.cardDesc}>TestFlight beta. Includes WidgetKit integrations for Lock Screen.</Text>
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={handleDownload}>
              <Text style={styles.downloadText}>JOIN TESTFLIGHT</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 HeatMap Open Source</Text>
        <TouchableOpacity style={styles.githubLink} activeOpacity={0.7} onPress={handleDownload}>
          <Github color="#8B949E" size={16} />
          <Text style={styles.footerText}>Source Code</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0C',
  },
  content: {
    padding: 32,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    minHeight: '100%',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    marginBottom: 80,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    color: '#F0F6FC',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  navLoginBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#30363D',
    backgroundColor: 'transparent',
  },
  navLoginText: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  hero: {
    marginBottom: 100,
  },
  heroTitle: {
    color: '#F0F6FC',
    fontSize: width > 768 ? 64 : 40,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: width > 768 ? 72 : 48,
  },
  heroSub: {
    color: '#8B949E',
    fontSize: 20,
    maxWidth: 650,
    marginTop: 24,
    lineHeight: 32,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 40,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: '#F0F6FC',
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryBtnText: {
    color: '#090A0C',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderColor: '#30363D',
    borderWidth: 1,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  secondaryBtnText: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  philosophySection: {
    marginBottom: 100,
  },
  philosophyGrid: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 32,
  },
  philosophyCard: {
    flex: 1,
  },
  philosophyIcon: {
    marginBottom: 16,
  },
  philosophyTitle: {
    color: '#F0F6FC',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  philosophyDesc: {
    color: '#8B949E',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  downloadsSection: {
    marginBottom: 100,
  },
  sectionHeader: {
    color: '#6E7681',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  grid: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 32,
  },
  card: {
    flex: 1,
    backgroundColor: '#090A0C',
    borderColor: '#30363D',
    borderWidth: 1,
    padding: 32,
  },
  cardIcon: {
    marginBottom: 24,
  },
  cardTitle: {
    color: '#F0F6FC',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cardDesc: {
    color: '#8B949E',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
    minHeight: 48,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F0F6FC',
    paddingVertical: 16,
  },
  downloadText: {
    color: '#090A0C',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 32,
    paddingBottom: 32,
  },
  footerText: {
    color: '#8B949E',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  githubLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
