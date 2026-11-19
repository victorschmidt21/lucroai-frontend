import { apiFetch } from '@/shared/api/client';
import {
  vendaSchema,
  type CreateVendaBody,
} from '@/shared/api/contracts/sales';
import { unwrap } from '@/shared/api/request';

// sales-service: `services/sales-service/src/modules/vendas/infra/controllers/vendas.controller.ts`.

/** Cria a venda como `PENDENTE`, com o `total` e o custo de cada item gravados pelo backend. */
export async function createVenda(body: CreateVendaBody) {
  const corpo = await apiFetch('sales', '/vendas', { method: 'POST', body });
  return unwrap(corpo, vendaSchema);
}
