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
        // Paisagem: menu lateral (trilho) em vez de abas embaixo.
        tabBarPosition: 'left',
        tabBarVariant: 'material',
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: { backgroundColor: colors.bgElevated, borderRightColor: colors.border, width: 84 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Hinos', tabBarIcon: icon('♪') }} />
      {/* Trilha de aprendizagem: oculta por enquanto (o foco agora são os hinos). */}
      <Tabs.Screen name="trilha" options={{ title: 'Trilha', href: null }} />
      <Tabs.Screen name="ajustes" options={{ title: 'Ajustes', tabBarIcon: icon('⚙') }} />
    </Tabs>
  );
}
