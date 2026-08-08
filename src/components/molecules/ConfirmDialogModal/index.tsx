import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/atoms/AppText';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialogModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors, isDark } = useTheme();

  if (!visible) return null;

  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return { icon: 'alert-circle', color: '#DE350B', bg: 'rgba(222, 53, 11, 0.12)' };
      case 'warning':
        return { icon: 'warning-outline', color: '#FFAB00', bg: 'rgba(255, 171, 0, 0.12)' };
      case 'info':
      default:
        return { icon: 'information-circle-outline', color: '#0052CC', bg: 'rgba(0, 82, 204, 0.12)' };
    }
  };

  const vColor = getVariantColors();
  const cardBg = isDark ? '#172B4D' : '#FFFFFF';
  const borderColor = isDark ? '#253858' : '#DFE1E6';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View
          style={[
            styles.dialogBox,
            { backgroundColor: cardBg, borderColor },
            Platform.OS === 'web' ? ({ boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' } as any) : {},
          ]}
        >
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: vColor.bg }]}>
              <Ionicons name={vColor.icon as any} size={22} color={vColor.color} />
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText style={{ fontWeight: '700', fontSize: 16 }}>
                {title}
              </AppText>
              <AppText variant="caption" color="textSecondary" style={{ marginTop: 4, fontSize: 13, lineHeight: 18 }}>
                {message}
              </AppText>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btnCancel, { borderColor }]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <AppText style={{ fontWeight: '600', fontSize: 13, color: colors.textSecondary }}>
                {cancelLabel}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnConfirm, { backgroundColor: vColor.color }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <AppText style={{ fontWeight: '700', fontSize: 13, color: '#FFFFFF' }}>
                {confirmLabel}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 30, 66, 0.65)',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnCancel: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnConfirm: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
  },
});
