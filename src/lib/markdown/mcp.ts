import type * as z from 'zod'
import type { MarkdownTool } from './tools'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { name, version } from '@/package.json'
import { markdownTools } from './tools'

function formatToolResult(result: string) {
  const output = { result }
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(output) }],
    structuredContent: output,
  }
}

interface McpToolConfig {
  title: string
  description: string
  inputSchema: z.ZodType
  outputSchema: z.ZodType
}

function registerMarkdownTool(
  server: McpServer,
  tool: MarkdownTool,
) {
  const config: McpToolConfig = {
    title: tool.definition.title,
    description: tool.definition.description,
    inputSchema: tool.definition.inputSchema,
    outputSchema: tool.definition.outputSchema,
  }

  server.registerTool(
    tool.definition.name,
    config,
    async input => formatToolResult(await tool.run(input as Record<string, unknown>)),
  )
}

export function createMarkdownMcpServer() {
  const server = new McpServer({ name, version })

  for (const tool of markdownTools) {
    registerMarkdownTool(server, tool)
  }

  return server
}
