import { StyleSheet, Text, View } from 'react-native';
import { statusColors, StatusKind } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface StatusBadgeProps {
  label: string;
  kind: StatusKind;
}

export function StatusBadge({ label, kind }: StatusBadgeProps) {
  const { colors } = useTheme();
  const { fg, bg } = statusColors(colors, kind);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
