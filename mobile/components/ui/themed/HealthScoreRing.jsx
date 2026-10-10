import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../../context/ThemeContext";

/**
 * Theme-aware counterpart of components/HealthScoreRing.jsx, used only by
 * the redesigned Health Score screen (Part 3). Same underlying data shape
 * ({ score, overall }) and the same calm, non-gamified presentation — just
 * resolved against the active light/dark theme instead of the fixed dark
 * ink/mist palette, and a little larger/calmer for the hero placement.
 *
 * Home's dashboard keeps using the original, untouched HealthScoreRing so
 * that out-of-scope screen's look is never affected by this file.
 */
export default function HealthScoreRing({ score, overall, size = 180 }) {
  const { theme } = useTheme();

  const CATEGORY_COLOR = {
    Good: theme.colors.teal,
    Fair: theme.colors.orange,
    "Needs attention": theme.colors.error,
  };

  const strokeWidth = Math.max(10, Math.round(size * 0.07));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score ?? 0)) / 100;
  const color = CATEGORY_COLOR[overall] || theme.colors.primary;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.border}
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
        <Text
          style={[
            styles.score,
            {
              color: theme.colors.textPrimary,
              fontSize: size * 0.24,
              lineHeight: size * 0.28,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {score}
        </Text>
        <Text
          style={[
            styles.overall,
            {
              color,
              fontSize: Math.max(9, size * 0.085),
              lineHeight: Math.max(11, size * 0.105),
              width: size * 0.68,
              maxWidth: size * 0.68,
            },
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          allowFontScaling
        >
          {overall}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  score: { fontWeight: "700" },
  overall: {
    fontWeight: "600",
    marginTop: 3,
    textAlign: "center",
    flexShrink: 1,
  },  
});
