import { join } from 'node:path'
import { tmpdir } from 'node:os'

// Test repo path - must match global-setup.ts
export const TEST_REPO_PATH = join(tmpdir(), 'githuman-e2e-test-repo')

// Helper to generate unique test identifiers
export const uid = () => Math.random().toString(36).substring(2, 8)
