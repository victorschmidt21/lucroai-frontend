import { z } from 'zod';
import { apiFetch } from '@/shared/api/client';
import {
  canalVendaSchema,
  configuracaoCustosSchema,
  type CreateCanalVendaBody,
  type UpdateCanalVendaBody,
  type UpdateConfiguracaoCustosBody,
} from '@/shared/api/contracts/pricing';
import { unwrap } from '@/shared/api/request';

// Monolito: `src/modules/configuracao-custos/` (BE-24) e `src/modules/canais/` (BE-25).

export async function getConfiguracaoCustos(signal?: AbortSignal) {
  const corpo = await apiFetch('/configuracao-custos', { signal });
  return unwrap(corpo, configuracaoCustosSchema);
}

export async function updateConfiguracaoCustos(
  body: UpdateConfiguracaoCustosBody,
) {
  const corpo = await apiFetch('/configuracao-custos', {
    method: 'PUT',
    body,
  });
  return unwrap(corpo, configuracaoCustosSchema);
}

/** Em ordem de criação, com o Balcão primeiro. */
export async function listCanais(signal?: AbortSignal) {
  const corpo = await apiFetch('/canais', { signal });
  return unwrap(corpo, z.array(canalVendaSchema));
}

export async function createCanal(body: CreateCanalVendaBody) {
  const corpo = await apiFetch('/canais', { method: 'POST', body });
  return unwrap(corpo, canalVendaSchema);
}

export async function updateCanal({
  id,
  body,
}: {
  id: number;
  body: UpdateCanalVendaBody;
}) {
  const corpo = await apiFetch(`/canais/${id}`, { method: 'PUT', body });
  return unwrap(corpo, canalVendaSchema);
}

/** Responde 204 sem corpo. O Balcão dá 422 `CANAL_BALCAO_NAO_EXCLUIVEL`. */
export async function deleteCanal(id: number) {
  await apiFetch(`/canais/${id}`, { method: 'DELETE' });
}
