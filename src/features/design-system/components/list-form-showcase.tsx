'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { Insumo } from '@/shared/api/contracts/catalog';
import { unidadeMedidaSchema } from '@/shared/api/contracts/enums';
import { formatCustoUnitario, formatMoeda } from '@/shared/format/moeda';
import { formatQuantidade, percentualParaFracao } from '@/shared/format/numero';
import {
  formatNumeroEditavel,
  inteiroBR,
  numeroBR,
  numeroBROpcional,
  parseNumeroBR,
} from '@/shared/format/numero-br';
import { Button, buttonClasses, IconButton } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  Form,
  FormDecimalInput,
  FormDialog,
  FormInput,
  FormIntegerInput,
  FormMoneyInput,
  FormPercentInput,
  FormUnidadeSelect,
} from '@/shared/ui/form';
import {
  IconAdicionar,
  IconEditar,
  IconExcluir,
} from '@/shared/ui/icons/acoes';
import { ListPage } from '@/shared/ui/list-page';
import { useToast } from '@/shared/ui/toast';
import {
  criarApiDeExemplo,
  type ApiDeExemplo,
  type CenarioExemplo,
} from '../exemplo-api';

/*
 * Exemplo de /design-system/listagem: a forma que a FE-09 (insumos) vai seguir,
 * com uma API em memória no lugar de `features/insumos/api/`.
 */

const QUERY_KEY = ['design-system', 'insumos'] as const;

const QUANTIDADE = 'Informe uma quantidade maior que zero';
const VALOR = 'Informe um valor maior que zero';
const INICIAL = 'Informe uma quantidade maior ou igual a zero';

// O schema de docs/architecture.md#schemas (FE-09), com os textos de business-rules.md.
const insumoFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, 'Informe o nome')
    .max(80, 'Use até 80 caracteres'),
  quantidadeBaseCusto: numeroBR(
    z.number({ error: QUANTIDADE }).positive(QUANTIDADE),
  ),
  unidade: unidadeMedidaSchema,
  valorPago: numeroBR(z.number({ error: VALOR }).positive(VALOR)),
  quantidadeDisponivelInicial: numeroBROpcional(
    z.number({ error: INICIAL }).min(0, INICIAL),
  ),
});

type InsumoFormInput = z.input<typeof insumoFormSchema>;

const insumoFormVazio: InsumoFormInput = {
  nome: '',
  quantidadeBaseCusto: '',
  unidade: 'KG',
  valorPago: '',
  quantidadeDisponivelInicial: '',
};

function toInsumoFormInput(insumo: Insumo): InsumoFormInput {
  return {
    nome: insumo.nome,
    quantidadeBaseCusto: formatNumeroEditavel(insumo.quantidadeBaseCusto),
    unidade: insumo.unidade,
    valorPago: formatNumeroEditavel(insumo.valorPago, 2),
    quantidadeDisponivelInicial: '',
  };
}

function PreviaCustoUnitario() {
  const [quantidade, valorPago, unidade] = useWatch<
    InsumoFormInput,
    ['quantidadeBaseCusto', 'valorPago', 'unidade']
  >({ name: ['quantidadeBaseCusto', 'valorPago', 'unidade'] });
  const divisor = parseNumeroBR(quantidade) ?? 0;
  const custo = divisor > 0 ? (parseNumeroBR(valorPago) ?? 0) / divisor : 0;

  return (
    <p
      aria-live="polite"
      className="rounded-md border border-border bg-surface-alt p-3.5 text-small font-semibold text-accent"
    >
      Custo unitário: {formatCustoUnitario(custo, unidade)}
    </p>
  );
}

