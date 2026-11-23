// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cookieDoTema, lerTema } from './tema';

describe('lerTema', () => {
  it.each(['claro', 'noite', 'automatico'] as const)('aceita %s', (tema) => {
    expect(lerTema(tema)).toBe(tema);
  });

  it.each([undefined, null, '', 'escuro', 'NOITE', 'dark'])(
    'devolve claro para %s',
    (valor) => {
      expect(lerTema(valor)).toBe('claro');
    },
  );
});

describe('cookieDoTema', () => {
  it('grava por um ano, com SameSite=Lax e sem HttpOnly', () => {
    expect(cookieDoTema('noite', false)).toBe(
      'tema=noite; Path=/; Max-Age=31536000; SameSite=Lax',
    );
  });

  it('marca Secure em HTTPS', () => {
    expect(cookieDoTema('automatico', true)).toBe(
      'tema=automatico; Path=/; Max-Age=31536000; SameSite=Lax; Secure',
    );
  });
});
