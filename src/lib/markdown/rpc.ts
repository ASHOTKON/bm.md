import type * as z from 'zod'
import { ORPCError, os } from '@orpc/server'

interface MarkdownHandlerDefinition<TInput extends z.ZodType> {
  name: string
  inputSchema: TInput
  outputSchema: z.ZodType<{ result: string }>
}

export async function withInternalServerError<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  }
  catch (error) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', error)
  }
}

export function createMarkdownHandler<TInput extends z.ZodType>(
  definition: MarkdownHandlerDefinition<TInput>,
  run: (input: z.output<TInput>) => Promise<string>,
) {
  return os
    .route({
      method: 'POST',
      path: `/markdown/${definition.name}`,
    })
    .input(definition.inputSchema)
    .output(definition.outputSchema)
    .handler(async ({ input }) => ({
      result: await run(input as z.output<TInput>),
    }))
}
