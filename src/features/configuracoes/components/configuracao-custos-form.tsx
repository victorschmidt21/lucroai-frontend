'use client';

import { useController, useWatch } from 'react-hook-form';
import {
  BASE_RATEIO_ROTULOS,
  BASES_RATEIO,
  type BaseRateio,
} from '@/shared/api/contracts/enums';
import type { ConfiguracaoCustos } from '@/shared/api/contracts/pricing';
import { Form, FormDecimalInput, FormPercentInput } from '@/shared/ui/form';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { useToast } from '@/shared/ui/toast';
import { useUpdateConfiguracaoCustos } from '../hooks/use-update-configuracao-custos';
import {
  configuracaoCustosFormSchema,
  toConfiguracaoCustosFormInput,
  toUpdateConfiguracaoCustosBody,
  type ConfiguracaoCustosFormInput,
} from '../schemas/configuracao-custos-form.schema';

const PERGUNTA_BASE = 'Como você quer dividir as contas do mês?';

/** As perguntas da configuração de custos, em linguagem simples (FE-41). */
export function ConfiguracaoCustosForm({
  configuracao,
}: {
  configuracao: ConfiguracaoCustos;
}) {
  const toast = useToast();
  const salvar = useUpdateConfiguracaoCustos();

  return (
    <Form
      schema={configuracaoCustosFormSchema}
      defaultValues={toConfiguracaoCustosFormInput(configuracao)}
      onSubmit={async (values) => {
        await salvar.mutateAsync(toUpdateConfiguracaoCustosBody(values));
        toast.success('Ajustes salvos.');
      }}
    >
      <CampoBaseRateio />
      <CampoCapacidade />
      <FormPercentInput
        name="lucroPadrao"
        label="Quanto você quer de lucro em cada venda?"
        hint="De cada R$ 1,00 vendido, quanto fica para você. Ex.: 15% são R$ 0,15."
        required
      />
      <FormPercentInput
        name="impostoPercentual"
        label="Você paga imposto sobre as vendas?"
        hint="Se é informal ou MEI, deixe 0."
        required
      />
      <FormPercentInput
        name="taxaMaquininha"
        label="Taxa da maquininha"
        hint="Quanto a maquininha de cartão cobra nas vendas do balcão."
        required
      />
    </Form>
  );
}

function CampoBaseRateio() {
  const { field } = useController<ConfiguracaoCustosFormInput, 'baseRateio'>({
    name: 'baseRateio',
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-body font-medium text-ink-muted">{PERGUNTA_BASE}</p>
      <SegmentedControl<BaseRateio>
        aria-label={PERGUNTA_BASE}
        options={BASES_RATEIO.map((valor) => ({
          value: valor,
          label: BASE_RATEIO_ROTULOS[valor],
        }))}
        value={field.value}
        onValueChange={field.onChange}
        className="self-start"
      />
      <p className="text-small text-ink-muted">
        {field.value === 'MINUTOS'
          ? 'Aluguel, luz, gás e as outras contas do mês são divididos pelos minutos de forno que cada receita usa.'
          : 'Aluguel, luz, gás e as outras contas do mês são divididos pelas fornadas que cada receita usa.'}
      </p>
    </div>
  );
}

function CampoCapacidade() {
  const base = useWatch<ConfiguracaoCustosFormInput, 'baseRateio'>({
    name: 'baseRateio',
  });
  const minutos = base === 'MINUTOS';

  return (
    <FormDecimalInput
      name="capacidadeMensal"
      label={
        minutos
          ? 'Quantos minutos de forno você usa por mês?'
          : 'Quantas fornadas você faz por mês?'
      }
      unidade={minutos ? 'min' : 'fornadas'}
      hint="Uma estimativa já serve; dá para ajustar depois."
      required
    />
  );
}
