import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  receitaCustoSchema,
  receitaSchema,
  simulacaoCenarioSchema,
  type CreateReceitaBody,
  type SimularCenarioBody,
  type SimularReceitaCustoBody,
  type UpdateReceitaBody,
} from '@/shared/api/contracts/recipe';
import { unwrap } from '@/shared/api/request';

// recipe-service: `services/recipe-service/src/modules/receitas/infra/controllers/receitas.controller.ts`.

/** Vem ordenada por `dataCriacao` decrescente (a mais nova primeiro). */
export async function listReceitas(signal?: AbortSignal) {
  const corpo = await apiFetch('/receitas', { signal });
  return unwrap(corpo, z.array(receitaSchema));
}

export async function getReceita(id: number, signal?: AbortSignal) {
  const corpo = await apiFetch(`/receitas/${id}`, { signal });
  return unwrap(corpo, receitaSchema);
}

/** O backend calcula e grava os custos; a resposta traz os valores salvos. */
export async function createReceita(body: CreateReceitaBody) {
  const corpo = await apiFetch('/receitas', {
    method: 'POST',
    body,
  });
  return unwrap(corpo, receitaSchema);
}

/** `PUT`: campo omitido mantém o valor salvo (inclusive a margem). */
export async function updateReceita({
  id,
  body,
}: {
  id: number;
  body: UpdateReceitaBody;
}) {
  const corpo = await apiFetch(`/receitas/${id}`, {
    method: 'PUT',
    body,
  });
  return unwrap(corpo, receitaSchema);
}

/** Responde 204 sem corpo: não há o que desembrulhar. */
export async function deleteReceita(id: number) {
  await apiFetch(`/receitas/${id}`, { method: 'DELETE' });
}

// Simulação (FE-20): nenhuma destas rotas grava nada.

/** Campo omitido usa o valor da receita (custo, preço sugerido no canal, rendimento e Balcão). */
export async function simularCenario({
  id,
  body,
  signal,
}: {
  id: number;
  body: SimularCenarioBody;
  signal?: AbortSignal;
}) {
  const corpo = await apiFetch(`/receitas/${id}/simular`, {
    method: 'POST',
    body,
    signal,
  });
  return unwrap(corpo, simulacaoCenarioSchema);
}

/** Custo atual de 1 lote. */
export async function getReceitaCusto(id: number, signal?: AbortSignal) {
  const corpo = await apiFetch(`/receitas/${id}/custo`, { signal });
  return unwrap(corpo, receitaCustoSchema);
}

export async function simularReceitaCusto({
  id,
  body,
}: {
  id: number;
  body: SimularReceitaCustoBody;
}) {
  const corpo = await apiFetch(`/receitas/${id}/custo/simular`, {
    method: 'POST',
    body,
  });
  return unwrap(corpo, receitaCustoSchema);
}
