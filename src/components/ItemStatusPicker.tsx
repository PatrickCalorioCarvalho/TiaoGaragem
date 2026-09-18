import { Pressable, StyleSheet, Text, View } from 'react-native';
import { statusColors } from '../theme/colors';
import { itemStatusLabel } from '../utils/labels';
import type { ItemStatus } from '../types';

interface ItemStatusPickerProps {
  label: string;
  value: ItemStatus;
  onChange: (value: ItemStatus) => void;
}

const OPTIONS: ItemStatus[] = ['ok', 'atencao', 'critico'];

export function ItemStatusPicker({ label, value, onChange }: ItemStatusPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const selected = option === value;
          const { fg, bg } = statusColors(option);
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.option,
                { borderColor: selected ? fg : '#E2E5EA' },
                selected && { backgroundColor: bg },
              ]}
            >
              <Text style={[styles.optionLabel, selected && { color: fg, fontWeight: '700' }]}>
                {itemStatusLabel(option)}
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
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 14,
    color: '#374151',
  },
});
