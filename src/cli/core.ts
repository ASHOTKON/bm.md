import type * as z from 'zod'
import type { CliOptionDefinition, MarkdownToolDefinition } from '../lib/markdown/definitions'

import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

import { ZodError } from 'zod'

export type CliOptions = Record<string, unknown>

export interface CliTool {
  definition: MarkdownToolDefinition
  run: (input: Record<string, unknown>) => Promise<string>
}

export function defineCliTool<TSchema extends z.ZodType>(
  definition: MarkdownToolDefinition & { inputSchema: TSchema },
  handler: (input: z.output<TSchema>) => Promise<string>,
): CliTool {
  return {
    definition,
    run: input => handler(definition.inputSchema.parse(input)),
  }
}

export function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map(issue => `${issue.path.join('.') || 'input'}: ${issue.message}`)
      .join('\n')
  }

  return error instanceof Error ? error.message : String(error)
}

export function registerOption(command: { option: (syntax: string, description?: string) => unknown }, option: CliOptionDefinition) {
  const flag = option.flag ?? option.name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
  const syntax = option.type === 'boolean'
    ? `--${flag}`
    : `--${flag} <${option.valueName ?? flag}>`
  const choices = option.choices?.filter(Boolean)
  const optionDescription = choices?.length
    ? `${option.description}（可选值: ${choices.join(', ')}）`
    : option.description

  command.option(syntax, optionDescription)
}

async function readInput(file?: string): Promise<string> {
  if (file) {
    return readFile(file, 'utf8')
  }

  if (process.stdin.isTTY) {
    throw new Error('请提供输入文件，或通过 stdin 传入内容')
  }

  let input = ''
  process.stdin.setEncoding('utf8')

  for await (const chunk of process.stdin) {
    input += String(chunk)
  }

  return input
}

async function writeOutput(output: string, file?: string) {
  if (file) {
    await writeFile(file, output)
    return
  }

  process.stdout.write(output)
}

export async function buildInput(definition: MarkdownToolDefinition, file: string | undefined, options: CliOptions): Promise<Record<string, unknown>> {
  const input: Record<string, unknown> = {
    [definition.cli.inputField]: await readInput(file),
  }

  for (const option of definition.cli.options) {
    if (option.input === false) {
      continue
    }

    const value = options[option.cliKey ?? option.name]
    if (value !== undefined) {
      input[option.name] = value
    }
  }

  if (definition.name === 'render') {
    const customCssFile = typeof options.customCssFile === 'string' && options.customCssFile.length > 0
      ? options.customCssFile
      : undefined

    if (customCssFile) {
      const customCss = typeof input.customCss === 'string' ? input.customCss : ''
      const fileCss = await readFile(customCssFile, 'utf8')
      input.customCss = [customCss, fileCss].filter(Boolean).join('\n')
    }
  }

  return input
}

export async function handleCommand(tool: CliTool, file: string | undefined, options: CliOptions) {
  const output = typeof options.output === 'string' && options.output.length > 0
    ? options.output
    : undefined
  const fix = options.fix === true

  if (tool.definition.name === 'lint' && fix) {
    if (!file) {
      throw new Error('--fix 需要提供输入文件')
    }

    if (output) {
      throw new Error('--fix 不能与 --output 同时使用')
    }
  }

  const input = await buildInput(tool.definition, file, options)
  const result = await tool.run(input)

  if (tool.definition.name === 'lint' && fix) {
    await writeOutput(result, file)
    return
  }

  await writeOutput(result, output)
}
