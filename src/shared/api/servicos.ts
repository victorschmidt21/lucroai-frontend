/** Os cinco microsserviços do `lucroai-backend` (docs/api-integration.md#os-cinco-serviços). */
export const SERVICOS = [
  'auth',
  'catalog',
  'recipe',
  'operations',
  'sales',
] as const;

export type Servico = (typeof SERVICOS)[number];

export function isServico(valor: string): valor is Servico {
  return (SERVICOS as readonly string[]).includes(valor);
}
