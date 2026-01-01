/**
 * Server configuration
 */
import { execSync } from 'node:child_process';

export interface ServerConfig {
  port: number;
  host: string;
  authToken: string | null;
  repositoryPath: string;
  dbPath: string;
}

/**
 * Try to find the git repository root from a given path
 */
function findGitRoot(fromPath: string): string | null {
  try {
    const result = execSync('git rev-parse --show-toplevel', {
      cwd: fromPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim();
  } catch {
    return null;
  }
}

export function createConfig(options: Partial<ServerConfig> = {}): ServerConfig {
  // Priority for repository path:
  // 1. Explicit option
  // 2. Git repo root from cwd
  // 3. Current working directory
  const gitRoot = findGitRoot(process.cwd());
  const repositoryPath = options.repositoryPath ?? gitRoot ?? process.cwd();

  // Priority for db path:
  // 1. Explicit option
  // 2. CODE_REVIEW_DB_PATH environment variable
  // 3. Default to .code-review/reviews.db in repository root
  const defaultDbPath = `${repositoryPath}/.code-review/reviews.db`;
  const dbPath = options.dbPath ?? process.env.CODE_REVIEW_DB_PATH ?? defaultDbPath;

  return {
    port: options.port ?? 3847,
    host: options.host ?? 'localhost',
    authToken: options.authToken ?? process.env.CODE_REVIEW_TOKEN ?? null,
    repositoryPath,
    dbPath,
  };
}
