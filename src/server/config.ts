/**
 * Server configuration
 */

export interface ServerConfig {
  port: number;
  host: string;
  authToken: string | null;
  repositoryPath: string;
  dbPath: string;
}

export function createConfig(options: Partial<ServerConfig> = {}): ServerConfig {
  const repositoryPath = options.repositoryPath ?? process.cwd();

  return {
    port: options.port ?? 3847,
    host: options.host ?? 'localhost',
    authToken: options.authToken ?? process.env.CODE_REVIEW_TOKEN ?? null,
    repositoryPath,
    dbPath: options.dbPath ?? `${repositoryPath}/.code-review/reviews.db`,
  };
}
