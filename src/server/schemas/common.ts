/**
 * Common TypeBox schemas shared across routes
 */
import { Type } from '@fastify/type-provider-typebox';

export const ErrorSchema = Type.Object(
  {
    error: Type.String({ description: 'Error message' }),
    code: Type.Optional(Type.String({ description: 'Error code' })),
  },
  { description: 'Error response' }
);

export const SuccessSchema = Type.Object(
  {
    success: Type.Boolean({ description: 'Operation success status' }),
  },
  { description: 'Success response' }
);

export const HealthResponseSchema = Type.Object(
  {
    status: Type.Literal('ok'),
    authRequired: Type.Boolean({ description: 'Whether authentication is required' }),
  },
  { description: 'Health check response' }
);
