import type { ProviderName } from 'std-env'

import { provider } from 'std-env'

export interface PlatformEnvironment {
  AliUid?: string
}

export interface PlatformConfig {
  nitroPreset: string | undefined
  prerender: boolean
  pwaOutDir: 'dist/client' | '.edgeone/assets' | '.output/public'
}

export function resolvePlatformConfig(
  environment: PlatformEnvironment,
  detectedProvider: ProviderName = provider,
): PlatformConfig {
  const isAliyunESA = Boolean(environment.AliUid)
  const isTencentEdgeOne = detectedProvider === 'edgeone_pages'

  if (isAliyunESA) {
    return {
      nitroPreset: './preset/aliyun-esa/nitro.config.ts',
      prerender: true,
      pwaOutDir: 'dist/client',
    }
  }

  if (isTencentEdgeOne) {
    return {
      nitroPreset: undefined,
      prerender: false,
      pwaOutDir: '.edgeone/assets',
    }
  }

  return {
    nitroPreset: undefined,
    prerender: detectedProvider !== 'cloudflare_workers',
    pwaOutDir: '.output/public',
  }
}
