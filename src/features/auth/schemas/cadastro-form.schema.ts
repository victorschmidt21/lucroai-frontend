import { z } from 'zod';
import type { CadastroEmpresaBody } from '@/shared/api/contracts/auth';
import { ApiError, temCodigo } from '@/shared/api/errors';

// Textos de docs/business-rules.md#criar-conta-com-token-de-cadastro (FE-48).
export const MENSAGEM_TOKEN_INVALIDO = 'Token de cadastro inválido';
export const MENSAGEM_EMAIL_JA_CADASTRADO = 'E-mail já cadastrado';
export const MENSAGEM_CNPJ_JA_CADASTRADO = 'CNPJ já cadastrado';
export const MENSAGEM_MUITAS_TENTATIVAS =
  'Muitas tentativas. Aguarde um minuto e tente de novo.';
export const MENSAGEM_ERRO_CADASTRO =
  'Não foi possível criar a conta. Tente de novo.';
export const MENSAGEM_SENHAS_DIFERENTES = 'As senhas não conferem';

const textoOpcional = (maximo: number, mensagem: string) =>
  z.string().trim().max(maximo, mensagem);

/**
 * Limites do `CreateEmpresaDto` do backend (`nome_empresa` até 100, `cnpj` até
 * 18, os outros textos até 80, senha com no mínimo 6), para um valor fora deles
 * não virar um 400 em inglês. O nome do usuário é opcional no backend, mas a
 * issue o pede. Senha e token não são aparados (o backend compara o token exato).
 */
export const cadastroFormSchema = z
  .object({
    nome_empresa: z
      .string()
      .trim()
      .min(1, 'Informe o nome da empresa')
      .max(100, 'Use até 100 caracteres'),
    cnpj: textoOpcional(18, 'Use até 18 caracteres'),
    segmento: textoOpcional(80, 'Use até 80 caracteres'),
    nome_usuario: z
      .string()
      .trim()
      .min(1, 'Informe seu nome')
      .max(80, 'Use até 80 caracteres'),
    email: z
      .string()
      .trim()
      .min(1, 'Informe seu e-mail')
      .max(80, 'Use até 80 caracteres')
      .pipe(z.email('Informe um e-mail válido')),
    senha: z
      .string()
      .min(1, 'Informe uma senha')
      .min(6, 'A senha precisa ter pelo menos 6 caracteres'),
    confirmacao_senha: z.string().min(1, 'Confirme a senha'),
    token_cadastro: z
      .string()
      .min(1, 'Informe o token de cadastro')
      .max(256, MENSAGEM_TOKEN_INVALIDO),
  })
  .refine(
    (valores) =>
      valores.confirmacao_senha === '' ||
      valores.senha === valores.confirmacao_senha,
    { path: ['confirmacao_senha'], message: MENSAGEM_SENHAS_DIFERENTES },
  );

export type CadastroFormInput = z.input<typeof cadastroFormSchema>;
export type CadastroFormValues = z.output<typeof cadastroFormSchema>;
export type CampoCadastro = keyof CadastroFormInput;

/** Ordem dos campos na tela, para focar o primeiro com erro. */
export const CAMPOS_CADASTRO: readonly CampoCadastro[] = [
  'nome_empresa',
  'cnpj',
  'segmento',
  'nome_usuario',
  'email',
  'senha',
  'confirmacao_senha',
  'token_cadastro',
];

/** Corpo de `POST /auth/empresa`: opcionais vazios são omitidos, sem a confirmação. */
export function toCadastroBody(
  valores: CadastroFormValues,
): CadastroEmpresaBody {
  return {
    nome_empresa: valores.nome_empresa,
    ...(valores.cnpj ? { cnpj: valores.cnpj } : {}),
    ...(valores.segmento ? { segmento: valores.segmento } : {}),
    nome_usuario: valores.nome_usuario,
    email: valores.email,
    senha: valores.senha,
    token_cadastro: valores.token_cadastro,
  };
}

// Texto em português para cada campo recusado no 400 `DADOS_INVALIDOS`: as
// mensagens do `details` vêm do class-validator, em inglês.
const MENSAGEM_DO_CAMPO_RECUSADO: Partial<Record<CampoCadastro, string>> = {
  nome_empresa: 'Informe o nome da empresa, com até 100 caracteres',
  cnpj: 'Use até 18 caracteres',
  segmento: 'Use até 80 caracteres',
  nome_usuario: 'Use até 80 caracteres',
  email: 'Informe um e-mail válido',
  senha: 'A senha precisa ter pelo menos 6 caracteres',
  token_cadastro: MENSAGEM_TOKEN_INVALIDO,
};

export type ErroDoCadastro = {
  campos: Partial<Record<CampoCadastro, string>>;
  /** Erro sem campo, num `Alert` acima do botão. */
  geral?: string;
};

/** Decide onde cada erro da API aparece, pelo `code` e, sem ele, pelo status. */
export function getCadastroErro(error: unknown): ErroDoCadastro {
  if (!(error instanceof ApiError))
    return { campos: {}, geral: MENSAGEM_ERRO_CADASTRO };

  if (temCodigo(error, 'TOKEN_CADASTRO_INVALIDO')) {
    return { campos: { token_cadastro: MENSAGEM_TOKEN_INVALIDO } };
  }

  if (error.statusCode === 409) {
    return temCodigo(error, 'CNPJ_JA_CADASTRADO')
      ? { campos: { cnpj: MENSAGEM_CNPJ_JA_CADASTRADO } }
      : { campos: { email: MENSAGEM_EMAIL_JA_CADASTRADO } };
  }

  if (error.statusCode === 429) {
    return { campos: {}, geral: MENSAGEM_MUITAS_TENTATIVAS };
  }

  if (error.statusCode === 400) {
    const campos: ErroDoCadastro['campos'] = {};

    for (const { field } of error.details) {
      const campo = CAMPOS_CADASTRO.find((nome) => nome === field);
      const mensagem = campo && MENSAGEM_DO_CAMPO_RECUSADO[campo];
      if (campo && mensagem) campos[campo] = mensagem;
    }

    if (Object.keys(campos).length > 0) return { campos };
  }

  return { campos: {}, geral: MENSAGEM_ERRO_CADASTRO };
}
