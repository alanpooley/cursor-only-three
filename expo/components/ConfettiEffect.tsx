import React, { useCallback, useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { ThemePalette } from "@/constants/onlyThreeTheme";

const PARTICLE_COUNT = 36;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  shape: "circle" | "rect" | "diamond" | "star";
  wave: number;
  spreadFactor: number;
}

interface ConfettiEffectProps {
  active: boolean;
  palette: ThemePalette;
  originY?: number;
  originWidth?: number;
}

export const ConfettiEffect = React.memo(function ConfettiEffect({ active, palette, originY, originWidth = 0 }: ConfettiEffectProps) {
  const hasTriggered = useRef<boolean>(false);
  const particlesRef = useRef<Particle[] | null>(null);

  const colors = useMemo(() => [
    "#34D399", "#6EE7B7", "#A7F3D0",
    palette.accent, palette.accentStrong,
    "#FBBF24", "#F59E0B", "#FCD34D",
    "#FB923C", "#A78BFA",
  ], [palette.accent, palette.accentStrong]);

  if (!particlesRef.current) {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const shapes: Array<"circle" | "rect" | "diamond" | "star"> = ["circle", "rect", "diamond", "star"];
      return {
        x: new Animated.Value(0),
        y: new Animated.Value(0),
        opacity: new Animated.Value(0),
        rotate: new Animated.Value(0),
        scale: new Animated.Value(0),
        color: colors[i % colors.length],
        size: 3 + Math.random() * 6,
        shape: shapes[i % 4],
        wave: Math.random(),
        spreadFactor: Math.random(),
      };
    });
  }

  const particles = particlesRef.current;

  const triggerConfetti = useCallback(() => {
    if (!particles) return;

    const burstCount = 2;
    const burstDelay = 250;

    for (let burst = 0; burst < burstCount; burst++) {
      particles.forEach((particle, _i) => {
        const startDelay = burst * burstDelay + Math.random() * 120;

        setTimeout(() => {
          particle.x.setValue(0);
          particle.y.setValue(0);
          particle.opacity.setValue(0);
          particle.rotate.setValue(0);
          particle.scale.setValue(0);

          const spread = burst === 0 ? 1.0 : 0.7;
          const angle = -Math.PI * (0.15 + Math.random() * 0.7);
          const velocity = (40 + Math.random() * 90) * spread;
          const targetX = Math.cos(angle) * velocity * (Math.random() > 0.5 ? 1 : -1);
          const launchY = -40 - Math.random() * 60;
          const gravityFall = 120 + Math.random() * 100;
          const wobbleX = (Math.random() - 0.5) * 40;

          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0.85 + Math.random() * 0.15,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.spring(particle.scale, {
                toValue: 0.8 + Math.random() * 0.5,
                friction: 4,
                tension: 180,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0.1,
                duration: 400,
                delay: 300,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.x, {
                toValue: targetX,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.x, {
                toValue: targetX + wobbleX,
                duration: 400,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.y, {
                toValue: launchY,
                duration: 320,
                useNativeDriver: true,
              }),
              Animated.timing(particle.y, {
                toValue: launchY + gravityFall,
                duration: 620,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(particle.rotate, {
              toValue: 3 + Math.random() * 6,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(550),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 380,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }, startDelay);
      });
    }
  }, [particles]);

  useEffect(() => {
    if (active && !hasTriggered.current) {
      hasTriggered.current = true;
      triggerConfetti();
    } else if (!active) {
      hasTriggered.current = false;
    }
  }, [active, triggerConfetti]);

  if (!particles) return null;

  const particleOriginY = originY ?? 200;
  const halfWidth = originWidth / 2;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, i) => {
        const rotateStr = particle.rotate.interpolate({
          inputRange: [0, 9],
          outputRange: ["0deg", "3240deg"],
        });

        const isDiamond = particle.shape === "diamond";
        const isStar = particle.shape === "star";
        const isRect = particle.shape === "rect";
        const w = isStar ? particle.size * 1.2 : particle.size;
        const h = isRect ? particle.size * 2 : isStar ? particle.size * 1.2 : particle.size;
        const br = particle.shape === "circle" ? particle.size / 2 : isDiamond ? 1 : isStar ? 0.5 : 1.5;

        const horizontalOffset = halfWidth > 0
          ? (particle.spreadFactor * originWidth) - halfWidth
          : 0;

        return (
          <Animated.View
            key={`confetti-${i}`}
            style={[
              styles.particle,
              {
                top: particleOriginY,
                left: '50%',
                marginLeft: horizontalOffset,
                width: w,
                height: h,
                backgroundColor: particle.color,
                borderRadius: br,
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.x },
                  { translateY: particle.y },
                  { rotate: rotateStr },
                  { scale: particle.scale },
                  ...(isDiamond ? [{ rotate: "45deg" as const }] : []),
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,

    zIndex: 9999,
    elevation: 9999,
    overflow: "visible" as const,
  },
  particle: {
    position: "absolute",
  },
});
