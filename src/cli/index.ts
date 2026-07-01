#!/usr/bin/env node

import type { CliTool } from './core'

import process from 'node:process'
import { cac } from 'cac'
import { description, version } from '../../package.json'
import { extractDefinition, lintDefinition, parseDefinition, renderDefinition } from '../lib/markdown/definitions'
import { extract } from '../lib/markdown/extract/text'
import { lint } from '../lib/markdown/lint/markdown'
import { parse } from '../lib/markdown/parse/html'
import { render } from '../lib/markdown/render/html'
import { defineCliTool, formatError, handleCommand, registerOption } from './core'

type CommandAction = () => Promise<void>

const cli = cac('bmmd')

const cliTools = [
  defineCliTool(renderDefinition, render),
  defineCliTool(parseDefinition, input => parse(input.html)),
  defineCliTool(extractDefinition, input => extract(input.markdown)),
  defineCliTool(lintDefinition, input => lint(input.markdown)),
] satisfies CliTool[]

function run(action: CommandAction) {
  action().catch((error: unknown) => {
    console.error(`bmmd: ${formatError(error)}`)
    process.exitCode = 1
  })
}

for (const tool of cliTools) {
  const { definition } = tool
  const command = cli.command(`${definition.name} [${definition.cli.inputLabel}]`, definition.description)

  for (const option of definition.cli.options) {
    registerOption(command, option)
  }

  command.action((file: string | undefined, options: Record<string, unknown>) => run(() => handleCommand(tool, file, options)))
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
