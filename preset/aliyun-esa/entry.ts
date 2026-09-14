import server from 'node_modules/.nitro/vite/services/ssr/index.js'
import { preloadEdgeKVEnv } from './env'

// ESA 按请求 CPU 计费（RoutineSpec 100ms）：Markdown 管线（unified/markdownlint 等）
// 若经 run() 内的 dynamic import 在请求里首次求值，冷 isolate 的首个 tools/call
// 就会顶爆规格上限被 599 强制终止。在入口顶层发起加载，求值发生在 isolate
// 启动阶段（microtask，早于首个 fetch 事件分发），不计入请求 CPU。
const pipelinesReady = Promise.all([
  import('@/lib/markdown/render/html'),
  import('@/lib/markdown/parse/html'),
  import('@/lib/markdown/extract/text'),
  import('@/lib/markdown/lint/markdown'),
])

export default {
  async fetch(request: Request) {
    await pipelinesReady
    await preloadEdgeKVEnv()
    // console.warn('Aliyun ESA fetch handler invoked')
    return server.fetch(request)
  },
}
