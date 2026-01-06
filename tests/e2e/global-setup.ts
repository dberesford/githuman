import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

export default async function globalSetup () {
  const distPath = path.join(process.cwd(), 'dist/web')

  // Build frontend if not already built
  if (!existsSync(distPath)) {
    console.log('Building frontend for E2E tests...')
    execSync('npm run build', { stdio: 'inherit' })
  }
}
