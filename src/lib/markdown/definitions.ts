import type * as z from 'zod'
import { extractDefinition } from './extract/definition'
import { extract } from './extract/text'
import { lintDefinition } from './lint/definition'
import { lint } from './lint/markdown'
import { parseDefinition } from './parse/definition'
import { parse } from './parse/html'
import { renderDefinition } from './render/definition'
import { render } from './render/html'

export { extractDefinition } from './extract/definition'
export { lintDefinition } from './lint/definition'
export { parseDefinition } from './parse/definition'
export { renderDefinition } from './render/definition'
export type { CliDefinition, CliOptionDefinition } from './types/definition'

function defineMarkdownTool<const TDefinition extends { inputSchema: z.ZodType }>(
  definition: TDefinition,
  run: (input: z.output<TDefinition['inputSchema']>) => Promise<string>,
) {
  return {
    ...definition,
    run,
  }
}

// 管线实现必须顶层 eager import：边缘运行时按请求 CPU 计费，
// 请求内 dynamic import 会把整条 unified/markdownlint 管线的模块求值
// 落进首个 tools/call（实测 50-80ms CPU），直接顶爆 ESA 100ms 规格。
export const markdownTools = [
  defineMarkdownTool(renderDefinition, async input => render(input)),
  defineMarkdownTool(parseDefinition, async input => parse(input.html)),
  defineMarkdownTool(extractDefinition, async input => extract(input.markdown)),
  defineMarkdownTool(lintDefinition, async input => lint(input.markdown)),
] as const

export type MarkdownTool = typeof markdownTools[number]
export type MarkdownToolName = MarkdownTool['name']

export function runMarkdownTool<TTool extends MarkdownTool>(
  tool: TTool,
  input: z.output<TTool['inputSchema']>,
): Promise<string> {
  const run = tool.run as (input: unknown) => Promise<string>
  return run(input)
}
