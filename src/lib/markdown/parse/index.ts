import type * as z from 'zod'
import { createMarkdownHandler, withInternalServerError } from '../rpc'
import { parseDefinition } from './definition'

export { parseDefinition } from './definition'

export async function parse(input: z.infer<typeof parseDefinition.inputSchema>) {
  return withInternalServerError(async () => {
    const { parse } = await import('./html')
    return parse(input.html)
  })
}

export const handler = createMarkdownHandler(parseDefinition, parse)
