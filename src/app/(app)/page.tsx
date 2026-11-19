import { PainelTela } from '@/features/painel/components/painel-tela';
import { getUsuarioAtual } from '@/shared/auth/usuario-atual.server';

/** Painel (FE-22). Sem `metadata.title`: a aba mostra "LucroAI". */
export default async function HomePage() {
  const usuario = await getUsuarioAtual();

  return <PainelTela empresa={usuario.empresa.nome} />;
}
