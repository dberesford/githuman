import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const TEST_REPO_PATH = join(tmpdir(), 'githuman-e2e-test-repo')

export default async function globalTeardown () {
  // Clean up the test repo
  if (existsSync(TEST_REPO_PATH)) {
    console.log(`Cleaning up test repo at: ${TEST_REPO_PATH}`)
    rmSync(TEST_REPO_PATH, { recursive: true, force: true })
  }
}
