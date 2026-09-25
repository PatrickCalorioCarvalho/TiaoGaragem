import { useMemo } from 'react';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import { BRAZIL_STATES } from '../data/brazilStates';

interface UfPickerProps {
  label: string;
  value: string | null;
  onChange: (uf: string | null) => void;
}

export function UfPicker({ label, value, onChange }: UfPickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={value ?? ''} onValueChange={(uf) => onChange(uf || null)}>
          <Picker.Item label="Selecione o estado" value="" />
          {BRAZIL_STATES.map((state) => (
            <Picker.Item key={state.uf} label={`${state.name} (${state.uf})`} value={state.uf} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    pickerWrapper: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: 'hidden',
    },
  });
}
