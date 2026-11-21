import type { NextRequest } from 'next/server';
import { proxyParaBackend } from '@/shared/auth/backend-proxy.server';

/** Proxy BFF: `/api/backend/<caminho>` → `API_URL/<caminho>`. */
async function handler(
  request: NextRequest,
  context: RouteContext<'/api/backend/[...path]'>,
) {
  const { path } = await context.params;

  return proxyParaBackend(request, path);
}

export {
  handler as DELETE,
  handler as GET,
  handler as PATCH,
  handler as POST,
  handler as PUT,
};
