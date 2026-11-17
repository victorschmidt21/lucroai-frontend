import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

// Requisição sem handler falha o teste, para nenhuma chamada passar despercebida.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
