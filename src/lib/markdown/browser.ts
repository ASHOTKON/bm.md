import type { RouterClient } from '@orpc/server'
import type { workerRouter } from './worker-router'
import { createORPCClient, onError } from '@orpc/client'
import { RPCLink } from '@orpc/client/message-port'

type Client = RouterClient<typeof workerRouter>

let workerPromise: Promise<Client> | null = null

function logSafeError(context: string, error: unknown) {
  const errorLike = error as { code?: unknown, status?: unknown }
  console.error(context, {
    type: error instanceof Error ? error.name : typeof error,
    code: typeof errorLike.code === 'string' ? errorLike.code : undefined,
    status: typeof errorLike.status === 'number' ? errorLike.status : undefined,
  })
}

function getWorker() {
  return workerPromise ??= (async () => {
    // 动态导入 Worker，避免 SSR 时执行
    const { default: MarkdownWorker } = await import('./worker?worker')
    const link = new RPCLink({
      port: new MarkdownWorker(),
      interceptors: [onError(error => logSafeError('Markdown browser RPC error', error))],
    })
    return createORPCClient(link) as Client
  })()
}

export const markdown: Client['markdown'] = {
  render: (...input) => getWorker().then(w => w.markdown.render(...input)),
  preview: (...input) => getWorker().then(w => w.markdown.preview(...input)),
  parse: (...input) => getWorker().then(w => w.markdown.parse(...input)),
  extract: (...input) => getWorker().then(w => w.markdown.extract(...input)),
  lint: (...input) => getWorker().then(w => w.markdown.lint(...input)),
}

export const worker: { prepare: () => Promise<Client> } = {
  prepare: () => getWorker(),
}
