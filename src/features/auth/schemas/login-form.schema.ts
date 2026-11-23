import { z } from 'zod';
import { ApiError } from '@/shared/api/errors';

// Textos de docs/business-rules.md#login-e-mensagens-de-erro-gerais.
// Origem: lib/features/auth/presentation/pages/login_page.dart.
export const MENSAGEM_CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos';
export const MENSAGEM_ERRO_LOGIN =
  'Não foi possível entrar. Confira a internet e tente de novo.';

/**
 * O mobile só confere se há `@`; aqui o formato vem do `z.email()`, o mesmo
 * critério do `@IsEmail()` do `LoginDto`, para um e-mail malformado não virar
 * um 400 em inglês do backend. A senha não é aparada, como no mobile.
 */
export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail')
    .pipe(z.email('Informe um e-mail válido')),
  senha: z.string().min(1, 'Informe sua senha'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

/** `_messageFromError` do mobile: 401 é credencial errada; o resto, falha ao entrar. */
export function getLoginErrorMessage(error: unknown) {
  return error instanceof ApiError && error.statusCode === 401
    ? MENSAGEM_CREDENCIAIS_INVALIDAS
    : MENSAGEM_ERRO_LOGIN;
}
