import { createApp } from '../../src/app.js'
import {
  closeRealtime,
  initializeRealtime,
} from '../../src/realtime/socketServer.js'

/**
 * Start the app on an ephemeral loopback port, run the callback, and always
 * close the server and Socket.IO. Tests therefore do not need supertest or a
 * live external database.
 */
export async function withServer(run) {
  const app = createApp()
  const server = app.listen(0, '127.0.0.1')

  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const { port } = server.address()
  const io = initializeRealtime(server)

  try {
    await run({ baseUrl: `http://127.0.0.1:${port}`, port, io })
  } finally {
    await closeRealtime()

    await new Promise((resolve) => {
      if (!server.listening) return resolve()
      server.close(resolve)
      server.closeAllConnections?.()
    })
  }
}
