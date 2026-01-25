/**
 * Self-signed TLS certificate generation and management
 */
import selfsigned from 'selfsigned'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const CERT_FILENAME = 'cert.pem'
const KEY_FILENAME = 'key.pem'

/**
 * Get the GitHuman config directory (~/.githuman/)
 */
export function getGithumanDir (): string {
  return join(homedir(), '.githuman')
}

/**
 * Get paths to certificate and key files
 */
export function getCertificatePaths (): { certPath: string; keyPath: string } {
  const dir = getGithumanDir()
  return {
    certPath: join(dir, CERT_FILENAME),
    keyPath: join(dir, KEY_FILENAME),
  }
}

/**
 * Check if certificates already exist
 */
export function certificatesExist (): boolean {
  const { certPath, keyPath } = getCertificatePaths()
  return existsSync(certPath) && existsSync(keyPath)
}

/**
 * Generate a self-signed certificate using selfsigned package
 */
export async function generateSelfSignedCertificate (): Promise<{ cert: string; key: string }> {
  const attrs = [{ name: 'commonName', value: 'githuman' }]
  const opts = {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256' as const,
  }

  const pems = await selfsigned.generate(attrs, opts)
  return {
    cert: pems.cert,
    key: pems.private,
  }
}

/**
 * Save certificates to disk
 */
function saveCertificates (cert: string, key: string): void {
  const dir = getGithumanDir()
  const { certPath, keyPath } = getCertificatePaths()

  // Create directory if it doesn't exist
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 })
  }

  // Write certificates with restrictive permissions
  writeFileSync(certPath, cert, { mode: 0o600 })
  writeFileSync(keyPath, key, { mode: 0o600 })
}

/**
 * Load existing certificates from disk
 */
function loadCertificates (): { cert: string; key: string } {
  const { certPath, keyPath } = getCertificatePaths()
  return {
    cert: readFileSync(certPath, 'utf-8'),
    key: readFileSync(keyPath, 'utf-8'),
  }
}

/**
 * Load existing certificates or create new ones if they don't exist
 */
export async function loadOrCreateCertificates (): Promise<{ cert: string; key: string }> {
  if (certificatesExist()) {
    return loadCertificates()
  }

  const { cert, key } = await generateSelfSignedCertificate()
  saveCertificates(cert, key)
  return { cert, key }
}
