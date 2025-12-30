/**
 * Optional token authentication plugin
 */
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export interface AuthPluginOptions {
  token: string | null;
}

const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (
  fastify,
  options
) => {
  const { token } = options;

  // If no token configured, skip authentication
  if (!token) {
    fastify.decorate('authEnabled', false);
    return;
  }

  fastify.decorate('authEnabled', true);

  fastify.addHook('preHandler', async (request, reply) => {
    // Skip auth for health endpoint
    if (request.url === '/api/health') {
      return;
    }

    // Skip auth for static files
    if (!request.url.startsWith('/api/')) {
      return;
    }

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
        statusCode: 401,
      });
    }

    const providedToken = header.slice(7);
    if (providedToken !== token) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid token',
        statusCode: 401,
      });
    }
  });
};

export default fp(authPlugin, {
  name: 'auth',
});

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    authEnabled: boolean;
  }
}
