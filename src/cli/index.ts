#!/usr/bin/env node

import type { CliTool } from './core'

import process from 'node:process'
import { cac } from 'cac'
import { description, version } from '../../package.json'
import { markdownTools } from '../lib/markdown/tools'
import { formatError, handleCommand, registerOption } from './core'

type CommandAction = () => Promise<void>

const cli = cac('bmmd')

const cliTools = markdownTools satisfies readonly CliTool[]

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
