'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { MENSAGEM_SESSAO_EXPIRADA } from '@/shared/api/errors';
import { navigateTo } from '@/shared/auth/navigation';
import { CADASTRO_PATH } from '@/shared/auth/session-paths';
import { Alert } from '@/shared/ui/alert';
import { Button, IconButton } from '@/shared/ui/button';
import {
  IconAlerta,
  IconCadeado,
  IconEmail,
  IconMostrar,
  IconOcultar,
} from '@/shared/ui/icons/acoes';
import { Input } from '@/shared/ui/input';
import { useLogin } from '../hooks/use-login';
import {
  getLoginErrorMessage,
  loginFormSchema,
} from '../schemas/login-form.schema';

type Campo = 'email' | 'senha';
type ErrosDosCampos = Partial<Record<Campo, string>>;

type LoginFormProps = {
  /** Destino depois de entrar, já conferido por `getSafeRedirect`. */
  redirectTo: string;
  /** Veio de `?expirada=1`: a sessão acabou no meio do uso. */
  sessaoExpirada?: boolean;
};

// Estado local: com dois campos e a navegação completa ao final, o `Form` do
// react-hook-form não traria ganho.
export function LoginForm({
  redirectTo,
  sessaoExpirada = false,
}: LoginFormProps) {
  const login = useLogin();
  const [erros, setErros] = useState<ErrosDosCampos>({});
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const senhaRef = useRef<HTMLInputElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const parsed = loginFormSchema.safeParse({
      email: form.get('email'),
      senha: form.get('senha'),
    });

    if (!parsed.success) {
      const { email, senha } = z.flattenError(parsed.error).fieldErrors;
      setErros({ email: email?.[0], senha: senha?.[0] });
      (email ? emailRef : senhaRef).current?.focus();
      return;
    }

    setErros({});
    login.mutate(parsed.data, { onSuccess: () => navigateTo(redirectTo) });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {sessaoExpirada && !login.error ? (
        // `output` tem o papel `status`: o leitor de tela anuncia o aviso.
        <output className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/8 p-3 text-body text-ink">
          <IconAlerta className="text-warning" />
          {MENSAGEM_SESSAO_EXPIRADA}
        </output>
      ) : null}
      <Input
        ref={emailRef}
        label="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        icon={<IconEmail />}
        error={erros.email}
      />
      <Input
        ref={senhaRef}
        label="Senha"
        name="senha"
        type={mostrarSenha ? 'text' : 'password'}
        autoComplete="current-password"
        icon={<IconCadeado />}
        error={erros.senha}
        trailing={
          <IconButton
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            onClick={() => setMostrarSenha((atual) => !atual)}
          >
            {mostrarSenha ? <IconOcultar /> : <IconMostrar />}
          </IconButton>
        }
      />
      {login.error ? <Alert>{getLoginErrorMessage(login.error)}</Alert> : null}
      {/* Depois do sucesso, continua inativo até a navegação terminar. */}
      <Button
        type="submit"
        loading={login.isPending || login.isSuccess}
        className="mt-1 min-h-13 lg:min-h-13"
      >
        Entrar
      </Button>
      <p className="text-center text-body text-ink-muted">
        Ainda não tem conta?{' '}
        <Link
          href={CADASTRO_PATH}
          className="rounded-sm font-bold text-accent underline-offset-4 hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
