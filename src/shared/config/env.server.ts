import 'server-only';
import { parseEnv, serverEnvSchema } from './env.schema';

/**
 * Lê no momento da chamada, e não ao importar o módulo: o `next build` carrega
 * as rotas sem ter as variáveis de execução, que só existem ao subir o servidor.
 * O schema descarta tudo o que não declara, então só as URLs saem daqui.
 */
export function getServerEnv() {
  return parseEnv(serverEnvSchema, process.env);
}
