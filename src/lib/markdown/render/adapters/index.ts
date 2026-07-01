import type { Pluggable } from 'unified'
import type { AdapterOptions, Platform, PlatformAdapter } from './types'
import { wechatAdapter } from './wechat'

const htmlAdapter: PlatformAdapter = {
  id: 'html',
  name: 'HTML',
  getPlugins: () => [],
}

const adapters: Record<Platform, PlatformAdapter> = {
  html: htmlAdapter,
  wechat: wechatAdapter,
  zhihu: { ...htmlAdapter, id: 'zhihu', name: '知乎' },
  juejin: { ...htmlAdapter, id: 'juejin', name: '掘金' },
}

export function getAdapterPlugins(platform: Platform, options?: AdapterOptions): Pluggable[] {
  return adapters[platform].getPlugins(options)
}

export { type AdapterOptions, type Platform, type PlatformAdapter, platforms } from './types'
