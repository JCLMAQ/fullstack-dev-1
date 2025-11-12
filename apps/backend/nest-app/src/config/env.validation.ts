import { z } from 'zod';

/**
 * Schéma de validation Zod pour les variables d'environnement
 */
export const envValidationSchema = z.object({
  // NODE_ENV: z.enum(['development', 'production', 'test', 'provision']).default('development'),
  // NEST_SERVER_PORT: z.number().default(3100),
  JWT_VALIDITY_DURATION: z.string().default('240s'),
});

export type EnvConfig = z.infer<typeof envValidationSchema>;

/**
 * Fonction de validation des variables d'environnement pour NestJS ConfigModule
 * Convertit les erreurs Zod en format attendu par NestJS
 */
export function validateEnvironment(config: Record<string, unknown>): EnvConfig {
  const result = envValidationSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues.map(issue =>
      `${issue.path.join('.')}: ${issue.message}`
    ).join(', ');

    throw new Error(`Configuration validation failed: ${errors}`);
  }

  return result.data;
}
