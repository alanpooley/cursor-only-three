import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Brain, ChevronLeft, ChevronRight, Sun } from "lucide-react-native";

import { ThemePalette } from "@/constants/onlyThreeTheme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SIDEBAR_WIDTH = Math.min(320, Math.round(SCREEN_WIDTH * 0.86));
const ANIM_MS = 240;
const SWIPE_OPEN_DISTANCE = 48;
const SWIPE_OPEN_VELOCITY = 420;
const SWIPE_CLOSE_DISTANCE = 56;
const SWIPE_CLOSE_VELOCITY = 480;
const DOCK_SWIPE_UP_DISTANCE = 24;
const DOCK_SWIPE_UP_VELOCITY = 320;

interface SidebarTriptychLayoutProps {
  palette: ThemePalette;
  memoryOpen: boolean;
  tomorrowOpen: boolean;
  onToggleMemory: () => void;
  onToggleTomorrow: () => void;
  onOpenMemory: () => void;
  onOpenTomorrow: () => void;
  onDismissOverlay: () => void;
  memory: React.ReactNode;
  today: React.ReactNode;
  tomorrow: React.ReactNode;
}

function createDockGesture(onOpen: () => void, side: "left" | "right") {
  return Gesture.Exclusive(
    Gesture.Pan()
      .minDistance(8)
      .onEnd((event) => {
        const { translationX, translationY, velocityX, velocityY } = event;
        const swipeUp = translationY < -DOCK_SWIPE_UP_DISTANCE || velocityY < -DOCK_SWIPE_UP_VELOCITY;
        const swipeOut =
          side === "left"
            ? translationX > SWIPE_OPEN_DISTANCE || velocityX > SWIPE_OPEN_VELOCITY
            : translationX < -SWIPE_OPEN_DISTANCE || velocityX < -SWIPE_OPEN_VELOCITY;

        if (swipeUp || swipeOut) {
          onOpen();
        }
      }),
    Gesture.Tap().onEnd(onOpen)
  );
}

