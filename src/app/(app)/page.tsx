import { TelaProvisoria } from '@/features/navegacao/components/tela-provisoria';

/** Provisória: substituída pelo painel na FE-22. Sem `metadata.title`: a aba mostra "LucroAI". */
export default function HomePage() {
  return <TelaProvisoria title="LucroAI" subtitle="Seu painel financeiro" />;
}
