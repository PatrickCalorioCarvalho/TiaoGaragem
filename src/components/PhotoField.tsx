import { useMemo } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';
import { persistPhoto } from '../utils/photos';

interface PhotoFieldProps {
  label: string;
  uri: string | null;
  onChange: (uri: string | null) => void;
}

export function PhotoField({ label, uri, onChange }: PhotoFieldProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  async function pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o uso da câmera para tirar a foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!result.canceled && result.assets[0]) {
      const persisted = await persistPhoto(result.assets[0].uri);
      onChange(persisted);
    }
  }

  async function pickFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às fotos para escolher uma imagem.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ['images'] });
    if (!result.canceled && result.assets[0]) {
      const persisted = await persistPhoto(result.assets[0].uri);
      onChange(persisted);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {uri ? (
        <View style={styles.previewRow}>
          <Image source={{ uri }} style={styles.thumbnail} />
          <View style={styles.previewActions}>
            <Pressable style={styles.smallButton} onPress={pickFromCamera}>
              <Ionicons name="camera" size={16} color={colors.primary} />
              <Text style={styles.smallButtonLabel}>Refazer</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => onChange(null)}>
              <Ionicons name="trash" size={16} color={colors.critico} />
              <Text style={[styles.smallButtonLabel, { color: colors.critico }]}>Remover</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <Pressable style={styles.pickButton} onPress={pickFromCamera}>
            <Ionicons name="camera" size={18} color={colors.primary} />
            <Text style={styles.pickButtonLabel}>Câmera</Text>
          </Pressable>
          <Pressable style={styles.pickButton} onPress={pickFromLibrary}>
            <Ionicons name="images" size={18} color={colors.primary} />
            <Text style={styles.pickButtonLabel}>Galeria</Text>
          </Pressable>
        </View>
      )}
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
      marginBottom: 6,
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      gap: 8,
    },
    pickButton: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickButtonLabel: {
      color: colors.primary,
      fontWeight: '600',
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    thumbnail: {
      width: 72,
      height: 72,
      borderRadius: 10,
      backgroundColor: colors.neutralBg,
    },
    previewActions: {
      gap: 8,
    },
    smallButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    smallButtonLabel: {
      color: colors.primary,
      fontWeight: '600',
      fontSize: 13,
    },
  });
}
