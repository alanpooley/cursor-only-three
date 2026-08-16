import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Sun,
  Sunrise,
  Ban,
  Brain,
  History,
  Flame,
  ChevronRight,
  X,
  Target,
  Palette,
  Moon,
  CloudSun,
  Info,
  TrendingUp,
  Medal,
  Gem,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { ThemePalette, themes } from "@/constants/onlyThreeTheme";
import { ThemeMode } from "@/types/only-three";

interface SlideData {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  accentColor: string;
  glowColor: string;
  isWelcome?: boolean;
  isThemePicker?: boolean;
  hasStatsTooltip?: boolean;
}

interface OnboardingTutorialProps {
  palette: ThemePalette;
  onComplete: () => void;
  onThemeChange: (theme: ThemeMode) => void;
  currentTheme: ThemeMode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const THEME_OPTIONS: Array<{ mode: ThemeMode; label: string; description: string; iconColor: string }> = [
  { mode: "night", label: "Night", description: "Warm & cozy", iconColor: "#E3B26B" },
  { mode: "dark", label: "Dark", description: "Cool & deep", iconColor: "#6B9FE3" },
  { mode: "light", label: "Light", description: "Clean & bright", iconColor: "#B45309" },
  { mode: "obsidian", label: "Obsidian", description: "Clean v2.0", iconColor: "#7F6DF2" },
];

function getSlides(_p: ThemePalette): SlideData[] {
  return [
    {
      id: "welcome",
      icon: <Text style={{ fontSize: 48 }}>👋</Text>,
      title: "Welcome to\nOnly Three",
      body: "Three tasks. Every day.\nNothing more, nothing less.\n\nSimplicity is your superpower.",
      accentColor: "#FF8C42",
      glowColor: "rgba(255,140,66,0.18)",
      isWelcome: true,
    },
    {
      id: "about",
      icon: <Target color="#34D399" size={40} strokeWidth={1.8} />,
      title: "Why Only Three?",
      body: "Your best days come from doing the right things — not everything.\n\nThree focused tasks daily builds real momentum. Clarity beats clutter.",
      accentColor: "#34D399",
      glowColor: "rgba(52,211,153,0.15)",
    },
    {
      id: "theme",
      icon: <Palette color="#C084FC" size={40} strokeWidth={1.8} />,
      title: "Choose Your Look",
      body: "Pick a theme that feels right.\nYou can always change this later in Settings.",
      accentColor: "#C084FC",
      glowColor: "rgba(192,132,252,0.15)",
      isThemePicker: true,
    },
    {
      id: "today",
      icon: <Sun color="#F59E0B" size={40} strokeWidth={1.8} />,
      title: "Today",
      body: "Each morning, you have three tasks.\nNo more, no less.\n\nFocus on what truly matters today.",
      accentColor: "#F59E0B",
      glowColor: "rgba(245,158,11,0.15)",
    },
    {
      id: "tomorrow",
      icon: <Sunrise color="#6B9FE3" size={40} strokeWidth={1.8} />,
      title: "Tomorrow",
      body: "Plan your three tasks the night before.\n\nWake up knowing exactly what to do — no decision fatigue.",
      accentColor: "#6B9FE3",
      glowColor: "rgba(107,159,227,0.15)",
    },
    {
      id: "memory",
      icon: <Brain color="#E879F9" size={40} strokeWidth={1.8} />,
      title: "Memory",
      body: "A place for tasks that don't fit into today or tomorrow.\n\nCapture ideas, errands, or anything you want to remember — and push them to Tomorrow when you're ready.",
      accentColor: "#E879F9",
      glowColor: "rgba(232,121,249,0.15)",
    },
    {
      id: "uncompleted",
      icon: <Ban color="#FF6B6B" size={40} strokeWidth={1.8} />,
      title: "Uncompleted",
      body: "Missed a task? It doesn't vanish.\n\nUncompleted tasks are kept here so nothing important slips away.",
      accentColor: "#FF6B6B",
      glowColor: "rgba(255,107,107,0.15)",
    },
    {
      id: "history",
      icon: <History color="#A78BFA" size={40} strokeWidth={1.8} />,
      title: "History",
      body: "A calm record of what you've done.\n\nLook back on past days and see the progress you've made.",
      accentColor: "#A78BFA",
      glowColor: "rgba(167,139,250,0.15)",
    },
    {
      id: "streaks",
      icon: <Flame color="#FF9F43" fill="rgba(255,159,67,0.3)" size={40} strokeWidth={1.8} />,
      title: "Streaks & Stats",
      body: "Complete all your tasks daily to build your streak. Your Momentum Score tracks how consistently you're showing up — factoring in recent activity, completion rate, and streak length.\n\nTap below to learn more about your stats.",
      accentColor: "#FF9F43",
      glowColor: "rgba(255,159,67,0.15)",
      hasStatsTooltip: true,
    },
  ];
}

function ThemePickerCard({ currentTheme, onThemeChange }: { currentTheme: ThemeMode; onThemeChange: (t: ThemeMode) => void }) {
  return (
    <View style={themePickerStyles.container}>
      {THEME_OPTIONS.map((option) => {
        const isSelected = currentTheme === option.mode;
        const optionPalette = themes[option.mode];
        return (
          <Pressable
            key={option.mode}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onThemeChange(option.mode);
            }}
            style={({ pressed }) => [
              themePickerStyles.option,
              {
                backgroundColor: isSelected ? option.iconColor : optionPalette.surfaceRaised,
                borderColor: isSelected ? option.iconColor : optionPalette.line,
                borderWidth: 1.5,
              },
              pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
            ]}
            testID={`theme-option-${option.mode}`}
          >
            {option.mode === "night" && <Moon color={isSelected ? "#fff" : option.iconColor} size={18} strokeWidth={2} />}
            {option.mode === "dark" && <CloudSun color={isSelected ? "#fff" : option.iconColor} size={18} strokeWidth={2} />}
            {option.mode === "light" && <Sun color={isSelected ? "#fff" : option.iconColor} size={18} strokeWidth={2} />}
            {option.mode === "obsidian" && <Gem color={isSelected ? "#fff" : option.iconColor} size={18} strokeWidth={2} />}
            <Text style={[
              themePickerStyles.optionLabel,
              { color: isSelected ? "#fff" : optionPalette.ink },
            ]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function StatsTooltipContent({ palette: p, onClose }: { palette: ThemePalette; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={tooltipStyles.overlay} onPress={onClose}>
        <Pressable style={[tooltipStyles.card, { backgroundColor: p.surfaceRaised }]} onPress={() => {}}>
          <View style={tooltipStyles.header}>
            <TrendingUp color="#FF9F43" size={20} strokeWidth={2.2} />
            <Text style={[tooltipStyles.title, { color: p.ink }]}>Your Stats Explained</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X color={p.muted} size={18} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={tooltipStyles.section}>
            <View style={[tooltipStyles.iconBadge, { backgroundColor: "rgba(255,159,67,0.15)" }]}>
              <Flame color="#FF9F43" size={16} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[tooltipStyles.sectionTitle, { color: p.ink }]}>Streaks</Text>
              <Text style={[tooltipStyles.sectionDesc, { color: p.subtext }]}>The number of consecutive days you've completed all your tasks from Today. Miss a day and it resets to zero.</Text>
            </View>
          </View>

          <View style={tooltipStyles.section}>
            <View style={[tooltipStyles.iconBadge, { backgroundColor: "rgba(52,211,153,0.15)" }]}>
              <TrendingUp color="#34D399" size={16} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[tooltipStyles.sectionTitle, { color: p.ink }]}>Momentum Score</Text>
              <Text style={[tooltipStyles.sectionDesc, { color: p.subtext }]}>A 0–100 score measuring your overall productivity momentum. It weighs recent activity, completion rate, perfect days, and streak length to show how strong your habit is right now.</Text>
            </View>
          </View>

          <View style={tooltipStyles.section}>
            <View style={[tooltipStyles.iconBadge, { backgroundColor: "rgba(167,139,250,0.15)" }]}>
              <Medal color="#A78BFA" size={16} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[tooltipStyles.sectionTitle, { color: p.ink }]}>Perfect Days</Text>
              <Text style={[tooltipStyles.sectionDesc, { color: p.subtext }]}>Days where you completed all three tasks from Today. The more perfect days, the higher your overall scores.</Text>
            </View>
          </View>

          <View style={[tooltipStyles.footer, { backgroundColor: p.surfaceSoft }]}>
            <Text style={[tooltipStyles.footerText, { color: p.muted }]}>Visit the Stats page for detailed breakdowns, charts, and historical data.</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function OnboardingTutorial({ palette: p, onComplete, onThemeChange, currentTheme }: OnboardingTutorialProps) {
  const slides = getSlides(p);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showStatsTooltip, setShowStatsTooltip] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<SlideData>>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(slides.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.spring(slideAnims[0], {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [fadeAnim, slideAnims]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const newIndex = viewableItems[0].index;
        setCurrentIndex(newIndex);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        slideAnims[newIndex].setValue(0);
        Animated.spring(slideAnims[newIndex], {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }
  }, [currentIndex, slides.length, fadeAnim, onComplete]);

  const handleSkip = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  }, [fadeAnim, onComplete]);

  const isLastSlide = currentIndex === slides.length - 1;

  const renderSlide = useCallback(
    ({ item, index }: { item: SlideData; index: number }) => {
      const anim = slideAnims[index];
      return (
        <View style={styles.slideOuter}>
          <Animated.View
            style={[
              styles.slideContent,
              {
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.glowColor }]}>
              <View style={[styles.iconInner, { backgroundColor: item.glowColor }]}>
                {item.icon}
              </View>
            </View>
            {item.isWelcome ? (
              <View style={styles.welcomeTitleWrap}>
                <Text style={[styles.welcomeLabel, { color: p.subtext }]}>Welcome to</Text>
                <Text style={[styles.welcomeAppName, { color: item.accentColor }]}>Only Three</Text>
              </View>
            ) : (
              <Text style={[styles.slideTitle, { color: item.accentColor }]}>{item.title}</Text>
            )}
            <Text style={[styles.slideBody, { color: p.subtext }]}>{item.body}</Text>
            {item.isThemePicker && (
              <ThemePickerCard currentTheme={currentTheme} onThemeChange={onThemeChange} />
            )}
            {item.hasStatsTooltip && (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowStatsTooltip(true);
                }}
                style={({ pressed }) => [
                  styles.statsTooltipButton,
                  { backgroundColor: "rgba(255,159,67,0.12)", borderColor: "rgba(255,159,67,0.3)" },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
                ]}
                testID="tutorial-stats-tooltip"
              >
                <Info color="#FF9F43" size={16} strokeWidth={2.2} />
                <Text style={[styles.statsTooltipText, { color: "#FF9F43" }]}>Learn about Streaks, Momentum & Perfect Days</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      );
    },
    [slideAnims, p, currentTheme, onThemeChange, setShowStatsTooltip]
  );

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={[p.backgroundTop, p.backgroundMiddle, p.backgroundBottom]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={[styles.ambientOrb, styles.orbTopRight, { backgroundColor: slides[currentIndex].glowColor }]} />
      <View pointerEvents="none" style={[styles.ambientOrb, styles.orbBottomLeft, { backgroundColor: slides[currentIndex].glowColor, opacity: 0.08 }]} />

      <View style={styles.topBar}>
        <Pressable
          onPress={handleSkip}
          style={({ pressed }) => [styles.skipButton, { backgroundColor: p.surfaceSoft }, pressed && { opacity: 0.6 }]}
          testID="tutorial-skip"
        >
          <X color={p.muted} size={16} strokeWidth={2.5} />
          <Text style={[styles.skipText, { color: p.muted }]}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.headerArea}>
        <Text style={[styles.appTitle, { color: p.ink }]}>Only Three</Text>
        <Text style={[styles.appSubtitle, { color: p.muted }]}>A quick look around</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        style={styles.flatList}
      />

      {showStatsTooltip && (
        <StatsTooltipContent palette={p} onClose={() => setShowStatsTooltip(false)} />
      )}

      <View style={styles.bottomArea}>
        <View style={styles.pagination}>
          {slides.map((slide, i) => (
            <View
              key={slide.id}
              style={[
                styles.dot,
                { backgroundColor: p.muted },
                i === currentIndex && { backgroundColor: slides[currentIndex].accentColor, width: 24 },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.nextButton,
            { backgroundColor: slides[currentIndex].accentColor },
            pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
          ]}
          testID="tutorial-next"
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? "Let's Plan Tomorrow" : "Next"}
          </Text>
          {!isLastSlide && <ChevronRight color="#fff" size={18} strokeWidth={2.5} />}
        </Pressable>

        <Text style={[styles.pageIndicator, { color: p.muted }]}>
          {currentIndex + 1} of {slides.length}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  ambientOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTopRight: {
    width: 280,
    height: 280,
    top: -80,
    right: -80,
    opacity: 0.2,
  },
  orbBottomLeft: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -60,
  },
  topBar: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  headerArea: {
    alignItems: "center",
    paddingTop: SCREEN_HEIGHT * 0.1,
    gap: 6,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.8,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  flatList: {
    flex: 1,
  },
  slideOuter: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: "center",
    gap: 20,
    maxWidth: 320,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  slideBody: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "400" as const,
  },
  welcomeTitleWrap: {
    alignItems: "center",
    gap: 2,
  },
  welcomeLabel: {
    fontSize: 18,
    fontWeight: "500" as const,
    letterSpacing: 0.2,
  },
  welcomeAppName: {
    fontSize: 38,
    fontWeight: "800" as const,
    letterSpacing: -1.2,
  },
  bottomArea: {
    alignItems: "center",
    paddingBottom: SCREEN_HEIGHT * 0.08,
    gap: 18,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.35,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 999,
    minWidth: 180,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  statsTooltipButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  statsTooltipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
});

const tooltipStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 24,
  },
  card: {
    width: "100%" as const,
    maxWidth: 360,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: -0.4,
  },
  section: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400" as const,
  },
  footer: {
    borderRadius: 12,
    padding: 12,
    marginTop: 2,
  },
  footerText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
});

const themePickerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    gap: 12,
    marginTop: 8,
    justifyContent: "center",
  },
  option: {
    width: "47%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
  },
});
