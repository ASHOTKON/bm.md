import server from 'node_modules/.nitro/vite/services/ssr/index.js'
import { preloadEdgeKVEnv } from './env'

// ESA 按请求 CPU 计费（RoutineSpec 100ms）：Markdown 管线（unified/markdownlint 等）
// 若经 run() 内的 dynamic import 在请求里首次求值，冷 isolate 的首个 tools/call
// 就会顶爆规格上限被 599 强制终止。顶层 await 保证求值发生在 isolate 就绪之前
// （fire-and-forget 的 promise 求值会被首个请求的 await 拉进计费窗口）。
// eslint-disable-next-line antfu/no-top-level-await -- 预热必须发生在 isolate 就绪之前
await Promise.all([
  import('@/lib/markdown/render/html'),
  import('@/lib/markdown/parse/html'),
  import('@/lib/markdown/extract/text'),
  import('@/lib/markdown/lint/markdown'),
])

export default {
  async fetch(request: Request) {
    await preloadEdgeKVEnv()
    // console.warn('Aliyun ESA fetch handler invoked')
    return server.fetch(request)
  },
}
