export const colors = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  border: '#E2E5EA',
  text: '#1C1F26',
  textMuted: '#6B7280',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  ok: '#16A34A',
  okBg: '#DCFCE7',
  atencao: '#D97706',
  atencaoBg: '#FEF3C7',
  critico: '#DC2626',
  criticoBg: '#FEE2E2',
  neutral: '#6B7280',
  neutralBg: '#E5E7EB',
};

export type StatusKind = 'ok' | 'atencao' | 'critico' | 'neutral';

export function statusColors(kind: StatusKind): { fg: string; bg: string } {
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
