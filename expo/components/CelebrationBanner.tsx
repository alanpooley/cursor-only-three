import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { ThemePalette } from "@/constants/onlyThreeTheme";

const AUTO_DISMISS_MS = 4000;
const FADE_IN_MS = 280;
const FADE_OUT_MS = 500;

interface CelebrationBannerProps {
  visible: boolean;
  palette: ThemePalette;
  availableTaskCount: number;
  onDismiss?: () => void;
}

const celebrationMessages: string[] = [
  "Crushed it",
  "Nice work",
  "All done",
  "Nailed it",
  "Boss move",
];

const taskCountWords: Record<number, string> = {
  1: "One task",
  2: "Two tasks",
  3: "All three",
};

export function CelebrationBanner({ visible, palette, availableTaskCount, onDismiss }: CelebrationBannerProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const iconSpin = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasVisible = useRef(false);
  const [message] = useState(() => celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)]);
  const [dismissed, setDismissed] = useState(false);

  const styles = useMemo(() => createStyles(palette), [palette]);

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    shimmer.stopAnimation();
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -16,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.92,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDismissed(true);
      onDismiss?.();
    });
  }, [opacity, translateY, scale, shimmer, onDismiss]);

  useEffect(() => {
    if (visible && !wasVisible.current && !dismissed) {
      wasVisible.current = true;

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      iconScale.setValue(0);
      iconSpin.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 12,
          speed: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_IN_MS,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 10,
          speed: 14,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          useNativeDriver: true,
          bounciness: 18,
          speed: 8,
          delay: 120,
        }),
        Animated.timing(iconSpin, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
          delay: 100,
        }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmer, {
              toValue: 1,
              duration: 1600,
              useNativeDriver: true,
            }),
            Animated.timing(shimmer, {
              toValue: 0,
              duration: 1600,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });

      dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    } else if (!visible) {
      wasVisible.current = false;
      setDismissed(false);
      opacity.setValue(0);
      translateY.setValue(-30);
      scale.setValue(0.85);
      iconScale.setValue(0);
      iconSpin.setValue(0);
      shimmer.stopAnimation();
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    }
  }, [visible, dismissed, opacity, scale, shimmer, translateY, iconScale, iconSpin, dismiss]);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  const glowOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const spinRotate = iconSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (dismissed && !visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.floatingWrap,
        {
          top: insets.top + 4,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={styles.toast}>
        <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: iconScale }, { rotate: spinRotate }] }]}>
          <Sparkles color="#fff" size={14} strokeWidth={2.5} />
        </Animated.View>
        <View style={styles.textWrap}>
          <Text style={styles.toastText}>{message}</Text>
          <Text style={styles.toastSub}>{taskCountWords[availableTaskCount] ?? `${availableTaskCount} tasks`} done</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function createStyles(p: ThemePalette) {
  return StyleSheet.create({
    floatingWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
      zIndex: 100,
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 40,
      backgroundColor: p.surfaceElevated,
      borderWidth: 1,
      borderColor: "rgba(52,211,153,0.3)",
      shadowColor: "#34D399",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    glowRing: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 40,
      borderWidth: 1.5,
      borderColor: "#34D399",
      opacity: 0.4,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#34D399",
    },
    textWrap: {
      gap: 1,
    },
    toastText: {
      color: p.ink,
      fontSize: 15,
      fontWeight: "700" as const,
      letterSpacing: -0.2,
    },
    toastSub: {
      color: "#34D399",
      fontSize: 12,
      fontWeight: "600" as const,
      opacity: 0.85,
    },
  });
}
