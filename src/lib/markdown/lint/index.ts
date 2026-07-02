import type * as z from 'zod'
import { createMarkdownHandler, withInternalServerError } from '../rpc'
import { lintDefinition } from './definition'

export { lintDefinition } from './definition'

export async function lint({ markdown }: z.infer<typeof lintDefinition.inputSchema>) {
  return withInternalServerError(async () => {
    const { lint } = await import('./markdown')
    return lint(markdown)
  })
}

export const handler = createMarkdownHandler(lintDefinition, lint)
