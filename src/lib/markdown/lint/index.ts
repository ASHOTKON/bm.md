import type * as z from 'zod'
import { ORPCError, os } from '@orpc/server'
import { lintDefinition } from './definition'

export { lintDefinition } from './definition'

export async function lint({ markdown }: z.infer<typeof lintDefinition.inputSchema>) {
  try {
    const { lint } = await import('./markdown')
    return lint(markdown)
  }
  catch (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', error)
  }
}

export const handler = os
  .route({
    method: 'POST',
    path: '/markdown/lint',
  })
  .input(lintDefinition.inputSchema)
  .output(lintDefinition.outputSchema)
  .handler(async ({ input }) => ({
    result: await lint(input),
  }))
