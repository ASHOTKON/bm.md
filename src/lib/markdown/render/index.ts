import type * as z from 'zod'
import { ORPCError, os } from '@orpc/server'
import { renderDefinition } from './definition'

export {
  codeThemeSchema,
  infographicPaletteSchema,
  infographicThemeSchema,
  markdownStyleSchema,
  mermaidThemeSchema,
  platformSchema,
  renderDefinition,
} from './definition'

export async function render(input: z.infer<typeof renderDefinition.inputSchema>) {
  try {
    const { render } = await import('./html')
    return render(input)
  }
  catch (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', error)
  }
}

export const handler = os
  .route({
    method: 'POST',
    path: '/markdown/render',
  })
  .input(renderDefinition.inputSchema)
  .output(renderDefinition.outputSchema)
  .handler(async ({ input }) => ({
    result: await render(input),
  }))
