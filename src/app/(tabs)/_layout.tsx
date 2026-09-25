import { Tabs } from 'expo-router/tabs';
import { Text, type ColorValue } from 'react-native';

import { colors } from '@/theme';

function icon(glyph: string) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Aprender', tabBarIcon: icon('🎹') }} />
      <Tabs.Screen name="hinos" options={{ title: 'Hinos', tabBarIcon: icon('♪') }} />
      <Tabs.Screen name="progresso" options={{ title: 'Progresso', tabBarIcon: icon('★') }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: icon('⚙') }} />
    </Tabs>
  );
}
