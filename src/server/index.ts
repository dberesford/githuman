/**
 * Server entry point
 */
import closeWithGrace from 'close-with-grace'
import { networkInterfaces } from 'node:os'
import { buildApp, type AppOptions } from './app.ts'
import { initDatabase, closeDatabase } from './db/index.ts'
import type { ServerConfig } from './config.ts'

/**
 * Get all IPv4 addresses to display when server binds to 0.0.0.0
 */
function getNetworkAddresses (): string[] {
  const addresses: string[] = ['127.0.0.1']
  const interfaces = networkInterfaces()

  for (const nets of Object.values(interfaces)) {
    if (!nets) continue
    for (const net of nets) {
      // Include non-internal IPv4 addresses
      if (!net.internal && net.family === 'IPv4') {
        addresses.push(net.address)
      }
    }
  }

  return addresses
}

export async function startServer (config: ServerConfig, options: AppOptions = {}): Promise<void> {
  // Initialize database
  initDatabase(config.dbPath)

  // Build and start the app
  const app = await buildApp(config, options)

  // Graceful shutdown with timeout
  closeWithGrace({ delay: 5000 }, async ({ signal, err }) => {
    if (err) {
      app.log.error({ err }, 'Server closing due to error')
    } else {
      app.log.info({ signal }, 'Server shutting down')
    }
    await app.close()
    closeDatabase()
  })

  try {
    await app.listen({ port: config.port, host: config.host })

    // Log URLs with token for easy access (double-clickable in terminals)
    if (config.authToken) {
      const serverAddr = app.addresses().find(a => a.family === 'IPv4')
      if (serverAddr) {
        // If bound to 0.0.0.0, show all network addresses
        const addresses = serverAddr.address === '0.0.0.0'
          ? getNetworkAddresses()
          : [serverAddr.address]

        for (const addr of addresses) {
          const url = `http://${addr}:${serverAddr.port}?token=${config.authToken}`
          app.log.info(`GitHuman running at: ${url}`)
        }
      }
      app.log.info('Authentication enabled')
    }
  } catch (err) {
    app.log.error(err)
    closeDatabase()
    process.exit(1)
  }
}

export { buildApp } from './app.ts'
export { createConfig } from './config.ts'
export type { ServerConfig } from './config.ts'
