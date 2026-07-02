import { os } from '@orpc/server'
import * as z from 'zod'
import { createMarkdownHandler, withInternalServerError } from '../rpc'
import { renderDefinition } from './definition'

export { renderDefinition } from './definition'

export async function render(input: z.infer<typeof renderDefinition.inputSchema>) {
  return withInternalServerError(async () => {
    const { render } = await import('./html')
    return render(input)
  })
}

async function renderPreview(input: z.infer<typeof renderDefinition.inputSchema>) {
  return withInternalServerError(async () => {
    const { renderPreview } = await import('./html')
    return renderPreview(input)
  })
}

export const handler = createMarkdownHandler(renderDefinition, render)

export const previewHandler = os
  .input(renderDefinition.inputSchema)
  .output(z.object({
    html: z.string(),
    css: z.string(),
  }))
  .handler(async ({ input }) => renderPreview(input))
