import type { Alertas } from '@/shared/api/contracts/catalog';
import type { StatusVenda } from '@/shared/api/contracts/enums';
import { isFaturavel } from '@/shared/domain/vendas';
import { arredondarCentavos, formatMoeda } from '@/shared/format/moeda';
import type { TermoId } from './termos';

/*
 * Dica na hora certa (FE-68, docs/aprender.md#dica-na-hora-certa): no máximo
 * uma dica por sessão, cada uma uma vez só, e nenhuma nos primeiros 30
 * segundos da primeira sessão. Os dados vêm do que a tela já carregou e dos
 * alertas do aviso ao entrar; nada é buscado aqui.
 */

export const DICA_IDS = [
  'margem-negativa',
  'estoque-negativo',
  'preco-que-precisa-subir',
  'taxa-do-canal',
  'primeiro-mes',
  'tempo-de-trabalho',
] as const;

export type DicaId = (typeof DICA_IDS)[number];

export function isDicaId(id: unknown): id is DicaId {
  return typeof id === 'string' && (DICA_IDS as readonly string[]).includes(id);
}

/** Onde a dica aparece: cada tela tem as suas. */
export type TelaDaDica =
  | 'receita'
  | 'simulacao'
  | 'insumos'
  | 'estoque'
  | 'receitas'
  | 'vendas'
  | 'inicio'
  | 'receita-form';

const DICAS_DA_TELA: Record<TelaDaDica, readonly DicaId[]> = {
  receita: ['margem-negativa'],
  simulacao: ['margem-negativa'],
  insumos: ['estoque-negativo'],
  estoque: ['estoque-negativo'],
  receitas: ['preco-que-precisa-subir'],
  vendas: ['taxa-do-canal'],
  inicio: ['primeiro-mes'],
  'receita-form': ['tempo-de-trabalho'],
};

/** Trecho do texto: texto simples ou um termo, que a tela mostra com `<Termo>`. */
export type ParteDaDica = string | { termo: TermoId; texto: string };

export type Dica = {
  id: DicaId;
  titulo: string;
  texto: ParteDaDica[];
  acao: { rotulo: string; href: string };
};

/** O que a tela já tem para os gatilhos; só o que ela mostra. */
export type DadosDaDica = {
  /** Receita com lucro por unidade < 0 (a mesma condição do `avisoDePrejuizo`). */
  prejuizo?: {
    receitaId: number;
    receita: string;
    /** Custo de 1 unidade. */
    custo: number;
    /** Preço em que a receita está. */
    preco: number;
    /** O lucro por unidade da tela; a dica só aparece quando é negativo. */
    lucroPorUnidade: number;
    /** Para onde leva "Ajustar o preço". */
    hrefAjuste: string;
  } | null;
  /** `GET /alertas`, do cache do aviso ao entrar. */
  alertas?: Alertas | null;
  /** O aviso ao entrar já foi resolvido e não abriu nesta sessão. */
  avisoLiberado?: boolean;
  /** A venda que acabou de ser anotada, com o canal dela. */
  vendaAnotada?: { canal: string; comissao: number; total: number } | null;
  /** As vendas que o Início já carregou (os últimos seis meses). */
  vendas?: readonly { dataVenda: string; status: StatusVenda }[] | null;
  /** Minutos de trabalho por lote que ela está digitando na receita (FE-78). */
  minutosTrabalho?: number | null;
};

export type ContextoDaDica = DadosDaDica & {
  tela: TelaDaDica;
  agora: Date;
  /** Quando a primeira sessão começou (ms); a carência conta daí. */
  primeiroAcesso: number;
  /** A dica que já apareceu nesta sessão, se houver. */
  dicaDaSessao: DicaId | null;
};

/** Nada aparece nos primeiros 30 segundos da primeira sessão. */
export const CARENCIA_MS = 30_000;

export function emCarencia(primeiroAcesso: number, agora: Date) {
  return agora.getTime() - primeiroAcesso < CARENCIA_MS;
}

function margemNegativa({ prejuizo }: ContextoDaDica): Dica | null {
  if (!prejuizo || prejuizo.lucroPorUnidade >= 0) return null;
  return {
    id: 'margem-negativa',
    titulo: 'Esse preço está pagando para vender',
    texto: [
      `A receita ${prejuizo.receita} `,
      {
        termo: 'custo-por-unidade',
        texto: `custa ${formatMoeda(prejuizo.custo)} para fazer`,
      },
      ` e está a ${formatMoeda(prejuizo.preco)}. Cada unidade vendida tira ${formatMoeda(-prejuizo.lucroPorUnidade)} do seu bolso.`,
    ],
    acao: { rotulo: 'Ajustar o preço', href: prejuizo.hrefAjuste },
  };
}

