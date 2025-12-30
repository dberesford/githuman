/**
 * Server entry point
 */
import { buildApp } from './app.ts';
import { initDatabase, closeDatabase } from './db/index.ts';
import type { ServerConfig } from './config.ts';

export async function startServer(config: ServerConfig): Promise<void> {
  // Initialize database
  initDatabase(config.dbPath);

  // Build and start the app
  const app = await buildApp(config);

  // Graceful shutdown
  const shutdown = async () => {
    await app.close();
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ port: config.port, host: config.host });
    console.log(`Server running at http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    closeDatabase();
    process.exit(1);
  }
}

export { buildApp } from './app.ts';
export { createConfig } from './config.ts';
export type { ServerConfig } from './config.ts';