export function SidebarTriptychLayout({
  palette,
  memoryOpen,
  tomorrowOpen,
  onToggleMemory,
  onToggleTomorrow,
  onOpenMemory,
  onOpenTomorrow,
  onDismissOverlay,
  memory,
  today,
  tomorrow,
}: SidebarTriptychLayoutProps) {
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const memoryAnim = useRef(new Animated.Value(memoryOpen ? 1 : 0)).current;
  const tomorrowAnim = useRef(new Animated.Value(tomorrowOpen ? 1 : 0)).current;
  const backdropAnim = useRef(new Animated.Value(memoryOpen || tomorrowOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(memoryAnim, {
      toValue: memoryOpen ? 1 : 0,
      duration: ANIM_MS,
      useNativeDriver: true,
    }).start();
  }, [memoryOpen, memoryAnim]);

  useEffect(() => {
    Animated.timing(tomorrowAnim, {
      toValue: tomorrowOpen ? 1 : 0,
      duration: ANIM_MS,
      useNativeDriver: true,
    }).start();
  }, [tomorrowOpen, tomorrowAnim]);

  useEffect(() => {
    Animated.timing(backdropAnim, {
      toValue: memoryOpen || tomorrowOpen ? 1 : 0,
      duration: ANIM_MS,
      useNativeDriver: true,
    }).start();
  }, [memoryOpen, tomorrowOpen, backdropAnim]);

  const memoryTranslateX = memoryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SIDEBAR_WIDTH, 0],
  });

  const tomorrowTranslateX = tomorrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SIDEBAR_WIDTH, 0],
  });

  const overlayOpen = memoryOpen || tomorrowOpen;

  const contentSwipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-22, 22])
        .failOffsetY([-18, 18])
        .onEnd((event) => {
          const { translationX, velocityX } = event;

          if (memoryOpen) {
            if (translationX < -SWIPE_CLOSE_DISTANCE || velocityX < -SWIPE_CLOSE_VELOCITY) {
              onDismissOverlay();
            }
            return;
          }

          if (tomorrowOpen) {
            if (translationX > SWIPE_CLOSE_DISTANCE || velocityX > SWIPE_CLOSE_VELOCITY) {
              onDismissOverlay();
            }
            return;
          }

          if (translationX > SWIPE_OPEN_DISTANCE || velocityX > SWIPE_OPEN_VELOCITY) {
            onOpenMemory();
            return;
          }

          if (translationX < -SWIPE_OPEN_DISTANCE || velocityX < -SWIPE_OPEN_VELOCITY) {
            onOpenTomorrow();
          }
        }),
    [memoryOpen, tomorrowOpen, onDismissOverlay, onOpenMemory, onOpenTomorrow]
  );

  const memoryDockGesture = useMemo(() => createDockGesture(onOpenMemory, "left"), [onOpenMemory]);
  const tomorrowDockGesture = useMemo(() => createDockGesture(onOpenTomorrow, "right"), [onOpenTomorrow]);

  const memoryPanelCloseGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-18, 18])
        .failOffsetY([-20, 20])
        .onEnd((event) => {
          if (event.translationX < -SWIPE_CLOSE_DISTANCE || event.velocityX < -SWIPE_CLOSE_VELOCITY) {
            onDismissOverlay();
          }
        }),
    [onDismissOverlay]
  );

  const tomorrowPanelCloseGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-18, 18])
        .failOffsetY([-20, 20])
        .onEnd((event) => {
          if (event.translationX > SWIPE_CLOSE_DISTANCE || event.velocityX > SWIPE_CLOSE_VELOCITY) {
            onDismissOverlay();
          }
        }),
    [onDismissOverlay]
  );

  return (
    <View style={styles.root}>
      <View style={styles.centerColumn}>
        <GestureDetector gesture={contentSwipeGesture}>
          <View style={styles.centerBody}>{today}</View>
        </GestureDetector>

        {!overlayOpen && (
          <View style={[styles.edgeDock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <GestureDetector gesture={memoryDockGesture}>
              <View
                style={[styles.edgeDockBtn, styles.edgeDockBtnLeft]}
                accessibilityLabel="Open Memory sidebar"
                accessibilityRole="button"
                testID="open-memory-sidebar"
              >
                <Brain color={palette.accent} size={15} strokeWidth={2.2} />
                <Text style={styles.edgeDockLabel}>Memory</Text>
              </View>
            </GestureDetector>
            <View style={styles.edgeDockDivider} />
            <GestureDetector gesture={tomorrowDockGesture}>
              <View
                style={[styles.edgeDockBtn, styles.edgeDockBtnRight]}
                accessibilityLabel="Open Tomorrow sidebar"
                accessibilityRole="button"
                testID="open-tomorrow-sidebar"
              >
                <Text style={styles.edgeDockLabel}>Tomorrow</Text>
                <Sun color={palette.accent} size={15} strokeWidth={2.2} />
              </View>
            </GestureDetector>
          </View>
        )}
      </View>

      <Animated.View
        pointerEvents={overlayOpen ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropAnim }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismissOverlay}
          accessibilityLabel="Close sidebar"
          testID="sidebar-backdrop"
        />
      </Animated.View>

      <Animated.View
        pointerEvents={memoryOpen ? "auto" : "none"}
        style={[
          styles.overlayPanel,
          styles.leftOverlay,
          {
            transform: [{ translateX: memoryTranslateX }],
            opacity: memoryAnim,
          },
        ]}
      >
        <GestureDetector gesture={memoryPanelCloseGesture}>
          <View style={[styles.sidebarPanel, styles.leftPanel]}>
            <View style={styles.panelHeader}>
              <View style={styles.panelAccent} />
              <View style={styles.panelHeaderCopy}>
                <Text style={styles.panelTitle}>Memory</Text>
                <Text style={styles.panelCaption}>Ideas without a day</Text>
              </View>
              <Pressable
                onPress={onToggleMemory}
                style={({ pressed }) => [styles.panelCloseBtn, pressed && styles.panelCloseBtnPressed]}
                accessibilityLabel="Close Memory sidebar"
                testID="close-memory-sidebar"
              >
                <ChevronLeft color={palette.muted} size={16} strokeWidth={2.2} />
              </Pressable>
            </View>
            <View style={styles.panelBody}>{memory}</View>
          </View>
        </GestureDetector>
      </Animated.View>

      <Animated.View
        pointerEvents={tomorrowOpen ? "auto" : "none"}
        style={[
          styles.overlayPanel,
          styles.rightOverlay,
          {
            transform: [{ translateX: tomorrowTranslateX }],
            opacity: tomorrowAnim,
          },
        ]}
      >
        <GestureDetector gesture={tomorrowPanelCloseGesture}>
          <View style={[styles.sidebarPanel, styles.rightPanel]}>
            <View style={styles.panelHeader}>
              <Pressable
                onPress={onToggleTomorrow}
                style={({ pressed }) => [styles.panelCloseBtn, pressed && styles.panelCloseBtnPressed]}
                accessibilityLabel="Close Tomorrow sidebar"
                testID="close-tomorrow-sidebar"
              >
                <ChevronRight color={palette.muted} size={16} strokeWidth={2.2} />
              </Pressable>
              <View style={[styles.panelHeaderCopy, styles.panelHeaderCopyRight]}>
                <Text style={[styles.panelTitle, styles.panelTitleRight]}>Tomorrow</Text>
                <Text style={[styles.panelCaption, styles.panelCaptionRight]}>Plan ahead</Text>
              </View>
              <View style={[styles.panelAccent, styles.panelAccentRight]} />
            </View>
            <View style={styles.panelBody}>{tomorrow}</View>
          </View>
        </GestureDetector>
      </Animated.View>
    </View>
  );
}

