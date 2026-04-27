import type * as z from 'zod'
import { ORPCError, os } from '@orpc/server'
import { extractDefinition } from './definition'

export { extractDefinition } from './definition'

export async function extract(input: z.infer<typeof extractDefinition.inputSchema>) {
  try {
    const { extract } = await import('./text')
    return extract(input.markdown)
  }
  catch (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', error)
  }
}

export const handler = os
  .route({
    method: 'POST',
    path: '/markdown/extract',
  })
  .input(extractDefinition.inputSchema)
  .output(extractDefinition.outputSchema)
  .handler(async ({ input }) => ({
    result: await extract(input),
  }))
