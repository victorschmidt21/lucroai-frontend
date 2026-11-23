import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { apiFetch } from '@/shared/api/client.server';
import { empresaCriadaSchema } from '@/shared/api/contracts/auth';
import { ApiError, STATUS_ERRO_DE_REDE } from '@/shared/api/errors';
import { unwrap } from '@/shared/api/request';
import {
  erroBff,
  isOrigemPermitida,
  origemInvalida,
  servicoIndisponivel,
} from '@/shared/auth/bff.server';
import { decodificarJwt } from '@/shared/auth/jwt';
import { gravarSessao } from '@/shared/auth/session.server';

// Só os campos do `CreateEmpresaDto`: o `ValidationPipe` do backend recusa
// campos extras. O formato de cada campo é conferido pelo formulário e pelo backend.
const cadastroSchema = z.object({
  nome_empresa: z.string(),
  cnpj: z.string().optional(),
  segmento: z.string().optional(),
  nome_usuario: z.string().optional(),
  email: z.string(),
  senha: z.string(),
  token_cadastro: z.string(),
});

/**
 * `POST /api/auth/cadastro` (FE-48): cria a empresa em `POST /auth/empresa`
 * com o token de cadastro, lê o `access_token` e grava o cookie `httpOnly`,
 * como o login. O corpo da resposta nunca traz o JWT, e o token de cadastro
 * nunca vai para log.
 */
export async function POST(request: NextRequest) {
  if (!isOrigemPermitida(request)) return origemInvalida();

  const cadastro = cadastroSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!cadastro.success) {
    return erroBff(400, 'Requisição inválida.', 'Bad Request');
  }

  try {
    const corpo = await apiFetch('/auth/empresa', {
      method: 'POST',
      body: cadastro.data,
    });
    const { access_token: token } = unwrap(corpo, empresaCriadaSchema);
    const payload = decodificarJwt(token);

    if (!payload) return servicoIndisponivel();

    const response = new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
    gravarSessao(response, token, payload);

    return response;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode !== STATUS_ERRO_DE_REDE) {
      // Repassa o status, o code e os campos recusados; o formulário decide o texto.
      return erroBff(
        error.statusCode,
        error.mensagens.join('; '),
        error.code,
        error.details,
      );
    }

    return servicoIndisponivel();
  }
}
