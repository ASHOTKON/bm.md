import type * as z from 'zod'
import type { MarkdownToolDefinition, MarkdownToolName } from './definitions'
import { markdownToolDefinitions } from './definitions'

type ToolDefinitionByName<TName extends MarkdownToolName> = Extract<MarkdownToolDefinition, { name: TName }>
type ToolInput<TName extends MarkdownToolName> = z.output<ToolDefinitionByName<TName>['inputSchema']>
type ToolRunner<TName extends MarkdownToolName> = (input: ToolInput<TName>) => Promise<string>
type ToolRunners = { [TName in MarkdownToolName]: ToolRunner<TName> }

export interface MarkdownTool<TDefinition extends MarkdownToolDefinition = MarkdownToolDefinition> {
  definition: TDefinition
  run: (input: Record<string, unknown>) => Promise<string>
}

const runners = {
  render: async (input) => {
    const { render } = await import('./render/html')
    return render(input)
  },
  parse: async (input) => {
    const { parse } = await import('./parse/html')
    return parse(input.html)
  },
  extract: async (input) => {
    const { extract } = await import('./extract/text')
    return extract(input.markdown)
  },
  lint: async (input) => {
    const { lint } = await import('./lint/markdown')
    return lint(input.markdown)
  },
} satisfies ToolRunners

function runMarkdownTool(definition: MarkdownToolDefinition, input: Record<string, unknown>) {
  switch (definition.name) {
    case 'render':
      return runners.render(definition.inputSchema.parse(input))
    case 'parse':
      return runners.parse(definition.inputSchema.parse(input))
    case 'extract':
      return runners.extract(definition.inputSchema.parse(input))
    case 'lint':
      return runners.lint(definition.inputSchema.parse(input))
  }
}

export const markdownTools = markdownToolDefinitions.map(definition => ({
  definition,
  run: (input: Record<string, unknown>) => runMarkdownTool(definition, input),
})) satisfies readonly MarkdownTool[]
