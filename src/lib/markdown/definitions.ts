import { extractDefinition } from './extract/definition'
import { lintDefinition } from './lint/definition'
import { parseDefinition } from './parse/definition'
import { renderDefinition } from './render/definition'

export { extractDefinition } from './extract/definition'
export { lintDefinition } from './lint/definition'
export { parseDefinition } from './parse/definition'
export { renderDefinition } from './render/definition'
export type { CliDefinition, CliOptionDefinition } from './types/definition'

export const markdownToolDefinitions = [
  renderDefinition,
  parseDefinition,
  extractDefinition,
  lintDefinition,
] as const

export type MarkdownToolDefinition = typeof markdownToolDefinitions[number]
export type MarkdownToolName = MarkdownToolDefinition['name']
