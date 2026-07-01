import { handler as extract } from './extract'
import { handler as lint } from './lint'
import { handler as parse } from './parse'
import { previewHandler as preview, handler as render } from './render'

export const workerRouter = {
  markdown: {
    render,
    preview,
    parse,
    extract,
    lint,
  },
}
