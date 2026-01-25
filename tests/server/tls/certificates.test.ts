import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// We need to mock homedir for tests
const originalHome = process.env.HOME

describe('certificates', () => {
  let tempHome: string

  before(() => {
    // Create a temp directory to use as HOME
    tempHome = mkdtempSync(join(tmpdir(), 'githuman-cert-test-'))
    process.env.HOME = tempHome
  })

  after(() => {
    // Restore original HOME
    process.env.HOME = originalHome
    // Clean up temp directory
    if (tempHome) {
      rmSync(tempHome, { recursive: true, force: true })
    }
  })

  // Import dynamically after setting HOME
  async function getCertModule () {
    // Clear module cache to get fresh module with new HOME
    const modulePath = '../../../src/server/tls/certificates.ts'
    return import(modulePath)
  }

  describe('getGithumanDir', () => {
    it('should return ~/.githuman path', async () => {
      const { getGithumanDir } = await getCertModule()
      const dir = getGithumanDir()
      assert.strictEqual(dir, join(tempHome, '.githuman'))
    })
  })

  describe('getCertificatePaths', () => {
    it('should return paths to cert.pem and key.pem', async () => {
      const { getCertificatePaths } = await getCertModule()
      const { certPath, keyPath } = getCertificatePaths()
      assert.strictEqual(certPath, join(tempHome, '.githuman', 'cert.pem'))
      assert.strictEqual(keyPath, join(tempHome, '.githuman', 'key.pem'))
    })
  })

  describe('certificatesExist', () => {
    it('should return false when no certificates exist', async () => {
      const { certificatesExist } = await getCertModule()
      assert.strictEqual(certificatesExist(), false)
    })
  })

  describe('generateSelfSignedCertificate', () => {
    it('should generate valid PEM certificate and key', async () => {
      const { generateSelfSignedCertificate } = await getCertModule()
      const { cert, key } = await generateSelfSignedCertificate()

      // Check that cert and key are valid PEM format
      assert.ok(cert.includes('-----BEGIN CERTIFICATE-----'))
      assert.ok(cert.includes('-----END CERTIFICATE-----'))
      assert.ok(key.includes('-----BEGIN RSA PRIVATE KEY-----') ||
                key.includes('-----BEGIN PRIVATE KEY-----'))
    })
  })

  describe('loadOrCreateCertificates', () => {
    it('should create certificates if they do not exist', async () => {
      const { loadOrCreateCertificates, getCertificatePaths, certificatesExist } = await getCertModule()

      // Certificates should not exist yet
      assert.strictEqual(certificatesExist(), false)

      // Create certificates
      const { cert, key } = await loadOrCreateCertificates()

      // Check that they are valid PEM
      assert.ok(cert.includes('-----BEGIN CERTIFICATE-----'))
      assert.ok(key.includes('-----BEGIN RSA PRIVATE KEY-----') ||
                key.includes('-----BEGIN PRIVATE KEY-----'))

      // Check that files were created
      const { certPath, keyPath } = getCertificatePaths()
      assert.ok(existsSync(certPath))
      assert.ok(existsSync(keyPath))

      // Verify file contents match returned values
      assert.strictEqual(readFileSync(certPath, 'utf-8'), cert)
      assert.strictEqual(readFileSync(keyPath, 'utf-8'), key)
    })

    it('should load existing certificates', async () => {
      const { loadOrCreateCertificates } = await getCertModule()

      // First call creates them
      const first = await loadOrCreateCertificates()

      // Second call should load the same ones
      const second = await loadOrCreateCertificates()

      assert.strictEqual(first.cert, second.cert)
      assert.strictEqual(first.key, second.key)
    })
  })
})
