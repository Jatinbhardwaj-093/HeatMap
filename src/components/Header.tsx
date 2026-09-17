import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { ViewMode } from '../types/heatmap';
import { ViewSwitcher } from './ViewSwitcher';
import { LogOut, Smartphone, Grid3X3 } from 'lucide-react-native';

interface HeaderProps {
  currentView: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  onOpenWidgetStudio: () => void;
  onLogout: () => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeViewMode,
  onOpenWidgetStudio,
  onLogout,
  userEmail,
}) => {
  return (
    <View style={styles.header}>
      {/* Brand row */}
      <View style={styles.brandRow}>
        <View style={styles.logoGroup}>
          <View style={styles.logoIcon}>
            <Grid3X3 size={15} color="#26A641" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.brandName}>HEATMAP</Text>
            {userEmail ? (
              <Text style={styles.brandSub}>{userEmail}</Text>
            ) : null}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.widgetBtn}
            onPress={onOpenWidgetStudio}
            activeOpacity={0.7}
          >
            <Smartphone size={13} color="#F0F6FC" strokeWidth={2} />
            <Text style={styles.widgetBtnText}>WIDGETS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <LogOut size={14} color="#8B949E" />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Switcher bar */}
      <View style={styles.switcherBar}>
        <ViewSwitcher currentView={currentView} onViewChange={onChangeViewMode} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#090B0E',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    color: '#F0F6FC',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 1,
  },
  brandSub: {
    color: '#8B949E',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  widgetBtnText: {
    color: '#F0F6FC',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 3,
  },
  switcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
