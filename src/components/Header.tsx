import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { ViewMode } from '../types/heatmap';
import { ViewSwitcher } from './ViewSwitcher';
import { LogOut, Smartphone, Grid3X3 } from 'lucide-react-native';
import { useAppTheme } from '../theme/theme';

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
  const theme = useAppTheme();
  
  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* Brand row */}
      <View style={styles.brandRow}>
        <View style={styles.logoGroup}>
          <View style={[styles.logoIcon, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}>
            <Grid3X3 size={15} color={theme.success} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={[styles.brandName, { color: theme.text }]}>HEATMAP</Text>
            {userEmail ? (
              <Text style={[styles.brandSub, { color: theme.textSecondary }]}>{userEmail}</Text>
            ) : null}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.widgetBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}
              onPress={onOpenWidgetStudio}
              activeOpacity={0.7}
            >
              <Smartphone size={13} color={theme.text} strokeWidth={2} />
              <Text style={[styles.widgetBtnText, { color: theme.text }]}>WIDGETS</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <LogOut size={14} color={theme.textSecondary} />
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
    borderBottomWidth: 1,
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    letterSpacing: 1,
  },
  brandSub: {
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
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  widgetBtnText: {
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
    borderWidth: 1,
    borderRadius: 3,
  },
  switcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
});
