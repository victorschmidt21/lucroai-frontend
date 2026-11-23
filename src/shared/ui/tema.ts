/**
 * Aparência (FE-52): o tema claro é o padrão; o modo noite é opcional. A escolha
 * fica no cookie `tema`, legível pelo navegador por ser só preferência visual
 * (docs/security.md), e o `RootLayout` a põe em `data-tema` no <html>.
 */
export const TEMAS = ['claro', 'noite', 'automatico'] as const;

export type Tema = (typeof TEMAS)[number];

export const TEMA_PADRAO: Tema = 'claro';

export const COOKIE_TEMA = 'tema';

/** Um ano, em segundos. */
const UM_ANO = 60 * 60 * 24 * 365;

export const OPCOES_TEMA: { value: Tema; label: string }[] = [
  { value: 'claro', label: 'Claro' },
  { value: 'noite', label: 'Noite' },
  { value: 'automatico', label: 'Igual ao celular' },
];

export function isTema(valor: unknown): valor is Tema {
  return TEMAS.some((tema) => tema === valor);
}

/** Valor do cookie `tema`; ausente ou inválido vira o claro. */
export function lerTema(valor: string | undefined | null): Tema {
  return isTema(valor) ? valor : TEMA_PADRAO;
}

/** Texto para `document.cookie`: 1 ano, `SameSite=Lax`, sem `HttpOnly`. */
export function cookieDoTema(tema: Tema, https: boolean): string {
  return [
    `${COOKIE_TEMA}=${tema}`,
    'Path=/',
    `Max-Age=${UM_ANO}`,
    'SameSite=Lax',
    ...(https ? ['Secure'] : []),
  ].join('; ');
}
