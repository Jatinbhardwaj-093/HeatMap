import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Activity, Monitor, Smartphone, Download, ArrowRight, Github } from 'lucide-react-native';

interface LandingPageProps {
  onLogin: () => void;
  onDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onDashboard }) => {
  const handleDownload = (platform: string) => {
    const msg = `${platform} download is coming soon. The build pipeline is currently deploying to GitHub Releases.`;
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Coming Soon', msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Navbar */}
      <View style={styles.nav}>
        <View style={styles.logoGroup}>
          <Activity color="#F0F6FC" size={20} />
          <Text style={styles.logoText}>HEATMAP</Text>
        </View>
        <TouchableOpacity style={styles.navLoginBtn} onPress={onLogin} activeOpacity={0.7}>
          <Text style={styles.navLoginText}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Track Daily Action.</Text>
        <Text style={styles.heroTitle}>Build Unbreakable Streaks.</Text>
        <Text style={styles.heroSub}>
          A minimalist, cross-platform heatmap tracker for fitness, deep work, and habits. 
          Zero fluff. Zero friction. Just your data visualized.
        </Text>
        
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onDashboard} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Open Web App</Text>
            <ArrowRight color="#090A0C" size={16} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onLogin} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features / Downloads */}
      <View style={styles.downloadsSection}>
        <Text style={styles.sectionHeader}>NATIVE APPLICATIONS</Text>
        <View style={styles.grid}>
          
          <View style={styles.card}>
            <Monitor color="#58A6FF" size={24} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>macOS Desktop</Text>
            <Text style={styles.cardDesc}>Native window wrapper, system tray support, and offline persistence.</Text>
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={() => handleDownload('macOS')}>
              <Download color="#F0F6FC" size={14} />
              <Text style={styles.downloadText}>Download .dmg</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Smartphone color="#3FB950" size={24} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Android</Text>
            <Text style={styles.cardDesc}>Standalone APK. Includes live RemoteViews home screen widgets.</Text>
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={() => handleDownload('Android APK')}>
              <Download color="#F0F6FC" size={14} />
              <Text style={styles.downloadText}>Download .apk</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Smartphone color="#A371F7" size={24} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>iOS</Text>
            <Text style={styles.cardDesc}>TestFlight beta. Includes WidgetKit integrations for Lock Screen.</Text>
            <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.7} onPress={() => handleDownload('iOS TestFlight')}>
              <Text style={styles.downloadText}>Join TestFlight</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 HeatMap Open Source</Text>
        <TouchableOpacity style={styles.githubLink} activeOpacity={0.7} onPress={() => handleDownload('Source code')}>
          <Github color="#8B949E" size={16} />
          <Text style={styles.footerText}>Source Code</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0C',
  },
  content: {
    padding: 24,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    minHeight: '100%',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    marginBottom: 60,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  navLoginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 4,
    backgroundColor: '#161B22',
  },
  navLoginText: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  hero: {
    marginBottom: 80,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 56 : 36,
    fontWeight: '800',
    letterSpacing: -1.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    lineHeight: Platform.OS === 'web' ? 64 : 42,
  },
  heroSub: {
    color: '#8B949E',
    fontSize: 18,
    maxWidth: 600,
    marginTop: 20,
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: '#F0F6FC',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#090A0C',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  secondaryBtn: {
    backgroundColor: '#090A0C',
    borderColor: '#30363D',
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 4,
  },
  secondaryBtnText: {
    color: '#F0F6FC',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  downloadsSection: {
    marginBottom: 60,
  },
  sectionHeader: {
    color: '#6E7681',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  grid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderColor: '#21262D',
    borderWidth: 1,
    borderRadius: 6,
    padding: 24,
  },
  cardIcon: {
    marginBottom: 16,
  },
  cardTitle: {
    color: '#F0F6FC',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cardDesc: {
    color: '#8B949E',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
    minHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 10,
  },
  downloadText: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 24,
    paddingBottom: 24,
  },
  footerText: {
    color: '#8B949E',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  githubLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
