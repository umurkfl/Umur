import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="restaurant/[slug]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Geri",
            headerTintColor: "#f97316",
            headerStyle: { backgroundColor: "#fff" },
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
