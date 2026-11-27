'use client';

import { useState } from 'react';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import {
  BASE_RATEIO_ROTULOS,
  BASES_RATEIO,
  type BaseRateio,
} from '@/shared/api/contracts/enums';
import type { ConfiguracaoCustos } from '@/shared/api/contracts/pricing';
import { formatMoeda } from '@/shared/format/moeda';
import { formatNumeroEditavel, parseNumeroBR } from '@/shared/format/numero-br';
import { Button } from '@/shared/ui/button';
import {
  Form,
  FormDecimalInput,
  FormMoneyInput,
  FormPercentInput,
} from '@/shared/ui/form';
import { DecimalInput, MoneyInput } from '@/shared/ui/number-input';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { useToast } from '@/shared/ui/toast';
import { Termo } from '@/features/aprender/components/termo';
import { calcularValorHora } from '../configuracoes.calculos';
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
      <CampoCapacidade configuracao={configuracao} />
      <CampoValorHora />
      <FormPercentInput
        name="lucroPadrao"
        label={
          <Termo id="lucro-desejado">
            Quanto você quer de lucro em cada venda?
          </Termo>
        }
        hint="De cada R$ 1,00 vendido, quanto fica para você. Ex.: 15% são R$ 0,15."
        required
      />
      <FormPercentInput
        name="impostoPercentual"
        label={<Termo id="imposto">Você paga imposto sobre as vendas?</Termo>}
        hint="Se é informal ou MEI, deixe 0."
        required
      />
      <FormPercentInput
        name="taxaMaquininha"
        label={
          <Termo
            id="taxa-do-canal"
            dados={{
              canal: 'A maquininha',
              taxa: configuracao.taxaMaquininha,
            }}
          >
            Taxa da maquininha
          </Termo>
        }
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
      <p className="text-body font-medium text-ink-muted">
        <Termo id="divisao-das-contas">{PERGUNTA_BASE}</Termo>
      </p>
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

/** O exemplo da Pitada usa o valor salvo, não o que está sendo digitado. */
function CampoCapacidade({
  configuracao,
}: {
  configuracao: ConfiguracaoCustos;
}) {
  const base = useWatch<ConfiguracaoCustosFormInput, 'baseRateio'>({
    name: 'baseRateio',
  });
  const minutos = base === 'MINUTOS';

  return (
    <FormDecimalInput
      name="capacidadeMensal"
      label={
        <Termo id="fornadas-por-mes" dados={configuracao}>
          {minutos
            ? 'Quantos minutos de forno você usa por mês?'
            : 'Quantas fornadas você faz por mês?'}
        </Termo>
      }
      unidade={minutos ? 'min' : 'fornadas'}
      hint="Uma estimativa já serve; dá para ajustar depois."
      required
    />
  );
}

/**
 * Valor da sua hora (FE-76), em R$/h. A conta de ajuda só preenche o campo:
 * o ganho e as horas não são salvos.
 */
function CampoValorHora() {
  return (
    <div className="flex flex-col gap-3">
      <FormMoneyInput
        name="valorHora"
        label="Valor da sua hora"
        hint="Seu trabalho entra no custo. O lucro é o que sobra para o negócio depois de pagar tudo, inclusive você."
        required
      />
      <ContaDoValorHora />
    </div>
  );
}

function ContaDoValorHora() {
  const { setValue } = useFormContext<ConfiguracaoCustosFormInput>();
  const [ganho, setGanho] = useState('');
  const [horas, setHoras] = useState('');
  const conta = calcularValorHora(parseNumeroBR(ganho), parseNumeroBR(horas));
  const preenchida = ganho.trim() !== '' || horas.trim() !== '';

  return (
    <details className="rounded-lg border border-border bg-surface-alt p-4">
      <summary className="min-h-12 cursor-pointer content-center text-body font-bold text-accent">
        Não sabe? Faça a conta
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        <MoneyInput
          label="Quanto você quer ganhar por mês pelo seu trabalho?"
          value={ganho}
          onValueChange={setGanho}
        />
        <DecimalInput
          label="Quantas horas por mês você passa produzindo?"
          hint="Conte só as horas em que você está fazendo os doces, não as 220 horas de um emprego de carteira. Se contar a mais, sua hora fica barata demais."
          unidade="h"
          value={horas}
          onValueChange={setHoras}
        />
        <output aria-live="polite" className="text-body text-ink">
          {conta.valor !== undefined ? (
            <>
              Sua hora vale{' '}
              <strong className="tabular-nums">
                {formatMoeda(conta.valor)}
              </strong>
              .
            </>
          ) : preenchida ? (
            <span className="text-ink-muted">{conta.motivo}</span>
          ) : null}
        </output>
        {conta.valor !== undefined ? (
          <Button
            variant="secundario"
            className="self-start"
            onClick={() =>
              setValue('valorHora', formatNumeroEditavel(conta.valor, 2), {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            Usar este valor
          </Button>
        ) : null}
      </div>
    </details>
  );
}
