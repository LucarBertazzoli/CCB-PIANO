import { useLocalSearchParams } from 'expo-router';

import { Materials } from '@/features/trilha/Materials';

/** Unidade da trilha (ou materiais do volume): lições, plano de aula e atividades da CCB. */
export default function MaterialsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Materials id={id} />;
}
