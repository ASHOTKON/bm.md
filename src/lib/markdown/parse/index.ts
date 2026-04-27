import type * as z from 'zod'
import { ORPCError, os } from '@orpc/server'
import { parseDefinition } from './definition'

export { parseDefinition } from './definition'

export async function parse(input: z.infer<typeof parseDefinition.inputSchema>) {
  try {
    const { parse } = await import('./html')
    return parse(input.html)
  }
  catch (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', error)
  }
}

export const handler = os
  .route({
    method: 'POST',
    path: '/markdown/parse',
  })
  .input(parseDefinition.inputSchema)
  .output(parseDefinition.outputSchema)
  .handler(async ({ input }) => ({
    result: await parse(input),
  }))
