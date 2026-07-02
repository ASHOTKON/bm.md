import type * as z from 'zod'
import { createMarkdownHandler, withInternalServerError } from '../rpc'
import { extractDefinition } from './definition'

export { extractDefinition } from './definition'

export async function extract(input: z.infer<typeof extractDefinition.inputSchema>) {
  return withInternalServerError(async () => {
    const { extract } = await import('./text')
    return extract(input.markdown)
  })
}

export const handler = createMarkdownHandler(extractDefinition, extract)
