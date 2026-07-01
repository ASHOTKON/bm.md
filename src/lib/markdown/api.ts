import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { onError } from '@orpc/server'
import { CORSPlugin } from '@orpc/server/plugins'
import { router } from './router'

function logSafeError(context: string, error: unknown) {
  const errorLike = error as { code?: unknown, status?: unknown }
  console.error(context, {
    type: error instanceof Error ? error.name : typeof error,
    code: typeof errorLike.code === 'string' ? errorLike.code : undefined,
    status: typeof errorLike.status === 'number' ? errorLike.status : undefined,
  })
}

export const handler = new OpenAPIHandler(router, {
  plugins: [new CORSPlugin()],
  interceptors: [onError(error => logSafeError('Markdown API error', error))],
})
