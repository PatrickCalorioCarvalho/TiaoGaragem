export const lightColors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  border: '#E2E5EA',
  text: '#1C1F26',
  textMuted: '#6B7280',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  primarySoft: '#EFF4FF',
  ok: '#16A34A',
  okBg: '#DCFCE7',
  atencao: '#D97706',
  atencaoBg: '#FEF3C7',
  critico: '#DC2626',
  criticoBg: '#FEE2E2',
  neutral: '#6B7280',
  neutralBg: '#E5E7EB',
};

export const darkColors: ThemeColors = {
  background: '#14161A',
  surface: '#1C1F26',
  border: '#2E323C',
  text: '#F5F6F8',
  textMuted: '#9AA1AC',
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  primarySoft: 'rgba(59, 130, 246, 0.15)',
  ok: '#4ADE80',
  okBg: 'rgba(74, 222, 128, 0.15)',
  atencao: '#FBBF24',
  atencaoBg: 'rgba(251, 191, 36, 0.15)',
  critico: '#F87171',
  criticoBg: 'rgba(248, 113, 113, 0.15)',
  neutral: '#9AA1AC',
  neutralBg: 'rgba(154, 161, 172, 0.15)',
};

export type ThemeColors = typeof lightColors;

export type StatusKind = 'ok' | 'atencao' | 'critico' | 'neutral';

export function statusColors(colors: ThemeColors, kind: StatusKind): { fg: string; bg: string } {
  switch (kind) {
    case 'ok':
      return { fg: colors.ok, bg: colors.okBg };
    case 'atencao':
      return { fg: colors.atencao, bg: colors.atencaoBg };
    case 'critico':
      return { fg: colors.critico, bg: colors.criticoBg };
    default:
      return { fg: colors.neutral, bg: colors.neutralBg };
  }
}