function createStyles(p: ThemePalette) {
  const ui = p.ui;
  const panelShadow = ui.useCardShadow
    ? {
        shadowColor: "#000",
        shadowOpacity: 0.42,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 0 },
        elevation: 24,
      }
    : {
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: -4, height: 0 },
        elevation: 16,
      };

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: p.backgroundBottom,
      overflow: "hidden",
    },
    centerColumn: {
      flex: 1,
      backgroundColor: p.backgroundBottom,
      position: "relative",
    },
    centerBody: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: ui.variant === "obsidian" ? "rgba(8,6,14,0.72)" : "rgba(0,0,0,0.45)",
      zIndex: 10,
    },
    overlayPanel: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: SIDEBAR_WIDTH,
      zIndex: 20,
    },
    leftOverlay: {
      left: 0,
    },
    rightOverlay: {
      right: 0,
    },
    sidebarPanel: {
      flex: 1,
      backgroundColor: p.panel,
      ...panelShadow,
    },
    leftPanel: {
      borderRightWidth: 1,
      borderRightColor: p.line,
    },
    rightPanel: {
      borderLeftWidth: 1,
      borderLeftColor: p.line,
    },
    panelHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: p.line,
      gap: 8,
      backgroundColor: p.surface,
    },
    panelAccent: {
      width: 3,
      alignSelf: "stretch",
      borderRadius: 2,
      backgroundColor: p.accent,
      marginVertical: 2,
    },
    panelAccentRight: {
      marginLeft: 0,
    },
    panelHeaderCopy: {
      flex: 1,
      gap: 2,
    },
    panelHeaderCopyRight: {
      alignItems: "flex-end",
    },
    panelTitle: {
      color: p.ink,
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    panelTitleRight: {
      textAlign: "right",
    },
    panelCaption: {
      color: p.muted,
      fontSize: 10,
      lineHeight: 13,
    },
    panelCaptionRight: {
      textAlign: "right",
    },
    panelCloseBtn: {
      width: 28,
      height: 28,
      borderRadius: ui.iconButtonRadius,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.surfaceSoft,
      borderWidth: 1,
      borderColor: p.line,
    },
    panelCloseBtnPressed: {
      opacity: 0.7,
      backgroundColor: p.surfaceElevated,
    },
    panelBody: {
      flex: 1,
      backgroundColor: p.backgroundBottom,
    },
    edgeDock: {
      position: "absolute",
      left: 16,
      right: 16,
      bottom: 0,
      zIndex: 6,
      flexDirection: "row",
      alignItems: "stretch",
      borderWidth: 1,
      borderColor: p.line,
      borderRadius: ui.iconButtonRadius,
      backgroundColor: p.panel,
      overflow: "hidden",
    },
    edgeDockBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 12,
      backgroundColor: p.surface,
    },
    edgeDockBtnLeft: {
      borderTopLeftRadius: ui.iconButtonRadius,
      borderBottomLeftRadius: ui.iconButtonRadius,
    },
    edgeDockBtnRight: {
      borderTopRightRadius: ui.iconButtonRadius,
      borderBottomRightRadius: ui.iconButtonRadius,
    },
    edgeDockLabel: {
      color: p.ink,
      fontSize: 13,
      fontWeight: "600" as const,
      letterSpacing: 0.2,
    },
    edgeDockDivider: {
      width: 1,
      backgroundColor: p.line,
    },
  });
}
