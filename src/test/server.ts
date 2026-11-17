import { setupServer } from 'msw/node';

/** Servidor único do MSW. Cada teste declara as respostas com `server.use(...)`. */
export const server = setupServer();
