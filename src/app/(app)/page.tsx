import { CartaoAprender } from '@/features/aprender/components/cartao-aprender';
import { PrimeirosPassos } from '@/features/aprender/components/primeiros-passos';
import { PainelTela } from '@/features/painel/components/painel-tela';
import { getUsuarioAtual } from '@/shared/auth/usuario-atual.server';

/**
 * Painel (FE-22, FE-58), com os primeiros passos (FE-66) e o cartão do Aprender
 * logo abaixo deles (FE-67). Sem `metadata.title`: a aba mostra "Doce Fatia".
 */
export default async function HomePage() {
  const usuario = await getUsuarioAtual();

  return (
    <PainelTela
      nome={usuario.nome}
      primeirosPassos={
        <>
          <PrimeirosPassos />
          <CartaoAprender />
        </>
      }
    />
  );
}