function InsumoFormDialog({
  api,
  open,
  onOpenChange,
  insumo,
}: {
  api: ApiDeExemplo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumo?: Insumo;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const create = useMutation({
    mutationFn: api.createInsumo,
    onSuccess: invalidar,
  });
  const update = useMutation({
    mutationFn: api.updateInsumo,
    onSuccess: invalidar,
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={insumo ? 'Editar insumo' : 'Novo insumo'}
      schema={insumoFormSchema}
      defaultValues={insumo ? toInsumoFormInput(insumo) : insumoFormVazio}
      submitLabel={insumo ? 'Atualizar' : 'Salvar'}
      onSubmit={async ({ quantidadeDisponivelInicial, ...body }) => {
        if (insumo) {
          await update.mutateAsync({ id: insumo.id, body });
          toast.success('Insumo atualizado com sucesso.');
        } else {
          await create.mutateAsync(
            quantidadeDisponivelInicial === undefined
              ? body
              : { ...body, quantidadeDisponivelInicial },
          );
          toast.success('Insumo criado com sucesso.');
        }
        onOpenChange(false);
      }}
    >
      <FormInput name="nome" label="Nome" maxLength={80} required />
      <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2.5">
        <FormDecimalInput
          name="quantidadeBaseCusto"
          label="Quantidade"
          required
        />
        <FormUnidadeSelect name="unidade" label="Unidade" />
      </div>
      <FormMoneyInput name="valorPago" label="Valor pago" required />
      {insumo ? null : (
        <FormDecimalInput
          name="quantidadeDisponivelInicial"
          label="Quantidade disponível inicial"
          hint="Saldo inicial do estoque. Deixe vazio para começar em zero."
        />
      )}
      <PreviaCustoUnitario />
    </FormDialog>
  );
}

export function InsumosExemplo({ api }: { api: ApiDeExemplo }) {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: api.listInsumos,
    // A API não garante a ordem: a web ordena por nome (business-rules.md).
    select: (insumos) =>
      insumos.toSorted((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  });
  const toast = useToast();
  const queryClient = useQueryClient();
  const excluir = useMutation({
    mutationFn: api.deleteInsumo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
  const [formulario, setFormulario] = useState<{
    aberto: boolean;
    insumo?: Insumo;
  }>({ aberto: false });
  const [paraExcluir, setParaExcluir] = useState<Insumo | null>(null);

  const novoInsumo = (
    <Button onClick={() => setFormulario({ aberto: true })}>
      <IconAdicionar className="size-5" />
      Novo insumo
    </Button>
  );

  return (
    <>
      <ListPage
        title="Insumos"
        subtitle="Gerencie quantidade, valor pago e custo unitário"
        actions={novoInsumo}
        label="Insumos"
        query={query}
        searchField="nome"
        searchPlaceholder="Buscar insumo"
        itemLabel={{ singular: 'insumo', plural: 'insumos' }}
        emptyTitle="Nenhum insumo encontrado."
        emptyDescription="Cadastre o primeiro insumo para calcular o custo das receitas."
        emptyAction={novoInsumo}
        errorTitle="Não foi possível carregar os insumos."
        getRowKey={(insumo) => insumo.id}
        columns={[
          { id: 'nome', header: 'Nome', cell: (insumo) => insumo.nome },
          {
            id: 'quantidade',
            header: 'Quantidade',
            align: 'right',
            cell: (insumo) =>
              formatQuantidade(insumo.quantidadeBaseCusto, insumo.unidade),
          },
          {
            id: 'valorPago',
            header: 'Valor pago',
            align: 'right',
            cell: (insumo) => formatMoeda(insumo.valorPago),
          },
          {
            id: 'custoUnitario',
            header: 'Custo unitário',
            align: 'right',
            cell: (insumo) =>
              formatCustoUnitario(insumo.custoUnitario, insumo.unidade),
          },
          {
            id: 'acoes',
            header: 'Ações',
            acoes: true,
            cell: (insumo) => (
              <>
                <IconButton
                  aria-label={`Editar ${insumo.nome}`}
                  onClick={() => setFormulario({ aberto: true, insumo })}
                >
                  <IconEditar />
                </IconButton>
                <IconButton
                  aria-label={`Excluir ${insumo.nome}`}
                  onClick={() => setParaExcluir(insumo)}
                >
                  <IconExcluir />
                </IconButton>
              </>
            ),
          },
        ]}
      />

      <InsumoFormDialog
        // A key recria o formulário com os valores do insumo escolhido.
        key={formulario.insumo?.id ?? 'novo'}
        api={api}
        open={formulario.aberto}
        onOpenChange={(aberto) =>
          setFormulario((atual) => ({ ...atual, aberto }))
        }
        insumo={formulario.insumo}
      />

      <ConfirmDialog
        open={paraExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setParaExcluir(null);
        }}
        title="Excluir insumo"
        description={`Deseja excluir "${paraExcluir?.nome ?? ''}"?`}
        consequence="Isso afetará o custo das receitas que usam este insumo."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!paraExcluir) return;
          await excluir.mutateAsync(paraExcluir.id);
          toast.success('Insumo excluído com sucesso.');
          setParaExcluir(null);
        }}
      />
    </>
  );
}

