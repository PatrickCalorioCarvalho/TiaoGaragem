import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { colors } from '../theme/colors';
import type { FipeValue } from '../types';

interface FipeChartProps {
  data: FipeValue[];
}

const HEIGHT = 120;
const PADDING_X = 12;
const PADDING_Y = 16;

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatMonth(referenceMonth: string): string {
  return referenceMonth.replace(' de ', '/').replace(/^([a-zç]+)\/(\d{4})$/, (_m, mes, ano) => {
    const label = mes.slice(0, 3);
    return `${label.charAt(0).toUpperCase()}${label.slice(1)}/${ano.slice(2)}`;
  });
}

export function FipeChart({ data }: FipeChartProps) {
  const [width, setWidth] = useState(0);

  if (data.length < 2) {
    return null;
  }

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = Math.max(width - PADDING_X * 2, 1);
  const innerHeight = HEIGHT - PADDING_Y * 2;

  const points = data.map((d, index) => {
    const x = PADDING_X + (index / (data.length - 1)) * innerWidth;
    const y = PADDING_Y + innerHeight - ((d.value - min) / range) * innerHeight;
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const first = data[0];
  const lastValue = data[data.length - 1];
  const trend = lastValue.value - first.value;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.currentValue}>{formatCurrency(lastValue.value)}</Text>
        <Text style={styles.trend}>
          {trend === 0 ? 'estável' : `${trend > 0 ? '+' : ''}${formatCurrency(trend)}`}
        </Text>
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={HEIGHT}>
            <Line
              x1={PADDING_X}
              y1={HEIGHT - PADDING_Y}
              x2={width - PADDING_X}
              y2={HEIGHT - PADDING_Y}
              stroke={colors.border}
              strokeWidth={1}
            />
            <Path d={path} stroke={colors.primary} strokeWidth={2} fill="none" strokeLinecap="round" />
            <Circle cx={last.x} cy={last.y} r={4} fill={colors.primary} />
          </Svg>
        )}
      </View>
      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>{formatMonth(first.referenceMonth)}</Text>
        <Text style={styles.axisLabel}>{formatMonth(lastValue.referenceMonth)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  trend: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
