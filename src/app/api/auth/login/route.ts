import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { apiFetch } from '@/shared/api/client.server';
import { loginResponseSchema } from '@/shared/api/contracts/auth';
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

// Só os dois campos do `LoginDto`: o `ValidationPipe` do backend recusa campos
// extras. O formato do e-mail é conferido pelo formulário e pelo backend.
const credenciaisSchema = z.object({ email: z.string(), senha: z.string() });

/**
 * `POST /api/auth/login`: autentica no auth-service, desembrulha
 * `data.access_token` e grava o token no cookie `httpOnly`. O corpo da
 * resposta nunca traz o token.
 */
export async function POST(request: NextRequest) {
  if (!isOrigemPermitida(request)) return origemInvalida();

  const credenciais = credenciaisSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!credenciais.success) {
    return erroBff(400, 'Requisição inválida.', 'Bad Request');
  }

  try {
    const corpo = await apiFetch('auth', '/auth/login', {
      method: 'POST',
      body: credenciais.data,
    });
    const { access_token: token } = unwrap(corpo, loginResponseSchema);
    const payload = decodificarJwt(token);

    // Um token que não dá para ler não serve para exibir o usuário nem para
    // saber quando vence: é falha do serviço, não do usuário.
    if (!payload) return servicoIndisponivel();

    const response = new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
    gravarSessao(response, token, payload);

    return response;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode !== STATUS_ERRO_DE_REDE) {
      // Repassa o status e as mensagens do backend; o formulário decide o texto.
      return erroBff(error.statusCode, error.mensagens.join('; '), error.error);
    }

    return servicoIndisponivel();
  }
}
