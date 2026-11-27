import Link from 'next/link';
import { Aviso } from '@/shared/ui/alert';
import { AVISO_COBRANCA_DUPLA } from '../gastos-indiretos.calculos';

/**
 * Conta do mês com nome de salário (FE-78): o trabalho agora entra pelo valor
 * da sua hora. Só avisa; a conta continua salva até ela tirar.
 */
export function AvisoCobrancaDupla({ descricao }: { descricao?: string }) {
  return (
    <Aviso>
      <p>
        {descricao ? (
          <strong className="font-semibold">{`“${descricao}”: `}</strong>
        ) : null}
        {AVISO_COBRANCA_DUPLA}
      </p>
      <Link
        href="/configuracoes"
        className="self-start text-body font-extrabold text-accent underline underline-offset-4"
      >
        Ver Ajustes de preço
      </Link>
    </Aviso>
  );
}
