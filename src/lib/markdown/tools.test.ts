import { describe, expect, it } from 'vitest'

import { markdownTools } from './tools'

function getTool(name: string) {
  const tool = markdownTools.find(tool => tool.definition.name === name)
  if (!tool) {
    throw new Error(`缺少 Markdown 工具: ${name}`)
  }

  return tool
}

describe('markdown tools', () => {
  it('暴露 render/parse/extract/lint 四个定义', () => {
    const toolNames = markdownTools.map(tool => tool.definition.name).sort()

    expect(toolNames).toEqual(['extract', 'lint', 'parse', 'render'])
  })

  it('四个工具 run 都返回字符串结果', async () => {
    const renderResult = await getTool('render').run({ markdown: '这是一个段落' })
    const parseResult = await getTool('parse').run({ html: '<p>这是一个段落</p>' })
    const extractResult = await getTool('extract').run({ markdown: '**加粗** 文本' })
    const lintResult = await getTool('lint').run({ markdown: '# 标题\n\n这是一个段落\n' })

    expect(renderResult).toEqual(expect.any(String))
    expect(parseResult).toEqual(expect.any(String))
    expect(extractResult).toEqual(expect.any(String))
    expect(lintResult).toEqual(expect.any(String))
  })

  it('非法输入会触发 schema 校验失败', async () => {
    await expect(Promise.resolve().then(() => getTool('render').run({ markdown: 123 }))).rejects.toThrow()
  })
})
