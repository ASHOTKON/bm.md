export interface PlatformEnvironment {
  AliUid?: string
  HOME?: string
  TMPDIR?: string
}

export interface PlatformConfig {
  nitroPreset: string | undefined
  prerender: boolean
  pwaOutDir: 'dist/client' | '.output/public'
}

export function resolvePlatformConfig(environment: PlatformEnvironment): PlatformConfig {
  const isAliyunESA = Boolean(environment.AliUid)
  const isTencentEdgeOne = environment.HOME === '/dev/shm/home'
    && environment.TMPDIR === '/dev/shm/tmp'

  if (isAliyunESA) {
    return {
      nitroPreset: './preset/aliyun-esa/nitro.config.ts',
      prerender: true,
      pwaOutDir: 'dist/client',
    }
  }

  return {
    nitroPreset: isTencentEdgeOne
      ? './preset/tencent-edgeone/nitro.config.ts'
      : undefined,
    prerender: true,
    pwaOutDir: '.output/public',
  }
}
