#!/usr/bin/env node

import type * as z from 'zod'
import type { CliOptionDefinition, MarkdownToolDefinition } from '../lib/markdown/definitions'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { cac } from 'cac'
import { ZodError } from 'zod'
import { description, version } from '../../package.json'
import { extractDefinition, lintDefinition, parseDefinition, renderDefinition } from '../lib/markdown/definitions'
import { extract } from '../lib/markdown/extract/text'
import { lint } from '../lib/markdown/lint/markdown'
import { parse } from '../lib/markdown/parse/html'
import { render } from '../lib/markdown/render/html'

type CliOptions = Record<string, unknown>
type CommandAction = () => Promise<void>

interface CliTool {
  definition: MarkdownToolDefinition
  run: (input: Record<string, unknown>) => Promise<string>
}

const cli = cac('bmmd')

const cliTools = [
  defineCliTool(renderDefinition, render),
  defineCliTool(parseDefinition, input => parse(input.html)),
  defineCliTool(extractDefinition, input => extract(input.markdown)),
  defineCliTool(lintDefinition, input => lint(input.markdown)),
] satisfies CliTool[]

function defineCliTool<TSchema extends z.ZodType>(
  definition: MarkdownToolDefinition & { inputSchema: TSchema },
  handler: (input: z.output<TSchema>) => Promise<string>,
): CliTool {
  return {
    definition,
    run: input => handler(definition.inputSchema.parse(input)),
  }
}

function run(action: CommandAction) {
  action().catch((error: unknown) => {
    console.error(`bmmd: ${formatError(error)}`)
    process.exitCode = 1
  })
}

function formatError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map(issue => `${issue.path.join('.') || 'input'}: ${issue.message}`)
      .join('\n')
  }

  return error instanceof Error ? error.message : String(error)
}

function registerOption(command: ReturnType<typeof cli.command>, option: CliOptionDefinition) {
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

async function buildInput(definition: MarkdownToolDefinition, file: string | undefined, options: CliOptions): Promise<Record<string, unknown>> {
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

async function handleCommand(tool: CliTool, file: string | undefined, options: CliOptions) {
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

for (const tool of cliTools) {
  const { definition } = tool
  const command = cli.command(`${definition.name} [${definition.cli.inputLabel}]`, definition.description)

  for (const option of definition.cli.options) {
    registerOption(command, option)
  }

  command.action((file: string | undefined, options: CliOptions) => run(() => handleCommand(tool, file, options)))
}

cli.help((sections) => {
  const helpDescription = cli.matchedCommandName && cli.matchedCommand?.description
    ? cli.matchedCommand.description
    : description
  const versionSectionIndex = sections.findIndex(section => section.body.includes(version))

  sections.splice(versionSectionIndex + 1, 0, { body: helpDescription })
})
cli.version(version, '--version')

if (process.argv.length <= 2) {
  cli.outputHelp()
}
else {
  cli.parse()
}
