import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, typography, spacing } from "../constants/theme";

const LABEL_COLORS = {
  Good: colors.success,
  Fair: colors.warning,
  "Needs attention": colors.alert[500],
};

/**
 * Renders healthScoreService.getHealthScore()'s { score, overall } as a
 * radial ring — no chart library needed, just react-native-svg (already
 * a transitive Expo dependency), mirroring the web's CSS conic-gradient
 * ring with the same color-by-label logic.
 */
export default function HealthScoreRing({ score, overall, size = 120 }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const color = LABEL_COLORS[overall] || colors.mist[400];

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[typography.h1, { fontSize: size * 0.28 }]}>{score}</Text>
        <Text style={[typography.caption, { color }]}>{overall}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
