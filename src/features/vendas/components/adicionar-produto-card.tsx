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
import type { Receita } from '@/shared/api/contracts/recipe';
import { getErrorMessage } from '@/shared/api/errors';
import { formatNumeroEditavel } from '@/shared/format/numero-br';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { FormIntegerInput, FormMoneyInput } from '@/shared/ui/form';
import { IconAdicionar } from '@/shared/ui/icons/acoes';
import { Select } from '@/shared/ui/select';
import {
  itemVendaFormSchema,
  itemVendaFormVazio,
  type ItemVendaFormInput,
  type ItemVendaFormValues,
} from '../schemas/item-venda.schema';

type Props = {
  onAdicionar: (item: ItemVendaFormValues, receita: Receita) => void;
  /** Durante o registro da venda, não se adiciona item. */
  bloqueado: boolean;
};

/** "Adicionar produto". Origem: `_buildAddItemForm` de vendas_page.dart. */
export function AdicionarProdutoCard({ onAdicionar, bloqueado }: Props) {
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
          <CampoReceita
            receitas={receitas.data ?? []}
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
 * Ao escolher a receita, o preço recebe o `precoSugerido` quando ele for > 0; senão,
 * fica vazio (`_onReceitaChanged`). O usuário pode alterá-lo depois.
 */
function CampoReceita({
  receitas,
  carregando,
  erro,
}: {
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
          const sugerido = receitas.find(
            (receita) => String(receita.id) === event.target.value,
          )?.precoSugerido;

          setValue(
            'precoUnitario',
            sugerido !== undefined && sugerido > 0
              ? formatNumeroEditavel(sugerido, 2)
              : '',
          );
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
