import { describe, expect, it } from 'vitest'

import { resolvePlatformConfig } from './platform'

describe('resolvePlatformConfig', () => {
  it('默认使用 Nitro 自动检测', () => {
    expect(resolvePlatformConfig({}, 'github_actions')).toEqual({
      nitroPreset: undefined,
      prerender: true,
      pwaOutDir: '.output/public',
    })
  })

  it('在 Cloudflare Workers Builds 关闭预渲染', () => {
    expect(resolvePlatformConfig({}, 'cloudflare_workers')).toEqual({
      nitroPreset: undefined,
      prerender: false,
      pwaOutDir: '.output/public',
    })
  })

  it('存在 AliUid 时选择阿里云并保留预渲染与 PWA 输出目录', () => {
    expect(resolvePlatformConfig({ AliUid: '123' }, 'cloudflare_workers')).toEqual({
      nitroPreset: './preset/aliyun-esa/nitro.config.ts',
      prerender: true,
      pwaOutDir: 'dist/client',
    })
  })

  it('由 std-env 检测到腾讯 EdgeOne 时使用 Nitro 自动检测', () => {
    expect(resolvePlatformConfig({}, 'edgeone_pages')).toEqual({
      nitroPreset: undefined,
      prerender: false,
      pwaOutDir: '.edgeone/assets',
    })
  })
})
