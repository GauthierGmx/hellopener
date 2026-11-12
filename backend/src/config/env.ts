import { z } from 'zod'

const schema = z.object({
    NODE_ENV: z.enum(['development','test','production']).default('development'),

    DATABASE_URL: z.string().startsWith('postgresql://'),
    PORT: z.coerce.number().int().positive().default(3000),
    
    JWT_ACCESS_SECRET: z.string().min(32),
    FRONTEND_ORIGIN: z.string().min(1),    
})

const result = schema.safeParse(process.env)
if (!result.success) {
  console.error('Invalid configuration:', z.prettifyError(result.error));
  throw new Error('Invalid configuration', { cause: result.error });
}

export const env = result.data