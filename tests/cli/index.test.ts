import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { spawn, execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = join(__dirname, '../../src/cli/index.ts');

// Create temp directories for tests
let tempDir: string;
let todoTempDir: string;

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

async function runCli(args: string[], options?: { cwd?: string }): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      env: { ...process.env },
      cwd: options?.cwd,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}

describe('CLI', () => {
  describe('main entry', () => {
    it('should show help with --help flag', async () => {
      const result = await runCli(['--help']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Local Code Reviewer'));
      assert.ok(result.stdout.includes('Usage:'));
      assert.ok(result.stdout.includes('serve'));
      assert.ok(result.stdout.includes('list'));
    });

    it('should show help with -h flag', async () => {
      const result = await runCli(['-h']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Local Code Reviewer'));
    });

    it('should show version with --version flag', async () => {
      const result = await runCli(['--version']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('code-review v0.1.0'));
    });

    it('should show version with -v flag', async () => {
      const result = await runCli(['-v']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('v0.1.0'));
    });

    it('should show help when no command provided', async () => {
      const result = await runCli([]);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage:'));
    });

    it('should error on unknown command', async () => {
      const result = await runCli(['unknown']);

      assert.strictEqual(result.exitCode, 1);
      // Message goes to stderr
      assert.ok(result.stderr.includes('Unknown command: unknown'));
    });
  });

  describe('serve command', () => {
    it('should show help with --help flag', async () => {
      const result = await runCli(['serve', '--help']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage: code-review serve'));
      assert.ok(result.stdout.includes('--port'));
      assert.ok(result.stdout.includes('--host'));
      assert.ok(result.stdout.includes('--auth'));
      assert.ok(result.stdout.includes('--no-open'));
    });

    it('should show help with -h flag', async () => {
      const result = await runCli(['serve', '-h']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage: code-review serve'));
    });
  });

  describe('list command', () => {
    before(() => {
      // Create temp directory without any database
      tempDir = mkdtempSync(join(tmpdir(), 'cli-test-'));
    });

    after(() => {
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should show help with --help flag', async () => {
      const result = await runCli(['list', '--help']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage: code-review list'));
      assert.ok(result.stdout.includes('--status'));
      assert.ok(result.stdout.includes('--json'));
    });

    it('should show help with -h flag', async () => {
      const result = await runCli(['list', '-h']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage: code-review list'));
    });

    it('should show no reviews message when database does not exist', async () => {
      // Run from temp directory which has no database
      const result = await runCli(['list'], { cwd: tempDir });

      assert.strictEqual(result.exitCode, 0);
      assert.ok(
        result.stdout.includes('No reviews found')
      );
    });

    it('should output empty array with --json when no reviews', async () => {
      // Run from temp directory which has no database
      const result = await runCli(['list', '--json'], { cwd: tempDir });

      assert.strictEqual(result.exitCode, 0);
      // Either empty array or "No reviews found" message
      const output = result.stdout.trim();
      assert.ok(
        output === '[]' || output.includes('No reviews found')
      );
    });
  });

  describe('todo command', () => {
    before(() => {
      // Create temp git repo for todo tests
      todoTempDir = mkdtempSync(join(tmpdir(), 'todo-cli-test-'));
      execSync('git init', { cwd: todoTempDir, stdio: 'ignore' });
      execSync('git config user.email "test@test.com"', { cwd: todoTempDir, stdio: 'ignore' });
      execSync('git config user.name "Test"', { cwd: todoTempDir, stdio: 'ignore' });
    });

    after(() => {
      if (todoTempDir) {
        rmSync(todoTempDir, { recursive: true, force: true });
      }
    });

    it('should show help with --help flag', async () => {
      const result = await runCli(['todo', '--help']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage: code-review todo'));
      assert.ok(result.stdout.includes('add'));
      assert.ok(result.stdout.includes('list'));
      assert.ok(result.stdout.includes('done'));
      assert.ok(result.stdout.includes('remove'));
    });

    it('should show help with -h flag', async () => {
      const result = await runCli(['todo', '-h']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Usage: code-review todo'));
    });

    it('should show no todos message when database does not exist', async () => {
      const result = await runCli(['todo', 'list'], { cwd: todoTempDir });

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('No todos found'));
    });

    it('should output empty array with --json when no todos', async () => {
      const result = await runCli(['todo', 'list', '--json'], { cwd: todoTempDir });

      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), '[]');
    });

    it('should add a todo', async () => {
      const result = await runCli(['todo', 'add', 'Test todo item'], { cwd: todoTempDir });

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Created todo'));
      assert.ok(result.stdout.includes('Test todo item'));
    });

    it('should list todos after adding', async () => {
      const result = await runCli(['todo', 'list'], { cwd: todoTempDir });

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('Test todo item'));
      assert.ok(result.stdout.includes('[ ]')); // pending
    });

    it('should add todo with --json output', async () => {
      const result = await runCli(['todo', 'add', 'JSON test todo', '--json'], { cwd: todoTempDir });

      assert.strictEqual(result.exitCode, 0);
      const data = JSON.parse(result.stdout);
      assert.strictEqual(data.content, 'JSON test todo');
      assert.strictEqual(data.completed, false);
    });

    it('should require content for add', async () => {
      const result = await runCli(['todo', 'add'], { cwd: todoTempDir });

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('content is required'));
    });

    it('should require --done flag for clear', async () => {
      const result = await runCli(['todo', 'clear'], { cwd: todoTempDir });

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('--done flag is required'));
    });
  });
});