const RENDIMENTO = 'Informe um rendimento maior que zero';
const MARGEM = 'Informe uma margem maior ou igual a zero';

const receitaFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome'),
  rendimento: inteiroBR(z.number({ error: RENDIMENTO }).positive(RENDIMENTO)),
  unidadeRendimento: unidadeMedidaSchema,
  margem: numeroBR(z.number({ error: MARGEM }).min(0, MARGEM)),
});

/** Como o `toCreateReceitaBody` da FE-12: a margem vai em fração, com o nome do contrato. */
function toReceitaBody({
  margem,
  ...resto
}: z.output<typeof receitaFormSchema>) {
  return { ...resto, margem_lucro: percentualParaFracao(margem) };
}

export function ReceitaFormExemplo() {
  const toast = useToast();
  const [corpo, setCorpo] = useState<ReturnType<typeof toReceitaBody> | null>(
    null,
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Form
        schema={receitaFormSchema}
        defaultValues={{
          nome: '',
          rendimento: '',
          unidadeRendimento: 'UN',
          margem: '',
        }}
        cancelHref="/design-system"
        onSubmit={(values) => {
          setCorpo(toReceitaBody(values));
          toast.success('Receita criada com sucesso.');
        }}
      >
        <FormInput name="nome" label="Nome da receita" required />
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2.5">
          <FormIntegerInput name="rendimento" label="Rendimento" required />
          <FormUnidadeSelect name="unidadeRendimento" label="Unidade" />
        </div>
        <FormPercentInput
          name="margem"
          label="Margem de lucro"
          hint="Em porcentagem: 30 é enviado como 0.3."
          required
        />
      </Form>
      <Card title="Corpo enviado">
        <output aria-label="Corpo enviado" className="block">
          <pre className="text-small whitespace-pre-wrap text-ink-muted wrap-anywhere">
            {corpo
              ? JSON.stringify(corpo, null, 2)
              : 'Envie o formulário para ver o corpo.'}
          </pre>
        </output>
      </Card>
    </div>
  );
}

const OPCOES_DE_CENARIO: [keyof CenarioExemplo, string, string][] = [
  [
    'falharAoCarregar',
    'Falhar ao carregar',
    'Mostra o erro com "Tentar novamente".',
  ],
  ['listaVazia', 'Lista vazia', 'Mostra o estado de nenhum cadastro.'],
  [
    'falharAoSalvar',
    'Falhar ao salvar e excluir',
    'O diálogo continua aberto, com a mensagem no topo.',
  ],
];

export function CenarioDoExemplo({ api }: { api: ApiDeExemplo }) {
  const queryClient = useQueryClient();
  const [cenario, setCenario] = useState<CenarioExemplo>(api.cenario);

  function alternar(chave: keyof CenarioExemplo, ligado: boolean) {
    api.definirCenario({ [chave]: ligado });
    setCenario(api.cenario());

    if (chave !== 'falharAoSalvar') {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="sr-only">Cenário do exemplo</legend>
      {OPCOES_DE_CENARIO.map(([chave, rotulo, dica]) => (
        <Checkbox
          key={chave}
          label={rotulo}
          hint={dica}
          checked={cenario[chave]}
          onChange={(event) => alternar(chave, event.target.checked)}
        />
      ))}
    </fieldset>
  );
}

/** Conteúdo de /design-system/listagem. */
export function ListFormShowcase({
  api: apiDoTeste,
}: {
  /** Os testes passam uma API sem atraso. */
  api?: ApiDeExemplo;
}) {
  const [api] = useState(() => apiDoTeste ?? criarApiDeExemplo());

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-6 sm:px-8">
      <Link
        href="/design-system"
        className={buttonClasses('fantasma', 'self-start', 'compacto')}
      >
        Voltar ao design system
      </Link>

      <InsumosExemplo api={api} />

      <section className="flex flex-col gap-4">
        <h2 className="text-section-label text-ink-muted">
          Formulário em página
        </h2>
        <ReceitaFormExemplo />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-section-label text-ink-muted">
          Cenário do exemplo
        </h2>
        <Card>
          <CenarioDoExemplo api={api} />
        </Card>
      </section>
    </main>
  );
}
