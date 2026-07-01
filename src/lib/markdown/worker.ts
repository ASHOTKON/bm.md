import { onError } from '@orpc/server'
import { RPCHandler } from '@orpc/server/message-port'
import { workerRouter } from './worker-router'

function logSafeError(context: string, error: unknown) {
  const errorLike = error as { code?: unknown, status?: unknown }
  console.error(context, {
    type: error instanceof Error ? error.name : typeof error,
    code: typeof errorLike.code === 'string' ? errorLike.code : undefined,
    status: typeof errorLike.status === 'number' ? errorLike.status : undefined,
  })
}

const handler = new RPCHandler(workerRouter, {
  interceptors: [onError(error => logSafeError('Markdown worker error', error))],
})

handler.upgrade(globalThis.self as unknown as MessagePort)
