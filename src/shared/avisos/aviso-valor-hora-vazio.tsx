'use client';

import Link from 'next/link';
import { Aviso } from '@/shared/ui/alert';
import { useAvisos } from './avisos-context';

export const TEXTO_VALOR_HORA_VAZIO =
  'Você ainda não disse quanto vale sua hora. Sem isso, seu trabalho não entra no preço.';

/**
 * Valor da hora vazio (FE-78): com `valorHoraVazio` do `GET /alertas` (já em
 * cache pelo `AvisosProvider`, sem requisição nova), aviso com o link para os
 * Ajustes de preço. Some quando ela preenche o valor da hora, porque salvar a
 * configuração invalida os alertas. Fica em `shared/` porque o Início e o
 * detalhe da receita mostram o mesmo aviso.
 */
export function AvisoValorHoraVazio() {
  const { alertas } = useAvisos();

  if (!alertas?.valorHoraVazio) return null;

  return (
    <Aviso>
      <p>{TEXTO_VALOR_HORA_VAZIO}</p>
      <Link
        href="/configuracoes"
        className="self-start text-body font-extrabold text-accent underline underline-offset-4"
      >
        Dizer o valor da sua hora
      </Link>
    </Aviso>
  );
}
