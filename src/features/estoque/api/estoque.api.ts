import { apiFetch } from '@/shared/api/client';
import { estoqueSchema } from '@/shared/api/contracts/operations';
import { unwrap } from '@/shared/api/request';

// operations-service: `services/operations-service/src/modules/estoque/infra/controllers/estoque.controller.ts`.

/** Saldo de um insumo. Não há listagem de estoque (lacuna 5). */
export async function getEstoqueDoInsumo(
  insumoId: number,
  signal?: AbortSignal,
) {
  const corpo = await apiFetch('operations', `/estoque/insumos/${insumoId}`, {
    signal,
  });
  return unwrap(corpo, estoqueSchema);
}
