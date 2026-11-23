import { PainelTela } from '@/features/painel/components/painel-tela';
import { getUsuarioAtual } from '@/shared/auth/usuario-atual.server';

/** Painel (FE-22, FE-58). Sem `metadata.title`: a aba mostra "Doce Fatia". */
export default async function HomePage() {
  const usuario = await getUsuarioAtual();

  return <PainelTela nome={usuario.nome} />;
}
