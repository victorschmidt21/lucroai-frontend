import { parseEnv, publicEnvSchema } from './env.schema';

// Cada variável precisa ser citada por extenso: o Next.js só incorpora ao bundle
// referências literais a process.env.NEXT_PUBLIC_*.
export const publicEnv = parseEnv(publicEnvSchema, {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