function estoqueNegativo({
  alertas,
  avisoLiberado,
}: ContextoDaDica): Dica | null {
  const primeiro = alertas?.estoqueNegativo[0];
  if (!avisoLiberado || !primeiro) return null;
  return {
    id: 'estoque-negativo',
    titulo: 'Faltou anotar uma compra?',
    texto: [
      `O ingrediente ${primeiro.nome} está com `,
      { termo: 'estoque-negativo', texto: 'estoque abaixo de zero' },
      '. Anote a compra para o custo ficar certo.',
    ],
    acao: { rotulo: 'Anotar compra', href: `/insumos?compra=${primeiro.id}` },
  };
}

function precoQuePrecisaSubir({
  alertas,
  avisoLiberado,
}: ContextoDaDica): Dica | null {
  if (!avisoLiberado || !alertas) return null;
  const receita = alertas.precoDefasado.find((a) => a.receitas.length > 0)
    ?.receitas[0];
  if (!receita) return null;
  return {
    id: 'preco-que-precisa-subir',
    titulo: 'Um ingrediente ficou mais caro',
    texto: [
      `O preço de ${receita.nome} deixa menos lucro do que antes. Veja o `,
      { termo: 'preco-que-precisa-subir', texto: 'preço novo sugerido' },
      '.',
    ],
    acao: { rotulo: 'Ver a receita', href: `/receitas/${receita.id}` },
  };
}

function taxaDoCanal({ vendaAnotada }: ContextoDaDica): Dica | null {
  if (!vendaAnotada || vendaAnotada.comissao <= 0) return null;
  const taxa = arredondarCentavos(vendaAnotada.total * vendaAnotada.comissao);
  if (taxa <= 0) return null;
  const { canal } = vendaAnotada;
  return {
    id: 'taxa-do-canal',
    titulo: `No canal ${canal}, uma parte fica com eles`,
    texto: [
      `Dessa venda, ${formatMoeda(taxa)} foram de `,
      { termo: 'taxa-do-canal', texto: 'taxa' },
      `. O `,
      { termo: 'preco-sugerido', texto: 'preço sugerido' },
      ` do canal ${canal} já conta com isso.`,
    ],
    acao: { rotulo: 'Ver preços por canal', href: '/receitas' },
  };
}

/** Número do mês contado desde o ano 0, no fuso do navegador. */
function mesCorrido(data: Date) {
  return data.getFullYear() * 12 + data.getMonth();
}

function primeiroMes({ vendas, agora }: ContextoDaDica): Dica | null {
  const datas = (vendas ?? [])
    .filter(isFaturavel)
    .map((v) => new Date(v.dataVenda).getTime())
    .filter((t) => !Number.isNaN(t));
  if (datas.length === 0) return null;
  const primeira = new Date(Math.min(...datas));
  // Só no mês seguinte ao da primeira venda.
  if (mesCorrido(agora) !== mesCorrido(primeira) + 1) return null;
  return {
    id: 'primeiro-mes',
    titulo: 'Seu primeiro mês fechou',
    texto: [
      'Veja quanto ',
      { termo: 'sobrou-pra-voce', texto: 'sobrou pra você' },
      ' e quanto precisa vender ',
      { termo: 'para-pagar-as-contas', texto: 'para pagar as contas do mês' },
      '.',
    ],
    acao: { rotulo: 'Entender o Início', href: '/aprender/sobrou-pra-voce' },
  };
}

function tempoDeTrabalho({ minutosTrabalho }: ContextoDaDica): Dica | null {
  if (!minutosTrabalho || minutosTrabalho <= 0) return null;
  return {
    id: 'tempo-de-trabalho',
    titulo: 'Seu tempo também tem preço',
    texto: [
      'Este tempo vezes o valor da sua hora entra no ',
      { termo: 'custo-por-unidade', texto: 'custo de cada unidade' },
      '. Por isso seu salário não vai nas contas do mês.',
    ],
    acao: {
      rotulo: 'Como cobrar pelo seu trabalho',
      href: '/aprender/guias/cobrar-pelo-seu-trabalho',
    },
  };
}

const GATILHOS: Record<DicaId, (contexto: ContextoDaDica) => Dica | null> = {
  'margem-negativa': margemNegativa,
  'estoque-negativo': estoqueNegativo,
  'preco-que-precisa-subir': precoQuePrecisaSubir,
  'taxa-do-canal': taxaDoCanal,
  'primeiro-mes': primeiroMes,
  'tempo-de-trabalho': tempoDeTrabalho,
};

/**
 * A dica da vez na tela, ou `null`. Regras: nada na carência da primeira
 * sessão; uma dica já vista não volta; se uma dica já apareceu nesta sessão,
 * nenhuma outra aparece (a mesma continua até ser dispensada).
 */
export function dicaDaVez(
  contexto: ContextoDaDica,
  vistas: readonly DicaId[],
): Dica | null {
  if (emCarencia(contexto.primeiroAcesso, contexto.agora)) return null;
  for (const id of DICAS_DA_TELA[contexto.tela]) {
    if (vistas.includes(id)) continue;
    if (contexto.dicaDaSessao !== null && contexto.dicaDaSessao !== id)
      continue;
    const dica = GATILHOS[id](contexto);
    if (dica) return dica;
  }
  return null;
}
