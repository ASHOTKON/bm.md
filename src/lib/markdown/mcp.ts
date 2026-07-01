import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { name, version } from '@/package.json'
import { extract, extractDefinition } from './extract'
import { lint, lintDefinition } from './lint'
import { parse, parseDefinition } from './parse'
import { render, renderDefinition } from './render'

function formatToolResult(result: string) {
  const output = { result }
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(output) }],
    structuredContent: output,
  }
}

export function createMarkdownMcpServer() {
  const server = new McpServer({ name, version })

  server.registerTool(
    renderDefinition.name,
    renderDefinition,
    async input => formatToolResult(await render(input)),
  )

  server.registerTool(
    parseDefinition.name,
    parseDefinition,
    async input => formatToolResult(await parse(input)),
  )

  server.registerTool(
    extractDefinition.name,
    extractDefinition,
    async input => formatToolResult(await extract(input)),
  )

  server.registerTool(
    lintDefinition.name,
    lintDefinition,
    async input => formatToolResult(await lint(input)),
  )

  return server
}
