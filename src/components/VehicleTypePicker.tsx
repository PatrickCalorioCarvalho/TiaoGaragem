import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { vehicleTypeIcon, vehicleTypeLabel } from '../utils/labels';
import type { VehicleType } from '../types';

interface VehicleTypePickerProps {
  value: VehicleType;
  onChange: (value: VehicleType) => void;
}

const OPTIONS: VehicleType[] = ['car', 'moto'];

export function VehicleTypePicker({ value, onChange }: VehicleTypePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tipo</Text>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <MaterialCommunityIcons
                name={vehicleTypeIcon(option)}
                size={22}
                color={selected ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.optionLabel, selected && { color: colors.primary, fontWeight: '700' }]}>
                {vehicleTypeLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EFF4FF',
  },
  optionLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
