import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'
import * as z from 'zod'

import { lintDefinition, renderDefinition } from '../lib/markdown/definitions'
import { buildInput, defineCliTool, formatError, handleCommand } from './core'

const tempDirs: string[] = []

async function createTempDir() {
  const dir = await mkdtemp(join(tmpdir(), 'bmmd-cli-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

describe('cli core', () => {
  it('格式化 Zod 错误时包含字段路径', () => {
    const schema = z.object({ markdown: z.string() })
    const result = schema.safeParse({ markdown: 123 })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(formatError(result.error)).toContain('markdown:')
    }
  })

  it('--fix 需要输入文件', async () => {
    const tool = defineCliTool(lintDefinition, async input => input.markdown)

    await expect(handleCommand(tool, undefined, { fix: true })).rejects.toThrow('--fix 需要提供输入文件')
  })

  it('--fix 不能与 --output 同时使用', async () => {
    const tool = defineCliTool(lintDefinition, async input => input.markdown)

    await expect(handleCommand(tool, 'input.md', { fix: true, output: 'out.md' })).rejects.toThrow('--fix 不能与 --output 同时使用')
  })

  it('customCssFile 内容追加在 inline customCss 后面', async () => {
    const dir = await createTempDir()
    const inputFile = join(dir, 'input.md')
    const cssFile = join(dir, 'style.css')
    await writeFile(inputFile, '# 标题')
    await writeFile(cssFile, '.file { color: red; }')

    const input = await buildInput(renderDefinition, inputFile, {
      customCss: '.inline { color: blue; }',
      customCssFile: cssFile,
    })

    expect(input.customCss).toBe('.inline { color: blue; }\n.file { color: red; }')
  })
})
