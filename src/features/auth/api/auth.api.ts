import type {
  CadastroEmpresaBody,
  LoginBody,
} from '@/shared/api/contracts/auth';
import { bffFetch } from '@/shared/auth/bff-client';

/**
 * `POST /api/auth/login`: o Next autentica no auth-service e grava o token no
 * cookie `httpOnly`. Responde 204, sem o token; erro como `ApiError`.
 */
export async function login(credenciais: LoginBody) {
  await bffFetch('/api/auth/login', { method: 'POST', body: credenciais });
}

/**
 * `POST /api/auth/cadastro` (FE-48): o Next cria a empresa com o token de
 * cadastro e grava o JWT no cookie `httpOnly`, como no login. Responde 204.
 */
export async function cadastrar(dados: CadastroEmpresaBody) {
  await bffFetch('/api/auth/cadastro', { method: 'POST', body: dados });
}

/** `POST /api/auth/logout`: só apaga o cookie (o backend não tem logout). */
export async function logout() {
  await bffFetch('/api/auth/logout', { method: 'POST' });
}
