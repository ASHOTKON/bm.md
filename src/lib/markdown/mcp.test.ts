import { describe, expect, it } from 'vitest'

import { handleMcpRequest } from '@/utils/mcp-handler'
import { createMarkdownMcpServer } from './mcp'

interface ToolsListResponse {
  result?: {
    tools?: Array<{ name: string }>
  }
}

describe('markdown MCP server', () => {
  it('通过 tools/list 暴露四个 Markdown 工具', async () => {
    const response = await handleMcpRequest(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
      }),
      createMarkdownMcpServer(),
    )
    const data = await response.json() as ToolsListResponse
    const toolNames = data.result?.tools?.map(tool => tool.name).sort()

    expect(toolNames).toEqual(['extract', 'lint', 'parse', 'render'])
  })
})
