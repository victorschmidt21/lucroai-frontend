'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import type { ChangeEvent } from 'react';
import {
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
} from 'react-hook-form';
import { receitasListOptions } from '@/features/receitas/api/receitas.queries';
import type { CanalVenda } from '@/shared/api/contracts/pricing';
import type { Receita } from '@/shared/api/contracts/recipe';
import { getErrorMessage } from '@/shared/api/errors';
import { formatNumeroEditavel } from '@/shared/format/numero-br';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { FormIntegerInput, FormMoneyInput } from '@/shared/ui/form';
import { IconAdicionar } from '@/shared/ui/icons/acoes';
import { Select } from '@/shared/ui/select';
import { Termo } from '@/features/aprender/components/termo';
import {
  canaisParaVenda,
  canalDaVendaSchema,
  itemVendaFormSchema,
  precoSugeridoNoCanal,
  itemVendaFormVazio,
  type ItemVendaFormInput,
  type ItemVendaFormValues,
} from '../schemas/item-venda.schema';
import { receitasParaVender } from '../vendas.calculos';

type Props = {
  onAdicionar: (item: ItemVendaFormValues, receita: Receita) => void;
  /** Durante o registro da venda, não se adiciona item. */
  bloqueado: boolean;
  /** "Onde vendeu?" (FE-46): o canal da venda inteira, que fica na tela. */
  canal: {
    id: number | null;
    canais: readonly CanalVenda[];
    carregando: boolean;
    /** Falha ao carregar os canais. */
    erro: boolean;
    /** Com itens no carrinho, o canal não muda: os preços são dele. */
    travado: boolean;
    onChange: (canalId: number | null) => void;
  };
};

/** "Adicionar produto". Origem: `_buildAddItemForm` de vendas_page.dart. */
export function AdicionarProdutoCard({ onAdicionar, bloqueado, canal }: Props) {
  const receitas = useQuery(receitasListOptions());
  const form = useForm<ItemVendaFormInput, unknown, ItemVendaFormValues>({
    resolver: zodResolver(itemVendaFormSchema),
    defaultValues: itemVendaFormVazio(),
    shouldFocusError: true,
  });

  const adicionar = form.handleSubmit((values) => {
    const receita = receitas.data?.find((r) => r.id === values.receitaId);
    if (!receita) return;

    onAdicionar(values, receita);
    form.reset(itemVendaFormVazio());
  });

  return (
    <Card>
      <h2 className="text-body font-semibold">Adicionar produto</h2>
      <FormProvider {...form}>
        <form
          noValidate
          aria-label="Adicionar produto"
          onSubmit={(event) => void adicionar(event)}
          className="flex flex-col gap-4"
        >
          <CampoCanal {...canal} />
          <CampoReceita
            canalId={canal.id}
            receitas={receitasParaVender(receitas.data ?? [])}
            carregando={receitas.isPending}
            erro={receitas.isError ? getErrorMessage(receitas.error) : null}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormIntegerInput
              name="quantidade"
              label="Quantidade"
              placeholder="Ex.: 10"
              required
            />
            <FormMoneyInput
              name="precoUnitario"
              label="Preço unitário real"
              required
            />
          </div>
          <Button type="submit" variant="secundario" disabled={bloqueado}>
            <IconAdicionar className="size-5" />
            Adicionar ao carrinho
          </Button>
        </form>
      </FormProvider>
    </Card>
  );
}

function textoInicial(carregando: boolean, vazio: boolean) {
  if (carregando) return 'Carregando receitas…';
  if (vazio) return 'Nenhuma receita cadastrada';
  return 'Selecione';
}

/**
 * "Onde vendeu?": canais ativos, Balcão por padrão. Sem a lista (carregando ou
 * com erro), a venda vai sem canal, e o backend usa o Balcão.
 */
function CampoCanal({
  id,
  canais,
  carregando,
  erro,
  travado,
  onChange,
}: Props['canal']) {
  const ativos = canaisParaVenda(canais);
  let dica: string | undefined;
  if (erro) {
    dica =
      'Não foi possível carregar os canais. A venda será registrada no Balcão.';
  } else if (travado) dica = 'Para trocar o canal, esvazie o carrinho.';

  return (
    <Select
      label={<Termo id="canal-de-venda">Onde vendeu?</Termo>}
      value={id === null ? '' : String(id)}
      onChange={(event) =>
        onChange(canalDaVendaSchema.parse(event.target.value))
      }
      disabled={carregando || travado || ativos.length === 0}
      hint={dica}
    >
      {ativos.length === 0 ? (
        <option value="">{carregando ? 'Carregando canais…' : 'Balcão'}</option>
      ) : null}
      {ativos.map((c) => (
        <option key={c.id} value={String(c.id)}>
          {c.nome}
        </option>
      ))}
    </Select>
  );
}

/**
 * Ao escolher a receita, o preço recebe o preço sugerido **no canal da venda**
 * (FE-46, `receita.precos`); sem preço possível, fica vazio. O usuário pode alterá-lo.
 */
function CampoReceita({
  canalId,
  receitas,
  carregando,
  erro,
}: {
  canalId: number | null;
  receitas: readonly Receita[];
  carregando: boolean;
  erro: string | null;
}) {
  const { register, setValue } = useFormContext<ItemVendaFormInput>();
  const { errors } = useFormState<ItemVendaFormInput>({ name: 'receitaId' });

  return (
    <Select
      label="Produto/Receita"
      required
      {...register('receitaId', {
        onChange: (event: ChangeEvent<HTMLSelectElement>) => {
          const receita = receitas.find(
            (r) => String(r.id) === event.target.value,
          );
          const sugerido = receita
            ? precoSugeridoNoCanal(receita, canalId)
            : null;

          setValue('precoUnitario', formatNumeroEditavel(sugerido, 2));
        },
      })}
      disabled={carregando}
      error={errors.receitaId?.message}
      hint={erro ?? undefined}
    >
      <option value="">
        {textoInicial(carregando, receitas.length === 0 && !erro)}
      </option>
      {receitas.map((receita) => (
        <option key={receita.id} value={String(receita.id)}>
          {receita.nome}
        </option>
      ))}
    </Select>
  );
}
