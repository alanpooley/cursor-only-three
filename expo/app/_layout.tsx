import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useOnlyThree, OnlyThreeProvider } from "@/providers/OnlyThreeProvider";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { currentPalette: p, settings } = useOnlyThree();
  const isLight = settings.theme === "light";

  return (
    <>
    <StatusBar barStyle={isLight ? "dark-content" : "light-content"} />
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerTintColor: p.ink,
        headerStyle: { backgroundColor: p.backgroundTop },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: p.backgroundBottom },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ title: "History" }} />
      <Stack.Screen name="uncompleted" options={{ title: "Uncompleted" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="streak" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <OnlyThreeProvider>
        <GestureHandlerRootView>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </OnlyThreeProvider>
    </QueryClientProvider>
  );
}
