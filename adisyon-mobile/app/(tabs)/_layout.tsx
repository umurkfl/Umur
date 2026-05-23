import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <Ionicons
      name={name}
      size={26}
      color={focused ? "#f97316" : "#9ca3af"}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#e5e7eb",
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "search" : "search-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Ekle",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "add-circle" : "add-circle-outline"} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? "person" : "person-outline"} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
