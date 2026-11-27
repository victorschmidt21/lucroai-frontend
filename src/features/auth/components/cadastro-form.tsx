'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { DEFAULT_PATH, LOGIN_PATH } from '@/shared/auth/session-paths';
import { navigateTo } from '@/shared/auth/navigation';
import { Alert } from '@/shared/ui/alert';
import { Button, IconButton } from '@/shared/ui/button';
import {
  IconCadeado,
  IconEmail,
  IconMostrar,
  IconOcultar,
} from '@/shared/ui/icons/acoes';
import { Input } from '@/shared/ui/input';
import { useCadastro } from '../hooks/use-cadastro';
import {
  CAMPOS_CADASTRO,
  cadastroFormSchema,
  getCadastroErro,
  toCadastroBody,
  type CampoCadastro,
} from '../schemas/cadastro-form.schema';

type ErrosDosCampos = Partial<Record<CampoCadastro, string>>;

function lerCampos(form: HTMLFormElement) {
  const dados = new FormData(form);

  return Object.fromEntries(
    CAMPOS_CADASTRO.map((campo) => [campo, String(dados.get(campo) ?? '')]),
  ) as Record<CampoCadastro, string>;
}

function focarPrimeiroComErro(form: HTMLFormElement, erros: ErrosDosCampos) {
  const campo = CAMPOS_CADASTRO.find((nome) => erros[nome]);
  const elemento = campo ? form.elements.namedItem(campo) : null;

  if (elemento instanceof HTMLInputElement) elemento.focus();
}

// Estado local, como o login: a navegação completa ao final dispensa o `Form`
// do react-hook-form. O token fica só no campo e no corpo do POST ao BFF.
export function CadastroForm() {
  const cadastro = useCadastro();
  const formRef = useRef<HTMLFormElement>(null);
  const [erros, setErros] = useState<ErrosDosCampos>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const parsed = cadastroFormSchema.safeParse(lerCampos(form));

    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      const novos: ErrosDosCampos = Object.fromEntries(
        CAMPOS_CADASTRO.map((campo) => [campo, fieldErrors[campo]?.[0]]),
      );
      setErros(novos);
      setErroGeral(undefined);
      focarPrimeiroComErro(form, novos);
      return;
    }

    setErros({});
    setErroGeral(undefined);
    cadastro.mutate(toCadastroBody(parsed.data), {
      onSuccess: () => navigateTo(DEFAULT_PATH),
      onError: (error) => {
        const { campos, geral } = getCadastroErro(error);
        const atual = formRef.current;

        // Token recusado: o campo é limpo, para não ficar o valor errado.
        if (campos.token_cadastro && atual) {
          const token = atual.elements.namedItem('token_cadastro');
          if (token instanceof HTMLInputElement) token.value = '';
        }

        setErros(campos);
        setErroGeral(geral);
        if (atual) focarPrimeiroComErro(atual, campos);
      },
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 text-title text-ink">Sua empresa</legend>
        <Input
          label="Nome da empresa"
          name="nome_empresa"
          autoComplete="organization"
          maxLength={100}
          required
          error={erros.nome_empresa}
        />
        <Input
          label="CNPJ (opcional)"
          name="cnpj"
          inputMode="numeric"
          autoComplete="off"
          maxLength={18}
          error={erros.cnpj}
        />
        <Input
          label="Segmento (opcional)"
          name="segmento"
          placeholder="Ex.: Padaria, Confeitaria"
          autoComplete="off"
          maxLength={80}
          error={erros.segmento}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mt-2 mb-4 text-title text-ink">Seu acesso</legend>
        <Input
          label="Seu nome"
          name="nome_usuario"
          autoComplete="name"
          maxLength={80}
          required
          error={erros.nome_usuario}
        />
        <Input
          label="E-mail"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={80}
          required
          icon={<IconEmail />}
          error={erros.email}
        />
        <Input
          label="Senha"
          name="senha"
          type={mostrarSenha ? 'text' : 'password'}
          autoComplete="new-password"
          required
          hint="Pelo menos 6 caracteres"
          icon={<IconCadeado />}
          error={erros.senha}
          trailing={
            <IconButton
              variant="icone-campo"
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setMostrarSenha((atual) => !atual)}
            >
              {mostrarSenha ? <IconOcultar /> : <IconMostrar />}
            </IconButton>
          }
        />
        <Input
          label="Confirmar senha"
          name="confirmacao_senha"
          type={mostrarSenha ? 'text' : 'password'}
          autoComplete="new-password"
          required
          icon={<IconCadeado />}
          error={erros.confirmacao_senha}
        />
        <Input
          label="Token de cadastro"
          name="token_cadastro"
          type={mostrarToken ? 'text' : 'password'}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          // Gerenciadores de senha não devem oferecer nem guardar o token.
          data-1p-ignore
          data-lpignore="true"
          maxLength={256}
          required
          hint="Você recebe esse código da equipe do Doce Fatia"
          error={erros.token_cadastro}
          trailing={
            <IconButton
              variant="icone-campo"
              aria-label={mostrarToken ? 'Ocultar token' : 'Mostrar token'}
              onClick={() => setMostrarToken((atual) => !atual)}
            >
              {mostrarToken ? <IconOcultar /> : <IconMostrar />}
            </IconButton>
          }
        />
      </fieldset>
      {erroGeral ? <Alert>{erroGeral}</Alert> : null}
      {/* Depois do sucesso, continua inativo até a navegação terminar. */}
      <Button
        type="submit"
        loading={cadastro.isPending || cadastro.isSuccess}
        className="mt-1 min-h-13"
      >
        Criar conta
      </Button>
      <p className="text-center text-body text-ink-muted">
        Já tem conta?{' '}
        <Link
          href={LOGIN_PATH}
          className="rounded-sm font-bold text-accent underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
