import type { MarkdownToolName } from './definitions'
import { handler as extract } from './extract'
import { handler as lint } from './lint'
import { handler as parse } from './parse'
import { previewHandler as preview, handler as render } from './render'

const markdownHandlers = {
  render,
  parse,
  extract,
  lint,
} satisfies Record<MarkdownToolName, unknown>

export const router = {
  markdown: markdownHandlers,
}

export const workerRouter = {
  markdown: {
    ...markdownHandlers,
    preview,
  },
}
